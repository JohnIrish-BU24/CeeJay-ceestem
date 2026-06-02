const db = require('../config/db');

// 1. Get all listed system operations (Filtered by Status)
exports.getAllServices = async (req, res) => {
    // Default to 'Active' if no status is requested
    const { status } = req.query;
    const filterStatus = status || 'Active'; 
    
    try {
        const queryText = 'SELECT * FROM SERVICE_DETAIL WHERE Status = ? ORDER BY Serv_ID ASC';
        const [rows] = await db.query(queryText, [filterStatus]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve the listed system amenities", details: error.message });
    }
};

// 2. Add an amenity offering
exports.createService = async (req, res) => {
    const { Serv_ID, Serv_Name, Price } = req.body;

    if (!Serv_ID || !Serv_Name || Price === undefined || Price === '') {
        return res.status(400).json({ error: "All structural properties (Serv_ID, Serv_Name, Price) must be fully populated." });
    }

    try {
        const queryText = 'INSERT INTO SERVICE_DETAIL (Serv_ID, Serv_Name, Price) VALUES (?, ?, ?)';
        await db.query(queryText, [Serv_ID, Serv_Name, Price]);
        res.status(201).json({ message: "System operational offering registered successfully!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `Operational Identifier ${Serv_ID} is already taken.` });
        }
        res.status(500).json({ error: "Database mapping insertion failure", details: error.message });
    }
};

// 3. Edit current amenity parameters
exports.updateService = async (req, res) => {
    const { id } = req.params;
    const { Serv_Name, Price } = req.body;

    if (!Serv_Name || Price === undefined || Price === '') {
        return res.status(400).json({ error: "Both an amendment name title and rate pricing evaluation must be provided." });
    }

    try {
        const queryText = 'UPDATE SERVICE_DETAIL SET Serv_Name = ?, Price = ? WHERE Serv_ID = ?';
        await db.query(queryText, [Serv_Name, Price, id]);
        res.json({ message: "System operation amended successfully." });
    } catch (error) {
        res.status(500).json({ error: "Database manipulation edit sequence broken", details: error.message });
    }
};

// 4. Remove a line option
exports.deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = 'DELETE FROM SERVICE_DETAIL WHERE Serv_ID = ?';
        await db.query(queryText, [id]);
        res.json({ message: "Operational property removed from listed context." });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: "This operation cannot be safely extracted because previous client context manifests depend directly on its properties." });
        }
        res.status(500).json({ error: "Extraction procedure pipeline dropped", details: error.message });
    }
};

exports.archiveService = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = "UPDATE SERVICE_DETAIL SET Status = 'Archived' WHERE Serv_ID = ?";
        await db.query(queryText, [id]);
        res.json({ message: "Service archived successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to archive service", details: error.message });
    }
};

exports.restoreService = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = "UPDATE SERVICE_DETAIL SET Status = 'Active' WHERE Serv_ID = ?";
        await db.query(queryText, [id]);
        res.json({ message: "Service restored successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to restore service", details: error.message });
    }
};