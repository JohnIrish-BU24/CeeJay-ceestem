const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Map endpoints to controller operations
router.delete('/all', transactionController.deleteAllTransactions);
router.get('/', transactionController.getTransactionHistory);
router.post('/', transactionController.createTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.put('/:id', transactionController.updateTransaction);
router.get('/today', transactionController.getTodayTransactions);
router.get('/check-customer/:custID', transactionController.checkCustomerExists);

module.exports = router;