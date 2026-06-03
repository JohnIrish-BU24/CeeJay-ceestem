const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS Configuration - Allow your future frontend website and local testing envs
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  'https://ceestem.vercel.app' 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS Security Policy'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Import individual route engines (Ensuring exact lower-case match for Linux hosting compatibility)
const barangayRoutes = require('./routes/barangayRoutes');
const customerRoutes = require('./routes/customerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

// Mount API Endpoints to application path routing gateway
app.use('/api/barangay', barangayRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/payroll', payrollRoutes);

// Root landing health-check sanity endpoint
app.get('/', (req, res) => {
    res.send('CeeStem API Backend Server is running smoothly.');
});

// Port listener activation config
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});