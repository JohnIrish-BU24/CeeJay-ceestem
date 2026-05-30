const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware configurations
app.use(cors());
app.use(express.json());

// Import individual route engines
const barangayRoutes = require('./routes/barangayRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const serviceRoutes = require('./routes/serviceRoutes'); // Added Services route handler

// Mount API Endpoints to application path routing gateway
app.use('/api/barangay', barangayRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/service', serviceRoutes); // Services module API mapping

// Root landing health-check sanity endpoint
app.get('/', (req, res) => {
    res.send('CeeStem API Backend Server is running smoothly.');
});

// Port listener activation config
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Add this to your backend server (e.g., server.js)

app.get('/api//customers/search', async (req, res) => {
  try {
    // 1. Grab the letters the user typed (e.g., "Ram")
    const searchQuery = req.query.q; 
    
    if (!searchQuery) {
      return res.json([]); 
    }

    // 2. Search your actual database! 
    // (This example uses SQL, but adjust it if you use MongoDB/Mongoose)
    const sql = `
      SELECT lastName, firstName, barangay, purok, customerType, contactNums 
      FROM customers 
      WHERE lastName LIKE ? OR firstName LIKE ?
      LIMIT 10
    `;
    const values = [`%${searchQuery}%`, `%${searchQuery}%`];
    
    // Replace this with how you actually query your DB
    const [matches] = await db.execute(sql, values); 

    // 3. Send the matches back to React so the dropdown appears!
    res.json(matches); 

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
});