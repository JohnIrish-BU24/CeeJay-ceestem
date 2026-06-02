const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Map endpoints to controller operations
router.get('/', transactionController.getTransactionHistory);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.get('/today', transactionController.getTodayTransactions);
router.get('/check-customer/:custID', transactionController.checkCustomerExists);

// Archive (Void) & Restore (Valid) Routes
router.put('/:id/archive', transactionController.archiveTransaction);
router.put('/:id/restore', transactionController.restoreTransaction);

// Hard Delete (Kept for backend safety/admin use, not used in standard UI flow)
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;