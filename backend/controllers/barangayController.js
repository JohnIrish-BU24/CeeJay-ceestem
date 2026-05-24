const db = require('../config/db');

// Get all registered Barangays
exports.getAllBarangays = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM BARANGAY');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve barangays", details: error.message });
    }
};

// Add a new service area area
exports.createBarangay = async (req, res) => {
    const { Barangay_ID, Barangay_Name, Purok } = req.body;
    
    // Simple backend validation validation
    if (!Barangay_ID || !Barangay_Name || !Purok) {
        return res.status(400).json({ error: "All fields (Barangay_ID, Barangay_Name, Purok) are required." });
    }

    try {
        const queryText = 'INSERT INTO BARANGAY (Barangay_ID, Barangay_Name, Purok) VALUES (?, ?, ?)';
        await db.query(queryText, [Barangay_ID, Barangay_Name, Purok]);
        res.status(201).json({ message: "Barangay added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to insert barangay", details: error.message });
    }
};