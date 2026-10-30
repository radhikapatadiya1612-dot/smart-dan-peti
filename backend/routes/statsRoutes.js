const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/dashboard', statsController.getDashboardStats);
router.get('/alerts', statsController.getAlerts);
router.patch('/alerts/:id/resolve', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'AUDITOR'), statsController.resolveAlert);

module.exports = router;
