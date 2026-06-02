const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Map network paths to the core business logic
router.get('/refillers', employeeController.getRefillers);
router.get('/', employeeController.getAllEmployees);
router.get('/roles', employeeController.getRoles); 

router.post('/', employeeController.createEmployee);
router.post('/login', employeeController.loginEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Add archive and restore routes
router.put('/:id/archive', employeeController.archiveEmployee);
router.put('/:id/restore', employeeController.restoreEmployee);

module.exports = router;