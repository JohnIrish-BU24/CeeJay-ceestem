const db = require('../config/db');

// 1. Get the Employee Master Directory (Combines Employee and Job Role details)
exports.getAllEmployees = async (req, res) => {
    try {
        const queryText = `
            SELECT e.Emp_ID, e.Emp_LName, e.Emp_FName, e.Role_ID, jr.Salary, jr.Quota, jr.Incentive_Rate
            FROM EMPLOYEE e
            JOIN JOB_ROLE jr ON e.Role_ID = jr.Role_ID
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve employee directory", details: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    const { Emp_ID, Role_ID, Emp_LName, Emp_FName, Contact_Num } = req.body;

    // Base structure validation
    if (!Emp_ID || !Role_ID || !Emp_LName || !Emp_FName) {
        return res.status(400).json({ error: "Missing required core employee fields." });
    }

    const validRoles = ['D', 'R'];
    if (!validRoles.includes(Role_ID)) {
        return res.status(400).json({ error: "Invalid Role ID. Must be 'D' or 'R'." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Insert into core EMPLOYEE table
            const empQuery = `INSERT INTO EMPLOYEE (Emp_ID, Role_ID, Emp_LName, Emp_FName) VALUES (?, ?, ?, ?)`;
            await connection.query(empQuery, [Emp_ID, Role_ID, Emp_LName, Emp_FName]);

            // 2. Insert contact number if provided, stripping all non-digits (hyphens, spaces)
            if (Contact_Num) {
                const cleanContactNum = String(Contact_Num).replace(/\D/g, '');
                
                // Randomly generate an entry ID or pass an explicit one for the phone associative record
                const numQuery = `INSERT INTO EMPLOYEE_NUM (Num_ID, Emp_ID, Contact_Num) VALUES (?, ?, ?)`;
                // Generates a simple timestamp-based ID for testing convenience
                const generatedNumId = Math.floor(Date.now() / 1000); 
                await connection.query(numQuery, [generatedNumId, Emp_ID, cleanContactNum]);
            }

            await connection.commit();
            res.status(201).json({ message: "Employee profile successfully initialized with clean numeric contact info!" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Database entity insertion failure", details: error.message });
    }
};