const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', deviceController.getAllBoxes);
router.get('/:id', deviceController.getBoxById);
router.post('/:id/telemetry', deviceController.updateTelemetry);
router.post('/:id/simulate-cash', deviceController.simulateCashDrop);
router.post('/:id/tamper-alert', deviceController.triggerTamperAlert);
router.post('/:id/empty-dual-auth', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'PRIEST', 'AUDITOR'), deviceController.emptyBoxDualAuth);

module.exports = router;
