const express = require('express');
const router = express.Router();
const barangayController = require('../controllers/barangayController');

router.get('/', barangayController.getAllBarangays);
router.post('/', barangayController.createBarangay);
router.put('/:id', barangayController.updateBarangay);
router.delete('/:id', barangayController.deleteBarangay);

module.exports = router;