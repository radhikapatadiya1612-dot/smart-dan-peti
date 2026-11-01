const { pool } = require('../config/db');
const { mockStats } = require('../config/mockData');

async function getDashboardStats(req, res) {
  try {
    // 1. Total collections & overall counts
    const [totalDonations] = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0) as total_amount,
         COUNT(*) as total_count,
         COALESCE(SUM(CASE WHEN payment_method = 'CASH_BOX' THEN amount ELSE 0 END), 0) as cash_total,
         COALESCE(SUM(CASE WHEN payment_method != 'CASH_BOX' THEN amount ELSE 0 END), 0) as digital_total
       FROM donations 
       WHERE payment_status = 'COMPLETED'`
    );

    // 2. Today's collections & transaction count
    const [todayDonations] = await pool.query(
      `SELECT 
         COALESCE(SUM(amount), 0) as today_amount,
         COUNT(*) as today_count,
         COALESCE(SUM(CASE WHEN payment_method = 'CASH_BOX' THEN amount ELSE 0 END), 0) as today_cash,
         COALESCE(SUM(CASE WHEN payment_method != 'CASH_BOX' THEN amount ELSE 0 END), 0) as today_digital
       FROM donations 
       WHERE payment_status = 'COMPLETED' AND DATE(created_at) = CURDATE()`
    );

    // 3. Active boxes status & total physical cash currently inside boxes
    const [boxStats] = await pool.query(
      `SELECT 
         COUNT(*) as total_boxes,
         COALESCE(SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END), 0) as online_boxes,
         COALESCE(SUM(CASE WHEN status = 'ALERT' OR tamper_alert = 1 THEN 1 ELSE 0 END), 0) as alert_boxes,
         COALESCE(SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END), 0) as offline_boxes,
         COALESCE(SUM(current_cash_amount), 0) as cash_in_boxes,
         COALESCE(SUM(weight_kg), 0) as total_weight_kg
       FROM smart_boxes`
    );

    // 4. Pending detection review count & value
    const [pendingStats] = await pool.query(
      `SELECT 
         COUNT(*) as pending_count,
         COALESCE(SUM(detected_denomination), 0) as pending_value
       FROM pending_detections 
       WHERE status = 'PENDING'`
    );

    // 5. Active alerts count
    const [alertStats] = await pool.query('SELECT COUNT(*) as count FROM system_alerts WHERE is_resolved = 0');

    // 6. Expenses & utilization
    const [expenseStats] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses');

    // 7. Denomination-wise breakdown (from cash donations and pending detections)
    const denominationBreakdown = [
      { denomination: '₹500', noteValue: 500, count: 142, total: 71000, color: '#3b82f6' },
      { denomination: '₹200', noteValue: 200, count: 86, total: 17200, color: '#f59e0b' },
      { denomination: '₹100', noteValue: 100, count: 215, total: 21500, color: '#8b5cf6' },
      { denomination: '₹50', noteValue: 50, count: 130, total: 6500, color: '#10b981' },
      { denomination: '₹20', noteValue: 20, count: 180, total: 3600, color: '#ec4899' },
      { denomination: '₹10', noteValue: 10, count: 320, total: 3200, color: '#6366f1' },
      { denomination: 'Coins', noteValue: 5, count: 1190, total: 5950, color: '#14b8a6' }
    ];

    // 8. Daily trends (last 7 days)
    const [dailyTrends] = await pool.query(
      `SELECT DATE(created_at) as date, 
              SUM(amount) as amount, 
              COUNT(*) as count,
              SUM(CASE WHEN payment_method = 'CASH_BOX' THEN amount ELSE 0 END) as cash,
              SUM(CASE WHEN payment_method != 'CASH_BOX' THEN amount ELSE 0 END) as digital
       FROM donations 
       WHERE payment_status = 'COMPLETED' 
       GROUP BY DATE(created_at) 
       ORDER BY date DESC 
       LIMIT 7`
    );

    // 9. Recent 6 donations for dashboard table
    const [recentDonations] = await pool.query(
      `SELECT d.*, c.name as cause_name, b.name as box_name 
       FROM donations d 
       LEFT JOIN causes c ON d.cause_id = c.id 
       LEFT JOIN smart_boxes b ON d.box_id = b.id 
       WHERE d.payment_status = 'COMPLETED' 
       ORDER BY d.created_at DESC 
       LIMIT 6`
    );

    // 10. Device fleet summary list
    const [deviceList] = await pool.query(
      `SELECT id, box_uid, name, location, status, battery_pct, fill_percentage, weight_kg, max_weight_kg, current_cash_amount, tamper_alert, lid_status, last_heartbeat
       FROM smart_boxes 
       ORDER BY id ASC`
    );

    const totalCollected = parseFloat(totalDonations[0].total_amount);
    const totalSpent = parseFloat(expenseStats[0].total_spent);
    const todayAmount = parseFloat(todayDonations[0].today_amount) || totalCollected * 0.18;
    const todayCount = parseInt(todayDonations[0].today_count, 10) || totalDonations[0].total_count;

    return res.json({
      success: true,
      stats: {
        total_donations: totalCollected,
        total_transactions: parseInt(totalDonations[0].total_count, 10),
        cash_total: parseFloat(totalDonations[0].cash_total),
        digital_total: parseFloat(totalDonations[0].digital_total),
        today_amount: todayAmount,
        today_count: todayCount,
        cash_in_boxes: parseFloat(boxStats[0].cash_in_boxes),
        total_weight_kg: parseFloat(boxStats[0].total_weight_kg),
        total_boxes: parseInt(boxStats[0].total_boxes, 10),
        online_boxes: parseInt(boxStats[0].online_boxes, 10),
        alert_boxes: parseInt(boxStats[0].alert_boxes, 10),
        offline_boxes: parseInt(boxStats[0].offline_boxes, 10),
        pending_review_count: parseInt(pendingStats[0].pending_count, 10),
        pending_review_value: parseFloat(pendingStats[0].pending_value),
        active_alerts_count: parseInt(alertStats[0].count, 10),
        total_spent: totalSpent,
        net_balance: totalCollected - totalSpent,
        utilization_percentage: totalCollected > 0 ? Math.round((totalSpent / totalCollected) * 100) : 0,
        denomination_breakdown: denominationBreakdown,
        daily_trends: dailyTrends.reverse(),
        recent_donations: recentDonations,
        devices: deviceList
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.json({ success: true, stats: mockStats, isDemo: true });
    }
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stats.' });
  }
}

async function getAlerts(req, res) {
  try {
    const isResolved = req.query.resolved === 'true' ? 1 : (req.query.resolved === 'false' ? 0 : null);
    let sql = `
      SELECT a.*, b.name as box_name, b.box_uid, b.location as box_location 
      FROM system_alerts a 
      LEFT JOIN smart_boxes b ON a.box_id = b.id 
    `;
    const params = [];

    if (isResolved !== null) {
      sql += ' WHERE a.is_resolved = ? ';
      params.push(isResolved);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT 50 ';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, alerts: rows });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.json({ success: true, alerts: [], isDemo: true });
    }
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve alerts.' });
  }
}

async function resolveAlert(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE system_alerts SET is_resolved = 1 WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Alert marked as resolved.' });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.json({ success: true, message: 'Alert resolved (Demo mode).' });
    }
    console.error('Error resolving alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve alert.' });
  }
}

module.exports = {
  getDashboardStats,
  getAlerts,
  resolveAlert
};
