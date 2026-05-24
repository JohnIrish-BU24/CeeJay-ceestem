const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Map endpoints to controller operations
router.get('/', transactionController.getTransactionHistory);
router.post('/', transactionController.createTransaction);

module.exports = router;