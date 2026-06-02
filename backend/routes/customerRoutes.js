const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Map clean API endpoints to controller logic functions
router.get('/', customerController.getAllCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/search', customerController.searchCustomer);

// Add archive and restore routes
router.put('/:id/archive', customerController.archiveCustomer);
router.put('/:id/restore', customerController.restoreCustomer);

module.exports = router;