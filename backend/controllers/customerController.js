const db = require('../config/db');

// 1. Get the Customer Master List (Combines Customer, Barangay, and Contact details)
exports.getAllCustomers = async (req, res) => {
    try {
        const queryText = `
            SELECT c.Cust_ID, c.Barangay_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type, c.Borrowed_Cont, b.Barangay_Name, b.Purok
            FROM CUSTOMER c
            JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve customer directory", details: error.message });
    }
};

// 2. Add a new customer profile with strict operational validation rules
exports.createCustomer = async (req, res) => {
    const { Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont } = req.body;

    // Base structural validation for required relational fields
    if (!Cust_ID || !Barangay_ID || !Cust_LName || !Cust_FName || !Cust_Type) {
        return res.status(400).json({ error: "Missing required core customer fields." });
    }

    // Business Rule Validation: Enforce the 'chk_Cust_Type' allowed values
    const validTypes = ['Personal', 'Reseller'];
    if (!validTypes.includes(Cust_Type)) {
        return res.status(400).json({ error: "Invalid Customer Type. Field must strictly be 'Personal' or 'Reseller'." });
    }

    // Business Rule Validation: Resellers cannot start with or exceed a loan limit of 11 containers
    const borrowedCountValue = Borrowed_Cont || 0;
    if (Cust_Type === 'Reseller' && borrowedCountValue > 11) {
        return res.status(400).json({ error: "Reseller asset loan tracking constraint cannot exceed an 11-container limit." });
    }

    try {
        const queryText = `
            INSERT INTO CUSTOMER (Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(queryText, [Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue]);
        res.status(201).json({ message: "Customer profile onboarded successfully!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Customer ID ${Cust_ID} is already taken.` });
        }
        res.status(500).json({ error: "Database entity insertion failure", details: error.message });
    }
};

// 3. Update an existing customer profile
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont } = req.body;

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
        const queryText = `
            UPDATE CUSTOMER 
            SET Barangay_ID = ?, Cust_LName = ?, Cust_FName = ?, Cust_Type = ?, Borrowed_Cont = ? 
            WHERE Cust_ID = ?
        `;
        await db.query(queryText, [Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue, id]);
        res.json({ message: "Customer profile modified successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update customer record", details: error.message });
    }
};

// 4. Delete an existing customer record
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = 'DELETE FROM CUSTOMER WHERE Cust_ID = ?';
        await db.query(queryText, [id]);
        res.json({ message: "Customer record removed successfully." });
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