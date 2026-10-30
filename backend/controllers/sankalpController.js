const { pool } = require('../config/db');

async function getAllSankalps(req, res) {
  try {
    const status = req.query.status;
    let sql = `
      SELECT s.*, d.receipt_number, d.amount, d.created_at as donation_date, c.name as cause_name 
      FROM sankalps s 
      LEFT JOIN donations d ON s.donation_id = d.id 
      LEFT JOIN causes c ON d.cause_id = c.id 
    `;
    const params = [];

    if (status) {
      sql += ' WHERE s.status = ? ';
      params.push(status);
    }

    sql += ' ORDER BY s.created_at DESC ';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, sankalps: rows });
  } catch (error) {
    console.error('Error fetching sankalps:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sankalps.' });
  }
}

async function createSankalp(req, res) {
  try {
    const { devotee_name, gotra, nakshatra, prayer_intent, donation_id } = req.body;
    if (!devotee_name || !prayer_intent) {
      return res.status(400).json({ success: false, message: 'Devotee name and prayer intent are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO sankalps (donation_id, devotee_name, gotra, nakshatra, prayer_intent, status)
       VALUES (?, ?, ?, ?, ?, 'RECEIVED')`,
      [donation_id || null, devotee_name, gotra || null, nakshatra || null, prayer_intent]
    );

    return res.status(201).json({
      success: true,
      message: 'Your sacred Sankalp and prayer have been submitted to the temple sanctum.',
      sankalp_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating sankalp:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit sankalp.' });
  }
}

async function updateSankalpStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, priest_remarks } = req.body;

    if (!['RECEIVED', 'OFFERED_IN_POOJA', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid sankalp status.' });
    }

    await pool.query(
      `UPDATE sankalps 
       SET status = ?, priest_remarks = COALESCE(?, priest_remarks)
       WHERE id = ?`,
      [status, priest_remarks || null, id]
    );

    return res.json({
      success: true,
      message: `Sankalp status updated to "${status}". Blessings registered.`
    });
  } catch (error) {
    console.error('Error updating sankalp:', error);
    return res.status(500).json({ success: false, message: 'Failed to update sankalp status.' });
  }
}

module.exports = {
  getAllSankalps,
  createSankalp,
  updateSankalpStatus
};
