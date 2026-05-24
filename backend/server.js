const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Route Files
const barangayRoutes = require('./routes/barangayRoutes');

// Use Route Files Files
app.use('/api/barangay', barangayRoutes);

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