const db = require('../config/db');

// ==========================================
// 5-YEAR AUTO-DELETE CLEANUP ROUTINE
// ==========================================
const autoDeleteTrash = async () => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Find ALL transactions strictly older than 5 years
        const [rows] = await connection.query(`
            SELECT Trans_ID FROM TRANS_RECORD 
            WHERE Trans_Date < NOW() - INTERVAL 5 YEAR
        `);
        
        if (rows.length > 0) {
            const ids = rows.map(r => r.Trans_ID);
            const placeholders = ids.map(() => '?').join(',');
            
            // Delete dependent records first to avoid Foreign Key constraint errors
            await connection.query(`DELETE FROM TRANS_DETAIL WHERE Trans_ID IN (${placeholders})`, ids);
            await connection.query(`DELETE FROM WORK_DETAIL WHERE Trans_ID IN (${placeholders})`, ids);
            
            // Delete master record last
            await connection.query(`DELETE FROM TRANS_RECORD WHERE Trans_ID IN (${placeholders})`, ids);
            
            console.log(`[SYSTEM] Auto-deleted ${ids.length} transactions older than 5 years.`);
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("[SYSTEM] Auto-delete error:", error);
    } finally {
        connection.release();
    }
};

// 1. Get a comprehensive Transaction Status Log
exports.getTransactionHistory = async (req, res) => {
    // Run the cleanup routine before fetching data
    await autoDeleteTrash();

    const { search, dateRange, status } = req.query; 
    
    // MAP FRONTEND STATUS TO DATABASE CONSTRAINTS
    const dbStatus = status === 'Archived' ? 'Voided' : 'Valid'; 

    try {
        let queryText = `
            SELECT 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks, tr.Status,
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
        let whereClauses = [`tr.Status = ?`];
        queryParams.push(dbStatus);
        
        // Search Function
        if (search && search.trim() !== "") {
            whereClauses.push(`(c.Cust_LName LIKE ? OR c.Cust_FName LIKE ? OR tr.Trans_ID LIKE ?)`);
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Filter Date Function
        if (dateRange && dateRange !== 'All Time') {
            if (dateRange === 'Last Week') {
                whereClauses.push(`tr.Trans_Date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)`);
            } else if (dateRange === 'Last Month') {
                whereClauses.push(`tr.Trans_Date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`);
            } else if (dateRange === 'Last 3 Months') {
                whereClauses.push(`tr.Trans_Date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)`);
            } else if (dateRange === 'Last Year') {
                // Strictly limits to transactions exactly within the last 365 days from today
                whereClauses.push(`tr.Trans_Date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND tr.Trans_Date <= NOW()`);
            }
        }

        // Combine all WHERE clauses
        if (whereClauses.length > 0) {
            queryText += ` WHERE ` + whereClauses.join(' AND ');
        }

        queryText += `
            GROUP BY tr.Trans_ID, tr.Trans_Date, c.Cust_LName, c.Cust_FName, 
                     sd.Serv_Name, td.Quantity, td.Selling_Price, tr.Remarks, tr.Status
            ORDER BY tr.Trans_Date DESC
        `;

        const [rows] = await db.query(queryText, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve logs", details: error.message });
    }
};

// 2. Process a complete Transaction
exports.createTransaction = async (req, res) => {
    const { Trans_ID, Trans_Date, Remarks, items, customer, empID, roleID, refillerEmpID } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let finalBarangayID = customer.Barangay_ID;
        const bName = customer.Barangay_Name ? customer.Barangay_Name.trim() : null;
        const pNum = customer.Purok ? parseInt(customer.Purok) : null;

        if (!finalBarangayID) {
            if (bName !== null && pNum !== null && !isNaN(pNum)) {
                const [rows] = await connection.query(
                    "SELECT Barangay_ID FROM BARANGAY WHERE TRIM(Barangay_Name) = ? AND Purok = ?", 
                    [bName, pNum]
                );

                if (rows.length > 0) {
                    finalBarangayID = rows[0].Barangay_ID;
                } else {
                    finalBarangayID = 'B' + Math.random().toString(36).substring(2, 5).toUpperCase();
                    await connection.query(
                        "INSERT INTO BARANGAY (Barangay_ID, Barangay_Name, Purok) VALUES (?, ?, ?)",
                        [finalBarangayID, bName, pNum]
                    );
                }
            } else {
                throw new Error(`Invalid Barangay Data from frontend: Name='${bName}', Purok='${pNum}'`);
            }
        }

        if (!finalBarangayID) {
            throw new Error("Validation Error: Could not assign a valid Barangay_ID.");
        }

        const [existingCust] = await connection.query(
            "SELECT Cust_ID FROM CUSTOMER WHERE Cust_ID = ?", 
            [customer.Cust_ID]
        );

        if (existingCust.length === 0) {
            await connection.query(
                `INSERT INTO CUSTOMER (Cust_ID, Barangay_ID, Cust_LName, Cust_FName, Cust_Type) 
                 VALUES (?, ?, ?, ?, ?)`,
                [customer.Cust_ID, finalBarangayID, customer.Cust_LName, customer.Cust_FName, customer.Cust_Type]
            );

            for (let num of customer.Contact_Nums) {
                await connection.query(
                    'INSERT INTO CUSTOMER_NUM (Cust_ID, Contact_Num) VALUES (?, ?)',
                    [customer.Cust_ID, num]
                );
            }
        } else {
            await connection.query(
                'UPDATE CUSTOMER SET Cust_Type = ? WHERE Cust_ID = ?',
                [customer.Cust_Type, customer.Cust_ID]
            );

            if (customer.Contact_Nums && customer.Contact_Nums.length > 0) {
                await connection.query('DELETE FROM CUSTOMER_NUM WHERE Cust_ID = ?', [customer.Cust_ID]);
                for (let num of customer.Contact_Nums) {
                    await connection.query(
                        'INSERT INTO CUSTOMER_NUM (Cust_ID, Contact_Num) VALUES (?, ?)',
                        [customer.Cust_ID, num]
                    );
                }
            }
        }

        await connection.query(
            `INSERT INTO TRANS_RECORD (Trans_ID, Cust_ID, Trans_Date, Remarks) 
             VALUES (?, ?, ?, ?)`,
            [Trans_ID, customer.Cust_ID, Trans_Date, Remarks]
        );

        for (let item of items) {
            await connection.query(
                `INSERT INTO TRANS_DETAIL (Trans_Detail_ID, Serv_ID, Trans_ID, Quantity, Selling_Price, Promo) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [item.Trans_Detail_ID, item.Serv_ID, Trans_ID, item.Quantity, item.Selling_Price, item.Promo]
            );
        }

        await connection.query(
            `INSERT INTO WORK_DETAIL (Trans_ID, Emp_ID, Role_ID) VALUES (?, ?, ?)`,
            [Trans_ID, empID, roleID]
        );

        if (refillerEmpID) {
            await connection.query(
                `INSERT INTO WORK_DETAIL (Trans_ID, Emp_ID, Role_ID) VALUES (?, ?, 'R')`,
                [Trans_ID, refillerEmpID]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Transaction successful" });

    } catch (error) {
        await connection.rollback();
        console.error("Database error:", error);
        res.status(500).json({ error: error.message || "Transaction failed." });
    } finally {
        connection.release();
    }
};

// Update strictly reserved for Status (Paid/Unpaid)
exports.updateTransaction = async (req, res) => {
    const { id } = req.params; 
    const form = req.body;     
    
    try {
        const newStatus = form.status.charAt(0).toUpperCase() + form.status.slice(1);
        await db.query(
            'UPDATE TRANS_RECORD SET Remarks = ? WHERE Trans_ID = ?', 
            [newStatus, id]
        );
        res.json({ message: "Transaction payment status updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTodayTransactions = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks, tr.Status,
                c.Cust_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type,
                b.Purok, b.Barangay_Name,
                GROUP_CONCAT(DISTINCT cn.Contact_Num SEPARATOR ', ') AS Contact_Nums, 
                sd.Serv_Name,
                MAX(CASE WHEN wd.Role_ID = 'R' THEN e.Emp_LName END) AS Refiller,
                MAX(CASE WHEN wd.Role_ID = 'D' THEN e.Emp_LName END) AS Driver,
                td.Quantity, td.Selling_Price
            FROM TRANS_RECORD tr
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            LEFT JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN SERVICE_DETAIL sd ON td.Serv_ID = sd.Serv_ID
            JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
            JOIN EMPLOYEE e ON wd.Emp_ID = e.Emp_ID
            WHERE DATE(tr.Trans_Date) = CURDATE() AND tr.Status = 'Valid'
            GROUP BY 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks, tr.Status,
                c.Cust_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type, 
                b.Purok, b.Barangay_Name,
                sd.Serv_Name, td.Quantity, td.Selling_Price
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

// ==========================================
// Trash (Void) and Restore (Valid) Logic
// ==========================================

exports.archiveTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE TRANS_RECORD SET Status = 'Voided' WHERE Trans_ID = ?", [id]);
        res.json({ message: "Transaction moved to Trash Bin." });
    } catch (error) {
        res.status(500).json({ error: "Failed to move transaction to trash." });
    }
};

exports.restoreTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE TRANS_RECORD SET Status = 'Valid' WHERE Trans_ID = ?", [id]);
        res.json({ message: "Transaction successfully restored." });
    } catch (error) {
        res.status(500).json({ error: "Failed to restore transaction." });
    }
};

// Hard Delete Route implementation for manual bypass if ever needed
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