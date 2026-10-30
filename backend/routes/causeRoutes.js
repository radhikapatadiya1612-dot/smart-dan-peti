const express = require('express');
const router = express.Router();
const causeController = require('../controllers/causeController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', causeController.getAllCauses);
router.get('/:id', causeController.getCauseById);
router.post('/', verifyToken, requireRole('ADMIN', 'TRUSTEE'), causeController.createCause);
router.put('/:id', verifyToken, requireRole('ADMIN', 'TRUSTEE'), causeController.updateCause);

module.exports = router;
