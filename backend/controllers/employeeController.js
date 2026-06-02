const db = require('../config/db');

exports.getAllEmployees = async (req, res) => {
    // 1. Extract the status from the URL query, defaulting to 'Active'
    const { status } = req.query;
    const filterStatus = status || 'Active';

    try {
        const queryText = `
            SELECT 
                e.Emp_ID, e.Emp_LName, e.Emp_FName, e.Role_ID, e.Status, 
                jr.Salary, jr.Quota, jr.Incentive_Rate,
                GROUP_CONCAT(en.Contact_Num SEPARATOR ', ') as Contact_Num,
                d.License_Num, d.License_Exp
            FROM EMPLOYEE e
            JOIN JOB_ROLE jr ON e.Role_ID = jr.Role_ID
            LEFT JOIN EMPLOYEE_NUM en ON e.Emp_ID = en.Emp_ID
            LEFT JOIN DRIVER d ON e.Emp_ID = d.Emp_ID
            WHERE e.Status = ? -- 2. Filter by the requested status here
            GROUP BY 
                e.Emp_ID, e.Emp_LName, e.Emp_FName, e.Role_ID, e.Status,
                jr.Salary, jr.Quota, jr.Incentive_Rate, 
                d.License_Num, d.License_Exp
        `;
        
        // 3. Pass the filterStatus into the query
        const [rows] = await db.query(queryText, [filterStatus]);
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

            // --- MANUAL AUTO-INCREMENT LOGIC ---
            if (Contact_Num) {
                const [maxResult] = await connection.query('SELECT MAX(Num_ID) as maxId FROM EMPLOYEE_NUM');
                let nextNumId = (maxResult[0].maxId || 0) + 1;

                const contactsArray = String(Contact_Num).split(',').map(c => c.trim()).filter(Boolean);
                
                for (const contact of contactsArray) {
                    const cleanContactNum = contact.replace(/\D/g, '');
                    if (cleanContactNum) {
                        const numQuery = `INSERT INTO EMPLOYEE_NUM (Num_ID, Emp_ID, Contact_Num) VALUES (?, ?, ?)`;
                        await connection.query(numQuery, [nextNumId, Emp_ID, cleanContactNum]);
                        nextNumId++; 
                    }
                }
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
                await connection.query('DELETE FROM EMPLOYEE_NUM WHERE Emp_ID = ?', [id]);
                const [maxResult] = await connection.query('SELECT MAX(Num_ID) as maxId FROM EMPLOYEE_NUM');
                let nextNumId = (maxResult[0].maxId || 0) + 1;

                const contactsArray = String(Contact_Num).split(',').map(c => c.trim()).filter(Boolean);
                for (const contact of contactsArray) {
                    const cleanContactNum = contact.replace(/\D/g, '');
                    if (cleanContactNum) {
                        await connection.query('INSERT INTO EMPLOYEE_NUM (Num_ID, Emp_ID, Contact_Num) VALUES (?, ?, ?)', [nextNumId, id, cleanContactNum]);
                        nextNumId++;
                    }
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
        let customMessage = "Failed to update employee";
        if (error.code === 'ER_DUP_ENTRY') customMessage = "Duplicate Entry Detected: The contact number or license number you entered is already registered to another employee.";
        else if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') customMessage = "Validation Error: Ensure contact numbers are exactly 11 digits and start with 09.";
        else if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_WRONG_VALUE') customMessage = "Data Format Error: Check the expiry date or number formatting.";
        res.status(500).json({ error: customMessage, details: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM EMPLOYEE_NUM WHERE Emp_ID = ?', [id]);
            await connection.query('DELETE FROM WORK_DETAIL WHERE Emp_ID = ?', [id]); 
            await connection.query('DELETE FROM PAYROLL_RECORD WHERE Emp_ID = ?', [id]); 
            await connection.query('DELETE FROM DRIVER WHERE Emp_ID = ?', [id]);
            await connection.query('DELETE FROM REFILLER WHERE Emp_ID = ?', [id]);
            
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

// NEW: Function to handle updating the job role configurations
exports.updateRole = async (req, res) => {
    const { id } = req.params; 
    const { Salary, Quota, Incentive_Rate } = req.body;

    try {
        const query = `
            UPDATE JOB_ROLE 
            SET Salary = ?, Quota = ?, Incentive_Rate = ? 
            WHERE Role_ID = ?
        `;
        await db.query(query, [Salary, Quota, Incentive_Rate, id]);
        res.status(200).json({ message: "Job role updated successfully" });
    } catch (error) {
        console.error("Error updating job role:", error);
        res.status(500).json({ error: "Failed to update job role" });
    }
};