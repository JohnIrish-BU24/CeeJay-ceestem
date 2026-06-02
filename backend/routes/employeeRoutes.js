const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Map network paths to the core business logic
router.get('/refillers', employeeController.getRefillers);
router.get('/', employeeController.getAllEmployees);
router.get('/roles', employeeController.getRoles); // Fetches dynamic role stats

// NEW: Endpoint to update job role compensation settings
router.put('/roles/:id', employeeController.updateRole); 

router.post('/', employeeController.createEmployee);
router.post('/login', employeeController.loginEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;