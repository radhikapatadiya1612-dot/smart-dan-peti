const { pool } = require('../config/db');

async function getSettings(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.json({
        success: true,
        settings: {
          trust_name: 'Sri Maha Mandir Trust',
          tax_80g_number: 'AAATS1234F/80G/2022-23',
          upi_vpa: 'smartdanpeti@upi',
          weight_threshold_kg: 20.0,
          fill_alert_pct: 85,
          demo_mode_enabled: 1,
          auto_approve_threshold: 0.98,
          currency_symbol: '₹'
        }
      });
    }
    return res.json({ success: true, settings: rows[0] });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      trust_name,
      tax_80g_number,
      upi_vpa,
      weight_threshold_kg,
      fill_alert_pct,
      demo_mode_enabled,
      auto_approve_threshold,
      currency_symbol
    } = req.body;

    await pool.query(
      `UPDATE app_settings 
       SET trust_name = COALESCE(?, trust_name),
           tax_80g_number = COALESCE(?, tax_80g_number),
           upi_vpa = COALESCE(?, upi_vpa),
           weight_threshold_kg = COALESCE(?, weight_threshold_kg),
           fill_alert_pct = COALESCE(?, fill_alert_pct),
           demo_mode_enabled = COALESCE(?, demo_mode_enabled),
           auto_approve_threshold = COALESCE(?, auto_approve_threshold),
           currency_symbol = COALESCE(?, currency_symbol)
       WHERE id = 1`,
      [
        trust_name,
        tax_80g_number,
        upi_vpa,
        weight_threshold_kg,
        fill_alert_pct,
        demo_mode_enabled !== undefined ? (demo_mode_enabled ? 1 : 0) : null,
        auto_approve_threshold,
        currency_symbol
      ]
    );

    const userName = req.user ? req.user.name : 'Administrator';
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, 'SETTINGS_UPDATED', 'APP_SETTINGS', '1', 'System and trust settings updated.')`,
      [req.user ? req.user.id : null, userName]
    );

    return res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
