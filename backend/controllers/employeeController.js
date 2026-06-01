const db = require('../config/db');

exports.getAllEmployees = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                e.Emp_ID, e.Emp_LName, e.Emp_FName, e.Role_ID, 
                jr.Salary, jr.Quota, jr.Incentive_Rate,
                en.Contact_Num,
                d.License_Num, d.License_Exp
            FROM EMPLOYEE e
            JOIN JOB_ROLE jr ON e.Role_ID = jr.Role_ID
            LEFT JOIN EMPLOYEE_NUM en ON e.Emp_ID = en.Emp_ID
            LEFT JOIN DRIVER d ON e.Emp_ID = d.Emp_ID
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve employee directory", details: error.message });
    }
};

exports.getRoles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM JOB_ROLE');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve roles", details: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    const { Emp_ID, Role_ID, Emp_LName, Emp_FName, Contact_Num, License_Num, License_Exp } = req.body;

    if (!Emp_ID || !Role_ID || !Emp_LName || !Emp_FName) {
        return res.status(400).json({ error: "Missing required core employee fields." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const empQuery = `INSERT INTO EMPLOYEE (Emp_ID, Role_ID, Emp_LName, Emp_FName) VALUES (?, ?, ?, ?)`;
            await connection.query(empQuery, [Emp_ID, Role_ID, Emp_LName, Emp_FName]);

            if (Role_ID === 'D') {
                await connection.query(`INSERT INTO DRIVER (Emp_ID, License_Num, License_Exp) VALUES (?, ?, ?)`, [Emp_ID, License_Num, License_Exp]);
            } else if (Role_ID === 'R') {
                await connection.query(`INSERT INTO REFILLER (Emp_ID) VALUES (?)`, [Emp_ID]);
            }

            if (Contact_Num) {
                const cleanContactNum = String(Contact_Num).replace(/\D/g, '');
                const numQuery = `INSERT INTO EMPLOYEE_NUM (Num_ID, Emp_ID, Contact_Num) VALUES (?, ?, ?)`;
                const generatedNumId = Math.floor(Date.now() / 1000); 
                await connection.query(numQuery, [generatedNumId, Emp_ID, cleanContactNum]);
            }

            await connection.commit();
            res.status(201).json({ message: "Employee profile successfully initialized!" });
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

exports.loginEmployee = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Query database for matching Emp_ID and Password
        const [rows] = await db.query(
            'SELECT Emp_ID, Role_ID FROM EMPLOYEE WHERE Emp_ID = ? AND Password = ?', 
            [username, password]
        );
        if (rows.length > 0) {
            res.json({ success: true, role: 'employee', employeeData: rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid ID or Password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📍 Fetch only employees who are Refillers (Role_ID = 'R')
exports.getRefillers = async (req, res) => {
    try {
        const queryText = `
            SELECT Emp_ID, Emp_FName, Emp_LName 
            FROM EMPLOYEE 
            WHERE Role_ID = 'R' AND Status = 'Active'
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching refillers:", error);
        res.status(500).json({ error: "Failed to fetch refillers." });
    }
};

exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { Role_ID, Emp_LName, Emp_FName, Contact_Num, License_Num, License_Exp } = req.body;

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(`UPDATE EMPLOYEE SET Role_ID = ?, Emp_LName = ?, Emp_FName = ? WHERE Emp_ID = ?`, [Role_ID, Emp_LName, Emp_FName, id]);

            if (Contact_Num !== undefined) {
                const cleanContactNum = String(Contact_Num).replace(/\D/g, '');
                const [existing] = await connection.query('SELECT * FROM EMPLOYEE_NUM WHERE Emp_ID = ?', [id]);
                if (existing.length > 0) {
                    await connection.query('UPDATE EMPLOYEE_NUM SET Contact_Num = ? WHERE Emp_ID = ?', [cleanContactNum, id]);
                } else {
                    const generatedNumId = Math.floor(Date.now() / 1000);
                    await connection.query('INSERT INTO EMPLOYEE_NUM (Num_ID, Emp_ID, Contact_Num) VALUES (?, ?, ?)', [generatedNumId, id, cleanContactNum]);
                }
            }

            if (Role_ID === 'D') {
                await connection.query('DELETE FROM REFILLER WHERE Emp_ID = ?', [id]);
                const [existingDriver] = await connection.query('SELECT * FROM DRIVER WHERE Emp_ID = ?', [id]);
                if (existingDriver.length > 0) {
                    await connection.query('UPDATE DRIVER SET License_Num = ?, License_Exp = ? WHERE Emp_ID = ?', [License_Num, License_Exp, id]);
                } else {
                    await connection.query('INSERT INTO DRIVER (Emp_ID, License_Num, License_Exp) VALUES (?, ?, ?)', [id, License_Num, License_Exp]);
                }
            } else if (Role_ID === 'R') {
                await connection.query('DELETE FROM DRIVER WHERE Emp_ID = ?', [id]);
                const [existingRefiller] = await connection.query('SELECT * FROM REFILLER WHERE Emp_ID = ?', [id]);
                if (existingRefiller.length === 0) {
                    await connection.query('INSERT INTO REFILLER (Emp_ID) VALUES (?)', [id]);
                }
            }

            await connection.commit();
            res.status(200).json({ message: "Employee updated successfully" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update employee", details: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // Delete from all child tables first to prevent Foreign Key constraint errors
            await connection.query('DELETE FROM EMPLOYEE_NUM WHERE Emp_ID = ?', [id]);
            await connection.query('DELETE FROM WORK_DETAIL WHERE Emp_ID = ?', [id]); // Clear trans ties
            await connection.query('DELETE FROM PAYROLL_RECORD WHERE Emp_ID = ?', [id]); // Clear payroll ties
            await connection.query('DELETE FROM DRIVER WHERE Emp_ID = ?', [id]);
            await connection.query('DELETE FROM REFILLER WHERE Emp_ID = ?', [id]);
            
            // Finally delete the core employee
            const [result] = await connection.query('DELETE FROM EMPLOYEE WHERE Emp_ID = ?', [id]);
            
            await connection.commit();
            if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found." });
            res.status(200).json({ message: "Employee successfully deleted." });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: "Database entity deletion failure", details: error.message });
    }
};