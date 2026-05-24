const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/customer-info', reportController.getCustomerInformationReport);
router.get('/transaction-status', reportController.getTransactionStatusReport);
router.get('/service-sales', reportController.getServiceSalesReport);
router.get('/delivery-work', reportController.getDeliveryWorkReport);
router.get('/active-inventory', reportController.getActiveInventoryReport);
router.get('/unpaid-collections', reportController.getUnpaidCollections);
router.get('/employee-info', reportController.getEmployeeInformationReport);
router.get('/employee-performance', reportController.getEmployeePerformanceSummary);
router.get('/payroll-breakdown', reportController.getPayrollIncentiveBreakdown);
router.get('/daily-revenue', reportController.getDailyRevenueSummaryReport);

module.exports = router;