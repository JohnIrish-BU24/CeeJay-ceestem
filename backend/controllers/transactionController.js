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
// 2. Process a complete Transaction (Creates the master record and the itemized lines)
exports.createTransaction = async (req, res) => {
    // ==========================================
    // ---> STEP 3a: ADD roleID TO THIS LIST <---
    // ==========================================
    const { Trans_ID, Trans_Date, Remarks, items, customer, empID, roleID, refillerEmpID } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // ==========================================
        // 1. FIND OR CREATE BARANGAY LOGIC
        // ==========================================
        let finalBarangayID = customer.Barangay_ID;
        
        // Force conversion and clean up inputs
        const bName = customer.Barangay_Name ? customer.Barangay_Name.trim() : null;
        const pNum = customer.Purok ? parseInt(customer.Purok) : null;

        // Log exactly what the backend sees
        console.log("DEBUG: Processing Barangay. Name:", bName, "Purok:", pNum);

        // Only proceed if we have valid data and need an ID
        if (!finalBarangayID) {
            if (bName !== null && pNum !== null && !isNaN(pNum)) {
                const [rows] = await connection.query(
                    "SELECT Barangay_ID FROM BARANGAY WHERE TRIM(Barangay_Name) = ? AND Purok = ?", 
                    [bName, pNum]
                );

                if (rows.length > 0) {
                    finalBarangayID = rows[0].Barangay_ID;
                    console.log("DEBUG: Found existing ID:", finalBarangayID);
                } else {
                    finalBarangayID = 'B' + Math.random().toString(36).substring(2, 5).toUpperCase();
                    console.log("DEBUG: Creating new Barangay ID:", finalBarangayID);
                    
                    await connection.query(
                        "INSERT INTO BARANGAY (Barangay_ID, Barangay_Name, Purok) VALUES (?, ?, ?)",
                        [finalBarangayID, bName, pNum]
                    );
                }
            } else {
                // The frontend sent empty or invalid strings
                throw new Error(`Invalid Barangay Data from frontend: Name='${bName}', Purok='${pNum}'`);
            }
        }

        // ==========================================
        // 2. FAIL-SAFE VALIDATION
        // ==========================================
        if (!finalBarangayID) {
            throw new Error("Validation Error: Could not assign a valid Barangay_ID.");
        }

        // ==========================================
        // 3 & 4. CHECK AND INSERT/UPDATE CUSTOMER
        // ==========================================
        const [existingCust] = await connection.query(
            "SELECT Cust_ID FROM CUSTOMER WHERE Cust_ID = ?", 
            [customer.Cust_ID]
        );

        if (existingCust.length === 0) {
            // NEW CUSTOMER: Insert them
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
            // 📍 THE FIX: EXISTING CUSTOMER - Update their profile with the new form inputs!
            console.log("DEBUG: Existing customer detected. Updating their profile.");
            
            await connection.query(
                'UPDATE CUSTOMER SET Cust_Type = ? WHERE Cust_ID = ?',
                [customer.Cust_Type, customer.Cust_ID]
            );

            if (customer.Contact_Nums && customer.Contact_Nums.length > 0) {
                // Clear old numbers and save the newly entered ones
                await connection.query('DELETE FROM CUSTOMER_NUM WHERE Cust_ID = ?', [customer.Cust_ID]);
                for (let num of customer.Contact_Nums) {
                    await connection.query(
                        'INSERT INTO CUSTOMER_NUM (Cust_ID, Contact_Num) VALUES (?, ?)',
                        [customer.Cust_ID, num]
                    );
                }
            }
        }

        // ==========================================
        // 5. INSERT INTO TRANS_RECORD
        // ==========================================
        await connection.query(
            `INSERT INTO TRANS_RECORD (Trans_ID, Cust_ID, Trans_Date, Remarks) 
             VALUES (?, ?, ?, ?)`,
            [Trans_ID, customer.Cust_ID, Trans_Date, Remarks]
        );

        // ==========================================
        // 6. INSERT INTO TRANS_DETAIL
        // ==========================================
        for (let item of items) {
            await connection.query(
                `INSERT INTO TRANS_DETAIL (Trans_Detail_ID, Serv_ID, Trans_ID, Quantity, Selling_Price, Promo) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [item.Trans_Detail_ID, item.Serv_ID, Trans_ID, item.Quantity, item.Selling_Price, item.Promo]
            );
        }

        // ==========================================
        // 7. INSERT INTO WORK_DETAIL
        // ==========================================
        // First, log the employee doing the transaction (e.g., The Driver)
        await connection.query(
            `INSERT INTO WORK_DETAIL (Trans_ID, Emp_ID, Role_ID) VALUES (?, ?, ?)`,
            [Trans_ID, empID, roleID]
        );

        // 📍 SECOND INSERT: If the Driver assigned a Refiller, save them to the same transaction!
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
    const { id } = req.params; // Trans_ID
    const form = req.body;     // The entire form payload from frontend
    
    console.log("Updating Trans ID:", id);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update TRANS_RECORD (Status/Remarks)
        const newStatus = form.status.charAt(0).toUpperCase() + form.status.slice(1);
        await connection.query(
            'UPDATE TRANS_RECORD SET Remarks = ? WHERE Trans_ID = ?', 
            [newStatus, id]
        );
        
        // 2. Update TRANS_DETAIL (Service Type, Quantity, Amount)
        const servID = form.serviceType === 'delivery' ? 2 : 1; // 1=Walk-in, 2=Delivery
        const promoVal = form.quantity >= 10 ? 'Yes' : 'No';
        await connection.query(
            'UPDATE TRANS_DETAIL SET Serv_ID = ?, Quantity = ?, Selling_Price = ?, Promo = ? WHERE Trans_ID = ?',
            [servID, form.quantity, form.total, promoVal, id]
        );

        // 3. Update CUSTOMER (Customer Type)
        if (form.custID) {
            await connection.query(
                'UPDATE CUSTOMER SET Cust_Type = ? WHERE Cust_ID = ?',
                [form.customerType, form.custID]
            );

            // 4. Update CUSTOMER_NUM (Contact Numbers)
            if (form.contactNums && form.contactNums.length > 0) {
                // Clear old numbers and insert the new ones
                await connection.query('DELETE FROM CUSTOMER_NUM WHERE Cust_ID = ?', [form.custID]);
                for (let num of form.contactNums) {
                    if (num.trim() !== '') {
                        await connection.query(
                            'INSERT INTO CUSTOMER_NUM (Cust_ID, Contact_Num) VALUES (?, ?)',
                            [form.custID, num.trim()]
                        );
                    }
                }
            }
        }

        await connection.commit();
        res.json({ message: "Transaction and Customer successfully updated" });
    } catch (err) {
        await connection.rollback();
        console.error("SQL ERROR:", err); 
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.getTodayTransactions = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks,
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
            WHERE DATE(tr.Trans_Date) = CURDATE()
            GROUP BY 
                tr.Trans_ID, tr.Trans_Date, tr.Remarks, 
                c.Cust_ID, c.Cust_LName, c.Cust_FName, c.Cust_Type, 
                b.Purok, b.Barangay_Name,
                sd.Serv_Name, td.Quantity, td.Selling_Price
            ORDER BY tr.Trans_Date DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        console.error("Fetch Error:", error);
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

