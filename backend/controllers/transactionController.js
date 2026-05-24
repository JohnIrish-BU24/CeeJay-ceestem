const db = require('../config/db');

// 1. Get a comprehensive Transaction Status Log (Combines Record, Detail, and Customer)
exports.getTransactionHistory = async (req, res) => {
    try {
        const queryText = `
            SELECT tr.Trans_ID, tr.Trans_Date, tr.Remarks, c.Cust_LName, c.Cust_FName,
                   td.Trans_Detail_ID, td.Quantity, td.Selling_Price, td.Promo, sd.Serv_Name
            FROM TRANS_RECORD tr
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN SERVICE_DETAIL sd ON td.Serv_ID = sd.Serv_ID
            ORDER BY tr.Trans_Date DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve transaction logs", details: error.message });
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