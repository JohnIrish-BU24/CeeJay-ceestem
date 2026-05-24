const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Map clean API endpoints to controller logic functions
router.get('/', customerController.getAllCustomers);
router.post('/', customerController.createCustomer);

module.exports = router;