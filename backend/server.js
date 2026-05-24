const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON bodies

// Test Database Connection Route
app.get('/api/test-db', async (req, res) => {
    try {
        // Simple test query to check connection to your XAMPP database
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: "Connected to db_ceestem successfully!", data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database connection failed", details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});