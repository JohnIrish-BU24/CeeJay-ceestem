const db = require('../config/db');

// Get all Active or Archived payrolls
exports.getPayrolls = async (req, res) => {
    const status = req.query.status || 'Active'; // Defaults to Active
    try {
        const queryText = `
            SELECT 
                p.Payroll_ID, p.Emp_ID, 
                DATE_FORMAT(p.Start_Date, '%Y-%m-%d') AS Start_Date, 
                DATE_FORMAT(p.End_Date, '%Y-%m-%d') AS End_Date, 
                p.Days_Worked, p.Gross_Income,
                p.Total_Incentive, p.Loan, p.Net_Pay, p.Status,
                e.Emp_FName, e.Emp_LName, e.Role_ID,
                r.Salary
            FROM PAYROLL_RECORD p
            JOIN EMPLOYEE e ON p.Emp_ID = e.Emp_ID
            JOIN JOB_ROLE r ON e.Role_ID = r.Role_ID
            WHERE p.Status = ?
            ORDER BY p.Start_Date DESC
        `;
        const [rows] = await db.query(queryText, [status]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve payrolls", details: error.message });
    }
};

// Create a new Payroll record
exports.createPayroll = async (req, res) => {
    const { Emp_ID, Start_Date, End_Date, Loan } = req.body;
    const loanAmount = parseFloat(Loan) || 0;

    if (!Emp_ID || !Start_Date || !End_Date) {
        return res.status(400).json({ error: "Missing required fields: Emp_ID, Start_Date, End_Date." });
    }

    // BUG 5 FIX: Duplicate payroll guard
    const [existing] = await db.query(
        `SELECT Payroll_ID FROM PAYROLL_RECORD 
         WHERE Emp_ID = ? AND Start_Date = ? AND End_Date = ? AND Status != 'Archived'`,
        [Emp_ID, Start_Date, End_Date]
    );
    if (existing.length > 0) {
        return res.status(400).json({ error: "Duplicate Error: A payroll record already exists for this employee within these exact dates." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [roleData] = await connection.query(`
                SELECT r.Salary, r.Quota, r.Incentive_Rate 
                FROM EMPLOYEE e 
                JOIN JOB_ROLE r ON e.Role_ID = r.Role_ID 
                WHERE e.Emp_ID = ?
            `, [Emp_ID]);

            if (roleData.length === 0) throw new Error("Employee or Job Role not found.");
            const { Salary, Quota, Incentive_Rate } = roleData[0];

            // BUG 1 FIX: Added "AND tr.Status = 'Valid'" to ignore voided transactions
            const performanceQuery = `
                SELECT 
                    COUNT(Daily_Output.Work_Date) as Valid_Days,
                    COALESCE(SUM(Daily_Output.Daily_Total), 0) as Total_Gallons
                FROM (
                    SELECT 
                        DATE(tr.Trans_Date) as Work_Date, 
                        SUM(td.Quantity) as Daily_Total
                    FROM TRANS_RECORD tr
                    JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
                    JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
                    WHERE wd.Emp_ID = ? 
                      AND DATE(tr.Trans_Date) BETWEEN ? AND ? 
                      AND tr.Status = 'Valid'
                    GROUP BY DATE(tr.Trans_Date)
                    HAVING SUM(td.Quantity) > 0
                ) as Daily_Output;
            `;
            
            const [perfData] = await connection.query(performanceQuery, [Emp_ID, Start_Date, End_Date]);
            
            const validDays = perfData[0].Valid_Days || 0;
            const totalGallons = perfData[0].Total_Gallons || 0;

            const totalBasePay = validDays * Salary;
            const totalQuota = validDays * Quota;
            const excessGallons = totalGallons - totalQuota;
            
            let totalIncentive = 0;
            if (excessGallons > 0) {
                totalIncentive = excessGallons * Incentive_Rate;
            }

            const netPay = totalBasePay + totalIncentive - loanAmount;

            // BUG 2 FIX: Added FOR UPDATE to lock the row and prevent race conditions
            const [maxResult] = await connection.query('SELECT MAX(Payroll_ID) as maxId FROM PAYROLL_RECORD FOR UPDATE');
            let nextId = (maxResult[0].maxId || 0) + 1;

            const insertQuery = `
                INSERT INTO PAYROLL_RECORD 
                (Payroll_ID, Emp_ID, Start_Date, End_Date, Days_Worked, Gross_Income, Total_Incentive, Loan, Net_Pay, Status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
            `;
            await connection.query(insertQuery, [nextId, Emp_ID, Start_Date, End_Date, validDays, totalBasePay, totalIncentive, loanAmount, netPay]);

            await connection.commit();
            
            res.status(201).json({ 
                message: "Payroll record generated successfully!",
                computation: { Valid_Days: validDays, Total_Gallons: totalGallons, Base_Pay: totalBasePay, Total_Incentive: totalIncentive, Loan: loanAmount, Net_Pay: netPay }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to generate payroll", details: error.message });
    }
};

// Update existing Payroll
exports.updatePayroll = async (req, res) => {
    const { id } = req.params;
    // BUG 3 FIX: Net_Pay is removed from the payload extraction. We do not trust the client.
    const { Start_Date, End_Date, Total_Incentive, Loan } = req.body;
    
    const manualIncentive = parseFloat(Total_Incentive) || 0;
    const manualLoan = parseFloat(Loan) || 0;

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Fetch current Emp_ID to recalculate base logic
            const [payrollData] = await connection.query(`SELECT Emp_ID FROM PAYROLL_RECORD WHERE Payroll_ID = ?`, [id]);
            if (payrollData.length === 0) throw new Error("Payroll record not found.");
            const Emp_ID = payrollData[0].Emp_ID;

            const [roleData] = await connection.query(`
                SELECT r.Salary FROM EMPLOYEE e JOIN JOB_ROLE r ON e.Role_ID = r.Role_ID WHERE e.Emp_ID = ?
            `, [Emp_ID]);
            const Salary = roleData[0].Salary;

            // BUG 4 FIX: Completely recalculate Days_Worked using the new modified dates
            const performanceQuery = `
                SELECT COUNT(Daily_Output.Work_Date) as Valid_Days
                FROM (
                    SELECT DATE(tr.Trans_Date) as Work_Date
                    FROM TRANS_RECORD tr
                    JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
                    JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
                    WHERE wd.Emp_ID = ? 
                      AND DATE(tr.Trans_Date) BETWEEN ? AND ? 
                      AND tr.Status = 'Valid'
                    GROUP BY DATE(tr.Trans_Date)
                    HAVING SUM(td.Quantity) > 0
                ) as Daily_Output;
            `;
            const [perfData] = await connection.query(performanceQuery, [Emp_ID, Start_Date, End_Date]);
            
            const newValidDays = perfData[0].Valid_Days || 0;
            const newGrossIncome = newValidDays * Salary;
            
            // BUG 3 FIX: System calculated Net_Pay
            const verifiedNetPay = newGrossIncome + manualIncentive - manualLoan;

            const updateQuery = `
                UPDATE PAYROLL_RECORD 
                SET Start_Date = ?, End_Date = ?, Days_Worked = ?, Gross_Income = ?, Total_Incentive = ?, Loan = ?, Net_Pay = ?
                WHERE Payroll_ID = ?
            `;
            await connection.query(updateQuery, [Start_Date, End_Date, newValidDays, newGrossIncome, manualIncentive, manualLoan, verifiedNetPay, id]);

            await connection.commit();
            res.json({ message: "Payroll profile modified and recalculated successfully!" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update payroll record", details: error.message });
    }
};

// Soft Delete (Archive) a Payroll
exports.archivePayroll = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = `UPDATE PAYROLL_RECORD SET Status = 'Archived' WHERE Payroll_ID = ?`;
        await db.query(queryText, [id]);
        res.json({ message: "Payroll record archived successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to archive payroll", details: error.message });
    }
};

// Restore an Archived Payroll
exports.restorePayroll = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = `UPDATE PAYROLL_RECORD SET Status = 'Active' WHERE Payroll_ID = ?`;
        await db.query(queryText, [id]);
        res.json({ message: "Payroll record restored successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to restore payroll", details: error.message });
    }
};