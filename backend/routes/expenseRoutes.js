const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', expenseController.getAllExpenses);
router.get('/summary', expenseController.getExpenseSummary);
router.post('/', verifyToken, requireRole('ADMIN', 'TRUSTEE', 'AUDITOR'), expenseController.createExpense);

module.exports = router;
