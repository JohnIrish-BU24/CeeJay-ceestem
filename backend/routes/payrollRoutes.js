const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Standard CRUD Routes
router.get('/', payrollController.getPayrolls);
router.post('/', payrollController.createPayroll);
router.put('/:id', payrollController.updatePayroll);

// Soft Delete (Archive/Restore) Routes
router.put('/:id/archive', payrollController.archivePayroll);
router.put('/:id/restore', payrollController.restorePayroll);

module.exports = router;