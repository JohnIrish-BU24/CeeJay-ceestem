const db = require('../config/db');

// Get all Active or Archived payrolls
exports.getPayrolls = async (req, res) => {
    const status = req.query.status || 'Active'; // Defaults to Active
    try {
        const queryText = `
            SELECT 
                p.Payroll_ID, p.Emp_ID, p.Start_Date, p.End_Date, 
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

// Create a new Payroll record (Automatically computes calculations)
exports.createPayroll = async (req, res) => {
    // We no longer require the frontend to pass Net_Pay or Total_Incentive.
    // The frontend only needs to send Emp_ID, Start_Date, End_Date, and Loan (optional).
    const { Emp_ID, Start_Date, End_Date, Loan } = req.body;
    const loanAmount = Loan || 0;

    if (!Emp_ID || !Start_Date || !End_Date) {
        return res.status(400).json({ error: "Missing required fields: Emp_ID, Start_Date, End_Date." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Fetch Employee Role details (Salary, Quota, Incentive_Rate)
            const [roleData] = await connection.query(`
                SELECT r.Salary, r.Quota, r.Incentive_Rate 
                FROM EMPLOYEE e 
                JOIN JOB_ROLE r ON e.Role_ID = r.Role_ID 
                WHERE e.Emp_ID = ?
            `, [Emp_ID]);

            if (roleData.length === 0) {
                throw new Error("Employee or Job Role not found.");
            }

            const { Salary, Quota, Incentive_Rate } = roleData[0];

            // 2. Calculate Valid Working Days and Total Gallons (Only counting days > 0 deliveries)
            const performanceQuery = `
                SELECT 
                    COUNT(Daily_Output.Trans_Date) as Valid_Days,
                    COALESCE(SUM(Daily_Output.Daily_Total), 0) as Total_Gallons
                FROM (
                    SELECT 
                        tr.Trans_Date, 
                        SUM(td.Quantity) as Daily_Total
                    FROM TRANS_RECORD tr
                    JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
                    WHERE tr.Emp_ID = ? AND tr.Trans_Date BETWEEN ? AND ?
                    GROUP BY tr.Trans_Date
                    HAVING SUM(td.Quantity) > 0
                ) as Daily_Output;
            `;
            
            const [perfData] = await connection.query(performanceQuery, [Emp_ID, Start_Date, End_Date]);
            
            const validDays = perfData[0].Valid_Days || 0;
            const totalGallons = perfData[0].Total_Gallons || 0;

            // 3. Execute the strict Pay-Period Math Logic
            const totalBasePay = validDays * Salary;
            const totalQuota = validDays * Quota;
            const excessGallons = totalGallons - totalQuota;
            
            let totalIncentive = 0;
            if (excessGallons > 0) {
                totalIncentive = excessGallons * Incentive_Rate;
            }

            const netPay = totalBasePay + totalIncentive - loanAmount;

            // 4. Manual Auto-Increment and Database Insertion
            const [maxResult] = await connection.query('SELECT MAX(Payroll_ID) as maxId FROM PAYROLL_RECORD');
            let nextId = (maxResult[0].maxId || 0) + 1;

            const insertQuery = `
                INSERT INTO PAYROLL_RECORD (Payroll_ID, Emp_ID, Start_Date, End_Date, Total_Incentive, Loan, Net_Pay, Status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
            `;
            await connection.query(insertQuery, [nextId, Emp_ID, Start_Date, End_Date, totalIncentive, loanAmount, netPay]);

            await connection.commit();
            
            // Return success with computation summary so the frontend can display the math if needed
            res.status(201).json({ 
                message: "Payroll record generated successfully!",
                computation: {
                    Valid_Days: validDays,
                    Total_Gallons: totalGallons,
                    Base_Pay: totalBasePay,
                    Total_Incentive: totalIncentive,
                    Loan: loanAmount,
                    Net_Pay: netPay
                }
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

// Update existing Payroll (Allows manual override of calculated totals)
exports.updatePayroll = async (req, res) => {
    const { id } = req.params;
    const { Start_Date, End_Date, Total_Incentive, Loan, Net_Pay } = req.body;

    try {
        const queryText = `
            UPDATE PAYROLL_RECORD 
            SET Start_Date = ?, End_Date = ?, Total_Incentive = ?, Loan = ?, Net_Pay = ?
            WHERE Payroll_ID = ?
        `;
        await db.query(queryText, [Start_Date, End_Date, Total_Incentive, Loan, Net_Pay, id]);
        res.json({ message: "Payroll profile modified successfully!" });
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