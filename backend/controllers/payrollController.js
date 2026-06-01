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

// Create a new Payroll record
exports.createPayroll = async (req, res) => {
    const { Emp_ID, Start_Date, End_Date, Total_Incentive, Loan, Net_Pay } = req.body;

    if (!Emp_ID || !Start_Date || !End_Date || Net_Pay === undefined) {
        return res.status(400).json({ error: "Missing required core payroll fields." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Manual Auto-Increment to prevent Primary Key '0' crash
            const [maxResult] = await connection.query('SELECT MAX(Payroll_ID) as maxId FROM PAYROLL_RECORD');
            let nextId = (maxResult[0].maxId || 0) + 1;

            const queryText = `
                INSERT INTO PAYROLL_RECORD (Payroll_ID, Emp_ID, Start_Date, End_Date, Total_Incentive, Loan, Net_Pay, Status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
            `;
            await connection.query(queryText, [nextId, Emp_ID, Start_Date, End_Date, Total_Incentive || 0, Loan || 0, Net_Pay]);

            await connection.commit();
            res.status(201).json({ message: "Payroll record generated successfully!" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Database insertion failure", details: error.message });
    }
};

// Update existing Payroll (calculates new totals)
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
        // We run an UPDATE instead of a DELETE
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