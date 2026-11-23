const { pool } = require('../config/db');

async function getAllCauses(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
              ROUND((c.collected_amount / c.target_amount) * 100, 1) as progress_percentage,
              (SELECT COUNT(*) FROM donations d WHERE d.cause_id = c.id AND d.payment_status = 'COMPLETED') as donor_count,
              (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.cause_id = c.id) as total_spent
       FROM causes c 
       ORDER BY c.id ASC`
    );

    return res.json({ success: true, causes: rows });
  } catch (error) {
    console.error('Error fetching causes:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve causes from database: ' + error.message });
  }
}

async function getCauseById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM causes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cause not found.' });
    }

    const cause = rows[0];

    const [recentDonations] = await pool.query(
      `SELECT id, 
              CASE WHEN is_anonymous = 1 THEN 'Anonymous Devotee' ELSE donor_name END as donor_name,
              amount, payment_method, created_at
       FROM donations 
       WHERE cause_id = ? AND payment_status = 'COMPLETED'
       ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    const [expenses] = await pool.query(
      `SELECT e.*, u.name as approved_by_name 
       FROM expenses e 
       LEFT JOIN users u ON e.approved_by_user_id = u.id 
       WHERE e.cause_id = ? 
       ORDER BY e.date_incurred DESC`,
      [id]
    );

    return res.json({
      success: true,
      cause: {
        ...cause,
        recent_donations: recentDonations,
        expenses
      }
    });
  } catch (error) {
    console.error('Error fetching cause details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve cause details: ' + error.message });
  }
}

async function createCause(req, res) {
  try {
    const { name, code, tagline, description, target_amount, icon, badge } = req.body;
    if (!name || !code || !description) {
      return res.status(400).json({ success: false, message: 'Name, code, and description are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO causes (name, code, tagline, description, target_amount, icon, badge)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        code.toUpperCase(),
        tagline || null,
        description,
        parseFloat(target_amount || '500000'),
        icon || 'Heart',
        badge || 'Special Seva'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Cause created successfully.',
      cause_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating cause:', error);
    return res.status(500).json({ success: false, message: 'Failed to create cause: ' + error.message });
  }
}

async function updateCause(req, res) {
  try {
    const { id } = req.params;
    const { name, tagline, description, target_amount, is_active, badge } = req.body;

    await pool.query(
      `UPDATE causes 
       SET name = COALESCE(?, name),
           tagline = COALESCE(?, tagline),
           description = COALESCE(?, description),
           target_amount = COALESCE(?, target_amount),
           is_active = COALESCE(?, is_active),
           badge = COALESCE(?, badge)
       WHERE id = ?`,
      [name, tagline, description, target_amount, is_active, badge, id]
    );

    return res.json({ success: true, message: 'Cause updated successfully.' });
  } catch (error) {
    console.error('Error updating cause:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cause: ' + error.message });
  }
}

module.exports = {
  getAllCauses,
  getCauseById,
  createCause,
  updateCause
};
