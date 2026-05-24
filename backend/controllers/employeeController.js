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

// 2. Onboard a new employee profile
exports.createEmployee = async (req, res) => {
    const { Emp_ID, Role_ID, Emp_LName, Emp_FName } = req.body;

    // Base structure validation validation
    if (!Emp_ID || !Role_ID || !Emp_LName || !Emp_FName) {
        return res.status(400).json({ error: "Missing required core employee fields." });
    }

    // Business Rule Validation: Must strictly match your supertype/subtype constraints ('D' or 'R')
    const validRoles = ['D', 'R'];
    if (!validRoles.includes(Role_ID)) {
        return res.status(400).json({ error: "Invalid Role ID. Employee specialization must strictly be 'D' (Driver) or 'R' (Refiller)." });
    }

    try {
        const queryText = `
            INSERT INTO EMPLOYEE (Emp_ID, Role_ID, Emp_LName, Emp_FName) 
            VALUES (?, ?, ?, ?)
        `;
        await db.query(queryText, [Emp_ID, Role_ID, Emp_LName, Emp_FName]);
        res.status(201).json({ message: "Employee profile successfully initialized!" });
    } catch (error) {
        res.status(500).json({ error: "Database entity insertion failure", details: error.message });
    }
};