const express = require('express');
const router = express.Router();
const sankalpController = require('../controllers/sankalpController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', sankalpController.getAllSankalps);
router.post('/', sankalpController.createSankalp);
router.patch('/:id/status', verifyToken, requireRole('PRIEST', 'ADMIN', 'TRUSTEE'), sankalpController.updateSankalpStatus);

module.exports = router;
