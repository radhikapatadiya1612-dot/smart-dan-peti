const { pool } = require('../config/db');

async function getAuditLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const search = req.query.search;

    let sql = `
      SELECT a.*, u.role as user_role 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
    `;
    const params = [];

    if (search) {
      sql += ' WHERE (a.user_name LIKE ? OR a.action LIKE ? OR a.details LIKE ?) ';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ? ';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, logs: rows });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}

async function createAuditLog(req, res) {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : (req.body.user_name || 'System User');

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userName,
        action || 'SYSTEM_ACTION',
        entity_type || 'GENERAL',
        entity_id || null,
        details || 'Action performed',
        req.ip || '127.0.0.1'
      ]
    );

    return res.status(201).json({ success: true, message: 'Audit entry created.' });
  } catch (error) {
    console.error('Error logging audit:', error);
    return res.status(500).json({ success: false, message: 'Failed to create audit log.' });
  }
}

module.exports = {
  getAuditLogs,
  createAuditLog
};
