const db = require('../config/db');

// 1. Get the Customer Master List
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

// 2. Add a new customer
exports.createCustomer = async (req, res) => {
    const { Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont } = req.body;

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
        const queryText = `INSERT INTO CUSTOMER (Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont) VALUES (?, ?, ?, ?, ?, ?)`;
        await db.query(queryText, [Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue]);
        res.status(201).json({ message: "Customer profile onboarded successfully!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Customer ID ${Cust_ID} is already in use!` });
        }
        res.status(500).json({ error: "Database entity insertion failure", details: error.message });
    }
};

// 3. Update existing customer
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { Barangay_ID, Cust_LName, Cust_FName, Cust_Type, Borrowed_Cont } = req.body;

    if (!Barangay_ID || !Cust_LName || !Cust_FName || !Cust_Type) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const validTypes = ['Personal', 'Reseller'];
    if (!validTypes.includes(Cust_Type)) return res.status(400).json({ error: "Invalid Customer Type." });

    const borrowedCountValue = Borrowed_Cont || 0;
    if (Cust_Type === 'Reseller' && borrowedCountValue > 11) {
        return res.status(400).json({ error: "Resellers cannot exceed 11 borrowed containers." });
    }

    try {
        const queryText = `UPDATE CUSTOMER SET Barangay_ID = ?, Cust_LName = ?, Cust_FName = ?, Cust_Type = ?, Borrowed_Cont = ? WHERE Cust_ID = ?`;
        await db.query(queryText, [Barangay_ID, Cust_LName, Cust_FName, Cust_Type, borrowedCountValue, id]);
        res.json({ message: "Customer updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update customer", details: error.message });
    }
};

// 4. Delete customer
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM CUSTOMER WHERE Cust_ID = ?', [id]);
        res.json({ message: "Customer deleted successfully!" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete this customer because they have existing transactions recorded." });
        }
        res.status(500).json({ error: "Failed to delete customer", details: error.message });
    }
};