const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'AUDITOR'), auditController.getAuditLogs);
router.post('/', verifyToken, auditController.createAuditLog);

module.exports = router;
