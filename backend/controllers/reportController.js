const db = require('../config/db');

// 1. Customer Information Report (Customer, Barangay, Customer_Num)
exports.getCustomerInformationReport = async (req, res) => {
    try {
        const queryText = `
            SELECT c.Cust_LName, c.Cust_FName, c.Cust_Type, b.Barangay_Name, b.Purok,
                   GROUP_CONCAT(cn.Contact_Num SEPARATOR ', ') AS Contact_Numbers
            FROM CUSTOMER c
            JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
            GROUP BY c.Cust_ID
            ORDER BY c.Cust_LName ASC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Customer Information Report", details: error.message });
    }
};

// 2. Transaction Status Report (Trans_record, Trans_detail, Work_detail, Employee, Customer)
exports.getTransactionStatusReport = async (req, res) => {
    try {
        const queryText = `
            SELECT tr.Trans_Date, c.Cust_LName AS Customer_LName, c.Cust_FName AS Customer_FName,
                   MAX(CASE WHEN wd.Role_ID = 'R' THEN e.Emp_LName END) AS Refiller,
                   MAX(CASE WHEN wd.Role_ID = 'D' THEN e.Emp_LName END) AS Driver,
                   td.Quantity, td.Selling_Price, td.Promo, tr.Remarks
            FROM TRANS_RECORD tr
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN WORK_DETAIL wd ON tr.Trans_ID = wd.Trans_ID
            JOIN EMPLOYEE e ON wd.Emp_ID = e.Emp_ID
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            GROUP BY tr.Trans_ID, tr.Trans_Date, c.Cust_LName, c.Cust_FName, td.Quantity, td.Selling_Price, td.Promo, tr.Remarks
            ORDER BY tr.Trans_Date DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Transaction Status Report", details: error.message });
    }
};

// 3. Service Sales Report (Service_detail, Trans_detail)
exports.getServiceSalesReport = async (req, res) => {
    const { date, startDate, endDate } = req.query;
    try {
        let queryText = `
            SELECT sd.Serv_Name, sd.Price, 
                   SUM(td.Quantity) AS Amount_Sold,
                   SUM(td.Quantity * td.Selling_Price) AS Total_Sales
            FROM SERVICE_DETAIL sd
            JOIN TRANS_DETAIL td ON sd.Serv_ID = td.Serv_ID
            JOIN TRANS_RECORD tr ON td.Trans_ID = tr.Trans_ID
        `;
        
        let filterParams = [];
        if (startDate && endDate) {
            queryText += ` WHERE DATE(tr.Trans_Date) BETWEEN ? AND ? `;
            filterParams.push(startDate, endDate);
        } else if (date) {
            queryText += ` WHERE DATE(tr.Trans_Date) = ? `;
            filterParams.push(date);
        }
        
        queryText += ` GROUP BY sd.Serv_ID, sd.Serv_Name, sd.Price ORDER BY Total_Sales DESC `;
        
        const [rows] = await db.query(queryText, filterParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Service Sales Report", details: error.message });
    }
};

// 4. Delivery/Work Report (Work_detail, Trans_record, Customer, Barangay)
exports.getDeliveryWorkReport = async (req, res) => {
    try {
        const queryText = `
            SELECT e.Emp_FName AS Employee_Name, wd.Role_ID AS Assigned_As, tr.Trans_ID,
                   b.Barangay_Name AS Delivery_Area, tr.Trans_Date
            FROM EMPLOYEE e
            JOIN WORK_DETAIL wd ON e.Emp_ID = wd.Emp_ID
            JOIN TRANS_RECORD tr ON wd.Trans_ID = tr.Trans_ID
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            JOIN BARANGAY b ON c.Barangay_ID = b.Barangay_ID
            ORDER BY tr.Trans_ID ASC, tr.Trans_Date DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Delivery/Work Report", details: error.message });
    }
};

// 5. Active Inventory Tracking Report (Customer, Customer_num)
exports.getActiveInventoryReport = async (req, res) => {
    try {
        const queryText = `
            SELECT c.Cust_LName, c.Cust_FName, c.Borrowed_Cont,
                   GROUP_CONCAT(cn.Contact_Num SEPARATOR ', ') AS Contact_Numbers
            FROM CUSTOMER c
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
            WHERE c.Borrowed_Cont > 0
            GROUP BY c.Cust_ID
            ORDER BY c.Borrowed_Cont DESC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Active Inventory Tracking Report", details: error.message });
    }
};


// 6. Unpaid Collections List (Aggregated per Customer)
exports.getUnpaidCollections = async (req, res) => {
    const { search } = req.query; // Capture search query if sent from client
    try {
        let queryText = `
            SELECT 
                c.Cust_ID,
                c.Cust_LName, 
                c.Cust_FName,
                GROUP_CONCAT(DISTINCT cn.Contact_Num SEPARATOR ', ') AS Contact_Numbers,
                SUM(td.Quantity) AS Total_Unpaid_Gallons,
                SUM(td.Quantity * td.Selling_Price) AS Total_Unpaid_Amount
            FROM TRANS_RECORD tr
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN CUSTOMER c ON tr.Cust_ID = c.Cust_ID
            LEFT JOIN CUSTOMER_NUM cn ON c.Cust_ID = cn.Cust_ID
            WHERE tr.Remarks = 'Unpaid'
        `;
        
        let filterParams = [];
        if (search) {
            queryText += ` AND (c.Cust_LName LIKE ? OR c.Cust_FName LIKE ?) `;
            const searchWildcard = `%${search.trim()}%`;
            filterParams.push(searchWildcard, searchWildcard);
        }

        queryText += `
            GROUP BY c.Cust_ID, c.Cust_LName, c.Cust_FName
            ORDER BY Total_Unpaid_Amount DESC
        `;

        const [rows] = await db.query(queryText, filterParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Unpaid Collections List", details: error.message });
    }
};

// 7. Employee Information Report (Employee, Employee_num)
exports.getEmployeeInformationReport = async (req, res) => {
    try {
        const queryText = `
            SELECT e.Emp_LName, e.Emp_FName, e.Role_ID,
                   GROUP_CONCAT(en.Contact_Num SEPARATOR ', ') AS Contact_Numbers
            FROM EMPLOYEE e
            LEFT JOIN EMPLOYEE_NUM en ON e.Emp_ID = en.Emp_ID
            GROUP BY e.Emp_ID
            ORDER BY e.Emp_LName ASC
        `;
        const [rows] = await db.query(queryText);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Employee Information Report", details: error.message });
    }
};

// 8. Employee Performance Summary (Employee, Job_role, Work_detail, Trans_detail, Service_detail)
exports.getEmployeePerformanceSummary = async (req, res) => {
    const { date, startDate, endDate } = req.query;
    try {
        let queryText = `
            SELECT e.Emp_LName, e.Emp_FName, jr.Role_ID, 
                   COUNT(DISTINCT wd.Trans_ID) AS Jobs_Completed,
                   SUM(td.Quantity) AS Total_Gallons,
                   jr.Quota AS Target
            FROM EMPLOYEE e
            JOIN JOB_ROLE jr ON e.Role_ID = jr.Role_ID
            JOIN WORK_DETAIL wd ON e.Emp_ID = wd.Emp_ID
            JOIN TRANS_DETAIL td ON wd.Trans_ID = td.Trans_ID
            JOIN TRANS_RECORD tr ON wd.Trans_ID = tr.Trans_ID
        `;
        
        let filterParams = [];
        if (startDate && endDate) {
            queryText += ` WHERE DATE(tr.Trans_Date) BETWEEN ? AND ? `;
            filterParams.push(startDate, endDate);
        } else if (date) {
            queryText += ` WHERE DATE(tr.Trans_Date) = ? `;
            filterParams.push(date);
        }
        
        queryText += ` GROUP BY e.Emp_ID, e.Emp_LName, e.Emp_FName, jr.Role_ID, jr.Quota ORDER BY Jobs_Completed DESC `;
        
        const [rows] = await db.query(queryText, filterParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate Employee Performance Summary", details: error.message });
    }
};

// 9. Payroll & Incentive Breakdown (Employee, Payroll_record, Job_role)
exports.getPayrollIncentiveBreakdown = async (req, res) => {
    try {
        const payrollQueryText = `
            SELECT e.Emp_LName, e.Emp_FName, jr.Salary, 
                   CONCAT(pr.Start_Date, ' to ', pr.End_Date) AS Pay_Period, 
                   pr.Total_Incentive, pr.Net_Pay
            FROM EMPLOYEE e
            JOIN PAYROLL_RECORD pr ON e.Emp_ID = pr.Emp_ID
            JOIN JOB_ROLE jr ON e.Role_ID = jr.Role_ID
            ORDER BY pr.Start_Date DESC, e.Emp_LName ASC
        `;
        const [payrollRecordsArray] = await db.query(payrollQueryText);
        res.json(payrollRecordsArray);
    } catch (databaseQueryError) {
        res.status(500).json({ error: "Failed to generate Payroll & Incentive Breakdown", details: databaseQueryError.message });
    }
};

// 10. Daily Revenue Summary Report
exports.getDailyRevenueSummaryReport = async (req, res) => {
    const { date, startDate, endDate } = req.query;
    
    try {
        let revenueSummarySqlStatement = `
            SELECT 
                DATE(tr.Trans_Date) AS Date,
                COUNT(DISTINCT tr.Trans_ID) AS Total_Customers_Served,
                SUM(td.Quantity) AS Total_Gallons_Sold,
                SUM(td.Quantity * td.Selling_Price) AS Gross_Revenue,
                SUM(CASE WHEN tr.Remarks = 'Paid' THEN (td.Quantity * td.Selling_Price) ELSE 0 END) AS Cash_Collected,
                SUM(CASE WHEN tr.Remarks = 'Unpaid' THEN (td.Quantity * td.Selling_Price) ELSE 0 END) AS Outstanding_Credit
            FROM TRANS_RECORD tr
            JOIN TRANS_DETAIL td ON tr.Trans_ID = td.Trans_ID
            JOIN SERVICE_DETAIL sd ON td.Serv_ID = sd.Serv_ID
        `;

        let dateRangeFilters = [];

        // Dynamically shift between a single day or a 7-day span
        if (startDate && endDate) {
            revenueSummarySqlStatement += ` WHERE DATE(tr.Trans_Date) BETWEEN ? AND ? `;
            dateRangeFilters.push(startDate, endDate);
        } else {
            const targetReportDate = date || '2026-04-14';
            revenueSummarySqlStatement += ` WHERE DATE(tr.Trans_Date) = ? `;
            dateRangeFilters.push(targetReportDate);
        }

        // Group by the dates to separate the days for the Line Chart
        revenueSummarySqlStatement += ` GROUP BY DATE(tr.Trans_Date) ORDER BY DATE(tr.Trans_Date) ASC`;

        const [retrievedRevenueData] = await db.query(revenueSummarySqlStatement, dateRangeFilters);

        if (retrievedRevenueData.length > 0) {
            res.json(retrievedRevenueData); // Return the full array for the chart
        } else {
            res.json([]);
        }
    } catch (databaseQueryError) {
        res.status(500).json({ error: "Failed to generate Daily Revenue Summary Report", details: databaseQueryError.message });
    }
};