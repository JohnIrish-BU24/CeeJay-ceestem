const db = require('../config/db');

// 1. Get a comprehensive Transaction Status Log (Combines Record, Detail, and Customer)
exports.getTransactionHistory = async (req, res) => {
    const { search, dateRange } = req.query; 
    try {
        let queryText = `
            SELECT 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks,
                CONCAT(c.Cust_LName, ', ', c.Cust_FName) AS Customer,
                sd.Serv_Name,
                MAX(CASE WHEN wd.Role_ID = 'R' THEN e.Emp_LName END) AS Refiller,
                MAX(CASE WHEN wd.Role_ID = 'D' THEN e.Emp_LName END) AS Driver,
                td.Quantity, td.Selling_Price
            FROM TRANS_RECORD tr
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN SERVICE_DETAIL sd ON td.Serv_ID = sd.Serv_ID
            JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
            JOIN EMPLOYEE e ON wd.Emp_ID = e.Emp_ID
        `;

        const queryParams = [];
        
        // Search Function
        if (search && search.trim() !== "") {
            queryText += ` WHERE (c.Cust_LName LIKE ? OR c.Cust_FName LIKE ? OR tr.Trans_ID LIKE ?) `;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Filter Date Function
        if (dateRange && dateRange !== 'All Time') {
            const dateClause = (search && search.trim() !== "") ? ` AND ` : ` WHERE `;
            let interval = '';
            
            // Ensure these match your frontend <option> values EXACTLY
            if (dateRange === 'Last Week') interval = 'INTERVAL 1 WEEK';
            else if (dateRange === 'Last Month') interval = 'INTERVAL 1 MONTH';
            else if (dateRange === 'Last 3 Months') interval = 'INTERVAL 3 MONTH';
            else if (dateRange === 'Last Year') interval = 'INTERVAL 1 YEAR';

            // Safety: Only append if we successfully mapped an interval
            if (interval !== '') {
                queryText += `${dateClause} tr.Trans_Date >= DATE_SUB(NOW(), ${interval}) `;
            }
        }

        queryText += `
            GROUP BY tr.Trans_ID, tr.Trans_Date, c.Cust_LName, c.Cust_FName, 
                     sd.Serv_Name, td.Quantity, td.Selling_Price, tr.Remarks
            ORDER BY tr.Trans_Date DESC
        `;

        const [rows] = await db.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve logs", details: error.message });
    }
};

// 2. Process a complete Transaction (Creates the master record and the itemized lines)
exports.createTransaction = async (req, res) => {
    // 1. Destructure the data exactly as it is sent from the frontend
    const { Trans_ID, Trans_Date, Remarks, items, customer } = req.body;
    
    console.log("DEBUGGING PAYLOAD:", JSON.stringify(req.body, null, 2));
    // 2. Validate core data (check inside the 'customer' object)
    if (!Trans_ID || !customer || !customer.Cust_ID || !items || !items.length) {
        return res.status(400).json({ error: "Missing core transaction data or itemized details." });
    }

    if (Remarks !== 'Paid' && Remarks !== 'Unpaid') {
    return res.status(400).json({ error: "Invalid Status" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 3. Insert into CUSTOMER
        await connection.query(
            `INSERT INTO CUSTOMER (Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type) 
             VALUES (?, ?, ?, ?, ?)`,
            [customer.Cust_ID, customer.Barangay_ID, customer.Cust_LName, customer.Cust_FName, customer.Cust_Type]
        );

        // 4. Insert into CUSTOMER_NUM
        for (let num of customer.Contact_Nums) {
            await connection.query(
                'INSERT INTO CUSTOMER_NUM (Cust_ID, Contact_Num) VALUES (?, ?)',
                [customer.Cust_ID, num]
            );
        }

        // 5. Insert into TRANS_RECORD
        await connection.query(
            `INSERT INTO TRANS_RECORD (Trans_ID, Cust_ID, Trans_Date, Remarks) 
             VALUES (?, ?, ?, ?)`,
            [Trans_ID, customer.Cust_ID, Trans_Date, Remarks]
        );

        // 6. Insert into TRANS_DETAIL
        for (let item of items) {
            await connection.query(
                `INSERT INTO TRANS_DETAIL (Trans_Detail_ID, Serv_ID, Trans_ID, Quantity, Selling_Price, Promo) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [item.Trans_Detail_ID, item.Serv_ID, Trans_ID, item.Quantity, item.Selling_Price, item.Promo]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Transaction successful" });

    } catch (error) {
        await connection.rollback();
        console.error("Database error:", error);
        res.status(500).json({ error: "Transaction failed." });
    } finally {
        connection.release();
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM TRANS_DETAIL WHERE Trans_ID = ?', [id]);
        await connection.query('DELETE FROM WORK_DETAIL WHERE Trans_ID = ?', [id]);
        await connection.query('DELETE FROM TRANS_RECORD WHERE Trans_ID = ?', [id]);
        await connection.commit();
        res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.deleteAllTransactions = async (req, res) => {
    const { password } = req.body;
    console.log("Attempting to clear all. Password received:", password);

    if (password !== "ceestem123") {
        console.error("Auth Failed: Incorrect password.");
        return res.status(403).json({ error: "Invalid password." });
    }

    const connection = await db.getConnection();
    try {
        console.log("Starting deletion...");
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Explicitly delete in order
        await connection.query('DELETE FROM TRANS_DETAIL');
        await connection.query('DELETE FROM WORK_DETAIL');
        await connection.query('DELETE FROM TRANS_RECORD');
        
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Database cleared successfully.");
        
        res.status(200).json({ message: "All records cleared successfully." });
    } catch (err) {
        console.error("Database deletion failed:", err);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
        res.status(500).json({ error: "Server Error: " + err.message });
    } finally {
        connection.release();
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { service, qty, amount, status } = req.body; 
    
    console.log("Updating Trans ID:", id);
    console.log("Data:", { service, qty, amount, status });

    try {
        // ONLY update the Trans_RECORD table first to isolate the error
        const result = await db.query(
            'UPDATE TRANS_RECORD SET Remarks = ? WHERE Trans_ID = ?', 
            [status, id]
        );
        
        console.log("Update successful");
        res.json({ message: "Transaction updated" });
    } catch (err) {
        console.error("SQL ERROR:", err); // THIS will print the real reason in your backend terminal
        res.status(500).json({ error: err.message });
    }
};

exports.getTodayTransactions = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks,
                CONCAT(c.Cust_LName, ', ', c.Cust_FName) AS Customer,
                sd.Serv_Name,
                MAX(CASE WHEN wd.Role_ID = 'R' THEN e.Emp_LName END) AS Refiller,
                MAX(CASE WHEN wd.Role_ID = 'D' THEN e.Emp_LName END) AS Driver,
                td.Quantity, td.Selling_Price
            FROM TRANS_RECORD tr
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN SERVICE_DETAIL sd ON td.Serv_ID = sd.Serv_ID
            JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
            JOIN EMPLOYEE e ON wd.Emp_ID = e.Emp_ID
            WHERE DATE(tr.Trans_Date) = CURDATE()
            GROUP BY tr.Trans_ID, tr.Trans_Date, c.Cust_LName, c.Cust_FName, 
                     sd.Serv_Name, td.Quantity, td.Selling_Price, tr.Remarks
            ORDER BY tr.Trans_Date DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve today's logs", details: error.message });
    }
};

exports.checkCustomerExists = async (req, res) => {
    const { custID } = req.params;
    try {
        const [rows] = await db.query('SELECT Cust_ID FROM CUSTOMER WHERE Cust_ID = ?', [custID]);
        res.status(200).json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: "Failed to check database." });
    }
};