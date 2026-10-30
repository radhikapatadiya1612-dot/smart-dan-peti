const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/pending', detectionController.getPendingDetections);
router.post('/simulate', detectionController.simulateDetection);
router.post('/:id/approve', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'AUDITOR', 'OPERATOR'), detectionController.approveDetection);
router.post('/:id/reject', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'AUDITOR', 'OPERATOR'), detectionController.rejectDetection);

module.exports = router;
