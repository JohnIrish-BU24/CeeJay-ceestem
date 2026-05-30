const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Map network paths to the core business logic
router.get('/', employeeController.getAllEmployees);
router.get('/roles', employeeController.getRoles); // NEW: Fetches dynamic role stats

router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;