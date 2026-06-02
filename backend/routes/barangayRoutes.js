const express = require('express');
const router = express.Router();
const barangayController = require('../controllers/barangayController');

router.get('/', barangayController.getAllBarangays);
router.post('/', barangayController.createBarangay);
router.put('/:id', barangayController.updateBarangay);
router.delete('/:id', barangayController.deleteBarangay);

// Add archive and restore routes
router.put('/:id/archive', barangayController.archiveBarangay);
router.put('/:id/restore', barangayController.restoreBarangay);

module.exports = router;