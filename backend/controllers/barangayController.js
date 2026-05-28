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

// Add a new service area
exports.createBarangay = async (req, res) => {
    const { Barangay_ID, Barangay_Name, Purok } = req.body;
    
    // FIX: Explicitly check for undefined so '0' is accepted as a valid number
    if (Barangay_ID === undefined || Barangay_ID === '' || !Barangay_Name || Purok === undefined || Purok === '') {
        return res.status(400).json({ error: "All fields (Barangay_ID, Barangay_Name, Purok) are required." });
    }

    try {
        const queryText = 'INSERT INTO BARANGAY (Barangay_ID, Barangay_Name, Purok) VALUES (?, ?, ?)';
        await db.query(queryText, [Barangay_ID, Barangay_Name, Purok]);
        res.status(201).json({ message: "Barangay added successfully!" });
    } catch (error) {
        // FIX: Catch duplicate Primary Key errors gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Barangay ID ${Barangay_ID} is already taken! Please delete it first or choose an available ID.` });
        }
        res.status(500).json({ error: "Failed to insert barangay", details: error.message });
    }
};

// Update existing barangay
exports.updateBarangay = async (req, res) => {
    const { id } = req.params;
    const { Barangay_Name, Purok } = req.body;
    
    if (!Barangay_Name || Purok === undefined || Purok === '') {
        return res.status(400).json({ error: "Barangay Name and Purok are required." });
    }

    try {
        await db.query('UPDATE BARANGAY SET Barangay_Name = ?, Purok = ? WHERE Barangay_ID = ?', 
        [Barangay_Name, Purok, id]);
        res.json({ message: "Barangay updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update", details: error.message });
    }
};

// Delete a barangay
exports.deleteBarangay = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM BARANGAY WHERE Barangay_ID = ?', [id]);
        res.json({ message: "Barangay deleted successfully!" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "Cannot delete this barangay because customers are currently assigned to it." });
        }
        res.status(500).json({ error: "Failed to delete", details: error.message });
    }
};