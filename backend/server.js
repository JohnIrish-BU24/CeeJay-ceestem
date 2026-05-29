const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Route Files
const barangayRoutes = require('./routes/barangayRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes'); 
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Link Route Paths to Application
app.use('/api/barangay', barangayRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/report', reportRoutes); 



// Test Base Route Route
app.get('/api/test-db', async (req, res) => {
    const db = require('./config/db');
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: "Connected to db_ceestem successfully!", data: rows });
    } catch (error) {
        res.status(500).json({ error: "Database failed", details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});