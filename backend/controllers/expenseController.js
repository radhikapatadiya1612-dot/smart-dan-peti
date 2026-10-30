const { pool } = require('../config/db');

async function getAllExpenses(req, res) {
  try {
    const causeId = req.query.cause_id;
    let sql = `
      SELECT e.*, c.name as cause_name, u.name as approved_by_name 
      FROM expenses e 
      LEFT JOIN causes c ON e.cause_id = c.id 
      LEFT JOIN users u ON e.approved_by_user_id = u.id 
    `;
    const params = [];

    if (causeId) {
      sql += ' WHERE e.cause_id = ? ';
      params.push(causeId);
    }

    sql += ' ORDER BY e.date_incurred DESC ';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, expenses: rows });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
}

async function createExpense(req, res) {
  try {
    const { cause_id, title, category, amount, vendor_name, invoice_number, date_incurred, notes } = req.body;
    if (!cause_id || !title || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Cause, title, category, and amount are required.' });
    }

    const approvedBy = req.user ? req.user.id : 1;

    const [result] = await pool.query(
      `INSERT INTO expenses (cause_id, title, category, amount, vendor_name, invoice_number, approved_by_user_id, date_incurred, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cause_id,
        title,
        category,
        parseFloat(amount),
        vendor_name || null,
        invoice_number || null,
        approvedBy,
        date_incurred || new Date().toISOString().slice(0, 10),
        notes || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      expense_id: result.insertId
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    return res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
}

async function getExpenseSummary(req, res) {
  try {
    const [byCategory] = await pool.query(
      `SELECT category, SUM(amount) as total_amount, COUNT(*) as count 
       FROM expenses 
       GROUP BY category 
       ORDER BY total_amount DESC`
    );

    const [byCause] = await pool.query(
      `SELECT c.name as cause_name, SUM(e.amount) as total_spent, c.collected_amount 
       FROM expenses e 
       JOIN causes c ON e.cause_id = c.id 
       GROUP BY c.id, c.name, c.collected_amount`
    );

    const [totalRows] = await pool.query('SELECT COALESCE(SUM(amount), 0) as grand_total FROM expenses');

    return res.json({
      success: true,
      grand_total_spent: totalRows[0].grand_total,
      by_category: byCategory,
      by_cause: byCause
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve expense summary.' });
  }
}

module.exports = {
  getAllExpenses,
  createExpense,
  getExpenseSummary
};
