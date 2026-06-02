const db = require('../config/db');

// 1. Get the Customer Master List (Combines Customer, Barangay, and Contact details)
exports.getAllCustomers = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                c.Cust_ID, c.Barangay_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type, c.Borrowed_Cont, 
                b.Barangay_Name, b.Purok,
                GROUP_CONCAT(cn.Contact_Num SEPARATOR ', ') as Contact_Num
            FROM CUSTOMER c
            JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
            GROUP BY 
                c.Cust_ID, c.Barangay_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type, c.Borrowed_Cont, 
                b.Barangay_Name, b.Purok
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve customer directory", details: error.message });
    }
};

// 2. Add a new customer profile with strict operational validation rules
exports.createCustomer = async (req, res) => {
    const { Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont, Contact_Num } = req.body;

    // Base structural validation for required relational fields
    if (!Cust_ID || !Barangay_ID || !Cust_LName || !Cust_FName || !Cust_Type) {
        return res.status(400).json({ error: "Missing required core customer fields." });
    }

    const validTypes = ['Personal', 'Reseller'];
    if (!validTypes.includes(Cust_Type)) {
        return res.status(400).json({ error: "Invalid Customer Type. Field must strictly be 'Personal' or 'Reseller'." });
    }

    const borrowedCountValue = Borrowed_Cont || 0;
    if (Cust_Type === 'Reseller' && borrowedCountValue > 11) {
        return res.status(400).json({ error: "Reseller asset loan tracking constraint cannot exceed an 11-container limit." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const queryText = `
                INSERT INTO CUSTOMER (Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(queryText, [Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue]);

            // --- MANUAL AUTO-INCREMENT LOGIC ---
            if (Contact_Num) {
                const [maxResult] = await connection.query('SELECT MAX(Num_ID) as maxId FROM CUSTOMER_NUM');
                let nextNumId = (maxResult[0].maxId || 0) + 1;

                const contactsArray = String(Contact_Num).split(',').map(c => c.trim()).filter(Boolean);
                
                for (const contact of contactsArray) {
                    const cleanContactNum = contact.replace(/\D/g, ''); // Strip out symbols
                    if (cleanContactNum) {
                        const numQuery = `INSERT INTO CUSTOMER_NUM (Num_ID, Cust_ID, Contact_Num) VALUES (?, ?, ?)`;
                        await connection.query(numQuery, [nextNumId, Cust_ID, cleanContactNum]);
                        nextNumId++; 
                    }
                }
            }

            await connection.commit();
            res.status(201).json({ message: "Customer profile onboarded successfully!" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        let customMessage = "Database entity insertion failure";
        
        if (error.code === 'ER_DUP_ENTRY') {
            customMessage = "Duplicate Entry Detected: The Customer ID or Contact Number is already registered.";
        } else if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
            customMessage = "Validation Error: Ensure contact numbers are exactly 11 digits and start with 09.";
        }

        res.status(400).json({ error: customMessage, details: error.message });
    }
};

// 3. Update an existing customer profile
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont, Contact_Num } = req.body;

    if (!Barangay_ID || !Cust_LName || !Cust_FName || !Cust_Type) {
        return res.status(400).json({ error: "Missing required core customer fields." });
    }

    const validTypes = ['Personal', 'Reseller'];
    if (!validTypes.includes(Cust_Type)) {
        return res.status(400).json({ error: "Invalid Customer Type. Field must strictly be 'Personal' or 'Reseller'." });
    }

    const borrowedCountValue = Borrowed_Cont || 0;
    if (Cust_Type === 'Reseller' && borrowedCountValue > 11) {
        return res.status(400).json({ error: "Reseller asset loan tracking constraint cannot exceed an 11-container limit." });
    }

    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const queryText = `
                UPDATE CUSTOMER 
                SET Barangay_ID = ?, Cust_LName = ?, Cust_FName = ?, Cust_Type = ?, Borrowed_Cont = ? 
                WHERE Cust_ID = ?
            `;
            await connection.query(queryText, [Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue, id]);

            // --- MANUAL AUTO-INCREMENT LOGIC ---
            if (Contact_Num !== undefined) {
                // Clear existing numbers to prep for the new incoming array
                await connection.query('DELETE FROM CUSTOMER_NUM WHERE Cust_ID = ?', [id]);
                
                const [maxResult] = await connection.query('SELECT MAX(Num_ID) as maxId FROM CUSTOMER_NUM');
                let nextNumId = (maxResult[0].maxId || 0) + 1;

                const contactsArray = String(Contact_Num).split(',').map(c => c.trim()).filter(Boolean);
                for (const contact of contactsArray) {
                    const cleanContactNum = contact.replace(/\D/g, '');
                    if (cleanContactNum) {
                        await connection.query('INSERT INTO CUSTOMER_NUM (Num_ID, Cust_ID, Contact_Num) VALUES (?, ?, ?)', [nextNumId, id, cleanContactNum]);
                        nextNumId++;
                    }
                }
            }

            await connection.commit();
            res.json({ message: "Customer profile modified successfully!" });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        let customMessage = "Failed to update customer record";
        
        if (error.code === 'ER_DUP_ENTRY') {
            customMessage = "Duplicate Entry Detected: The Contact Number you entered is already registered to another customer.";
        } else if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
            customMessage = "Validation Error: Ensure contact numbers are exactly 11 digits and start with 09.";
        }

        res.status(400).json({ error: customMessage, details: error.message });
    }
};

// 4. Delete an existing customer record
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Clear child data first so the Customer can be safely deleted
            await connection.query('DELETE FROM CUSTOMER_NUM WHERE Cust_ID = ?', [id]);
            
            const queryText = 'DELETE FROM CUSTOMER WHERE Cust_ID = ?';
            const [result] = await connection.query(queryText, [id]);

            await connection.commit();
            
            if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found." });
            res.json({ message: "Customer record removed successfully." });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete this customer because they are linked to active transaction logs." });
        }
        res.status(500).json({ error: "Failed to complete deletion process", details: error.message });
    }
};
// backend/controllers/customerController.js

exports.searchCustomer = async (req, res) => {
    const { lname, fname } = req.query;
    try {
        let queryText = `
            SELECT 
                c.Cust_ID, 
                c.Barangay_ID, 
                c.Cust_LName, 
                c.Cust_FName, 
                c.Cust_Type, 
                b.Barangay_Name, 
                b.Purok,
                GROUP_CONCAT(cn.Contact_Num SEPARATOR ',') AS Contact_Nums
            FROM CUSTOMER c
            JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
        `;
        
        const params = [];

        // 📍 Search strictly by the column requested by the frontend
        if (lname) {
            queryText += ` WHERE c.Cust_LName LIKE ?`;
            params.push(`${lname}%`);
        } else if (fname) {
            queryText += ` WHERE c.Cust_FName LIKE ?`;
            params.push(`${fname}%`);
        }

        queryText += ` GROUP BY c.Cust_ID, b.Barangay_Name, b.Purok`;

        const [rows] = await db.query(queryText, params);
        res.json(rows);

    } catch (err) { 
        console.error("Database Search Error:", err); 
        res.status(500).json({ error: err.message }); 
    }
};