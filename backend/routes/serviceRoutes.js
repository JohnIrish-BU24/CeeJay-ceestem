const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getAllServices);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

// Add archive and restore routes
router.put('/:id/archive', serviceController.archiveService);
router.put('/:id/restore', serviceController.restoreService);

module.exports = router;