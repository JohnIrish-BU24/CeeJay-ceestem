const db = require('../config/db');

// 1. Get a comprehensive Transaction Status Log (Combines Record, Detail, and Customer)
exports.getTransactionHistory = async (req, res) => {
    const { search } = req.query; 
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
        
        // ONLY add WHERE clause if search has actual content
        if (search && search.trim() !== "") {
            queryText += ` WHERE (c.Cust_LName LIKE ? OR c.Cust_FName LIKE ? OR tr.Trans_ID LIKE ?) `;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
    const { Trans_ID, Cust_ID, Trans_Date, Remarks, items } = req.body;

    // Base validation validation
    if (!Trans_ID || !Cust_ID || !Trans_Date || !Remarks || !items || !items.length) {
        return res.status(400).json({ error: "Missing core transaction data or itemized details." });
    }

    // Business Rule Validation: Enforce allowed check constraint values for payment status
    const validRemarks = ['Paid', 'Unpaid'];
    if (!validRemarks.includes(Remarks)) {
        return res.status(400).json({ error: "Invalid Remarks. Status must strictly be 'Paid' or 'Unpaid'." });
    }

    // We use a Database Transaction here to guarantee data safety. 
    // If saving an individual item item fails, the entire transaction is rolled back so you don't get partial ghost data rows.
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert into the master record table (TRANS_RECORD)
        const insertRecordQuery = `
            INSERT INTO TRANS_RECORD (Trans_ID, Cust_ID, Trans_Date, Remarks) 
            VALUES (?, ?, ?, ?)
        `;
        await connection.query(insertRecordQuery, [Trans_ID, Cust_ID, Trans_Date, Remarks]);

        // Loop through each item in the request and save it to the detail table (TRANS_DETAIL)
        const insertDetailQuery = `
            INSERT INTO TRANS_DETAIL (Trans_Detail_ID, Serv_ID, Trans_ID, Quantity, Selling_Price, Promo) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (let item of items) {
            // Business Rule Validation: Enforce allowed check constraint values for Promos
            const validPromo = ['Yes', 'No'];
            if (!validPromo.includes(item.Promo)) {
                throw new Error(`Invalid Promo type '${item.Promo}' on detail ID ${item.Trans_Detail_ID}. Must be 'Yes' or 'No'.`);
            }

            await connection.query(insertDetailQuery, [
                item.Trans_Detail_ID,
                item.Serv_ID,
                Trans_ID, // Link back to our parent receipt ID
                item.Quantity,
                item.Selling_Price,
                item.Promo
            ]);
        }

        // If everything completes successfully, lock it into the database permanently
        await connection.commit();
        res.status(201).json({ message: "Transaction and details processed successfully!" });

    } catch (error) {
        // Undo all changes changes if any item inside the loop fails
        await connection.rollback();
        res.status(500).json({ error: "Transaction processing failed. Rollback executed.", details: error.message });
    } finally {
        connection.release(); // Return connection back to the pool
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

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { Remarks } = req.body;
    try {
        await db.query('UPDATE TRANS_RECORD SET Remarks = ? WHERE Trans_ID = ?', [Remarks, id]);
        res.json({ message: "Transaction updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};