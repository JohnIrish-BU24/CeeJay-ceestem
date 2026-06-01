const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');


// Map network paths to the core business logic
router.get('/refillers', employeeController.getRefillers);
router.get('/', employeeController.getAllEmployees);
router.post('/', employeeController.createEmployee);
router.post('/login', employeeController.loginEmployee);

module.exports = router;