const { pool } = require('../config/db');

async function getAllBoxes(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, 
              (SELECT COUNT(*) FROM donations d WHERE d.box_id = b.id) as total_donations_count,
              (SELECT COALESCE(SUM(amount), 0) FROM donations d WHERE d.box_id = b.id) as total_revenue_accumulated
       FROM smart_boxes b 
       ORDER BY b.id ASC`
    );

    return res.json({ success: true, boxes: rows });
  } catch (error) {
    console.error('Error fetching smart boxes:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve smart boxes.' });
  }
}

async function getBoxById(req, res) {
  try {
    const { id } = req.params;
    const [boxRows] = await pool.query('SELECT * FROM smart_boxes WHERE id = ?', [id]);
    if (boxRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Smart Dan Peti not found.' });
    }

    const box = boxRows[0];

    // Fetch recent 10 donations for this specific box
    const [recentDonations] = await pool.query(
      `SELECT d.*, c.name as cause_name 
       FROM donations d 
       LEFT JOIN causes c ON d.cause_id = c.id 
       WHERE d.box_id = ? 
       ORDER BY d.created_at DESC LIMIT 10`,
      [id]
    );

    // Fetch recent alerts for this box
    const [alerts] = await pool.query(
      'SELECT * FROM system_alerts WHERE box_id = ? ORDER BY created_at DESC LIMIT 5',
      [id]
    );

    // Fetch emptying logs for this box
    const [emptyingLogs] = await pool.query(
      `SELECT l.*, u1.name as user1_name, u2.name as user2_name 
       FROM cash_emptying_logs l 
       LEFT JOIN users u1 ON l.emptied_by_user1_id = u1.id 
       LEFT JOIN users u2 ON l.emptied_by_user2_id = u2.id 
       WHERE l.box_id = ? 
       ORDER BY l.emptied_at DESC LIMIT 5`,
      [id]
    );

    return res.json({
      success: true,
      box: {
        ...box,
        recent_donations: recentDonations,
        alerts,
        emptying_logs: emptyingLogs
      }
    });
  } catch (error) {
    console.error('Error fetching box details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve box details.' });
  }
}

// IoT Heartbeat / Telemetry update from microcontroller or simulation
async function updateTelemetry(req, res) {
  try {
    const { id } = req.params;
    const { battery_pct, weight_kg, fill_percentage, lid_status, tamper_alert } = req.body;

    const [boxRows] = await pool.query('SELECT * FROM smart_boxes WHERE id = ?', [id]);
    if (boxRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    const current = boxRows[0];
    const newBattery = battery_pct !== undefined ? battery_pct : current.battery_pct;
    const newWeight = weight_kg !== undefined ? weight_kg : current.weight_kg;
    const newFill = fill_percentage !== undefined ? fill_percentage : current.fill_percentage;
    const newLid = lid_status !== undefined ? lid_status : current.lid_status;
    const newTamper = tamper_alert !== undefined ? (tamper_alert ? 1 : 0) : current.tamper_alert;

    await pool.query(
      `UPDATE smart_boxes 
       SET battery_pct = ?, weight_kg = ?, fill_percentage = ?, lid_status = ?, tamper_alert = ?, last_heartbeat = NOW()
       WHERE id = ?`,
      [newBattery, newWeight, newFill, newLid, newTamper, id]
    );

    if (newTamper && !current.tamper_alert) {
      await pool.query(
        `INSERT INTO system_alerts (box_id, alert_type, severity, message) 
         VALUES (?, 'TAMPER_DETECTED', 'CRITICAL', ?)`,
        [id, `CRITICAL: Physical tamper sensor triggered on Dan Peti #${id} (${current.name})!`]
      );
    }

    return res.json({ success: true, message: 'Telemetry updated successfully.' });
  } catch (error) {
    console.error('Error updating telemetry:', error);
    return res.status(500).json({ success: false, message: 'Failed to update telemetry.' });
  }
}

// Physical Cash Drop Simulation: devotee puts cash notes/coins into the physical box
async function simulateCashDrop(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { amount, cause_id } = req.body;
    const cashAmount = parseFloat(amount || '500');
    const selectedCauseId = parseInt(cause_id || '1', 10);

    const [boxRows] = await connection.query('SELECT * FROM smart_boxes WHERE id = ?', [id]);
    if (boxRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Box not found.' });
    }
    const box = boxRows[0];

    const receiptNumber = `SDP-CASH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const transactionId = `CASH-HW-${Date.now().toString().slice(-8)}`;

    // 1. Insert donation record
    await connection.query(
      `INSERT INTO donations (
        receipt_number, transaction_id, box_id, cause_id, donor_name,
        amount, payment_method, payment_status, is_anonymous
      ) VALUES (?, ?, ?, ?, 'Devotee at Sanctum', ?, 'CASH_BOX', 'COMPLETED', 1)`,
      [receiptNumber, transactionId, id, selectedCauseId, cashAmount]
    );

    // 2. Increment cause collected amount
    await connection.query(
      'UPDATE causes SET collected_amount = collected_amount + ? WHERE id = ?',
      [cashAmount, selectedCauseId]
    );

    // 3. Update smart box telemetry (cash amount, weight, fill percentage)
    const newCash = parseFloat(box.current_cash_amount) + cashAmount;
    const addedWeight = (cashAmount / 500) * 0.08 + 0.03;
    const newWeight = Math.min(parseFloat(box.max_weight_kg), parseFloat(box.weight_kg) + addedWeight);
    const newFillPct = Math.min(100, Math.round((newWeight / parseFloat(box.max_weight_kg)) * 100));

    await connection.query(
      `UPDATE smart_boxes 
       SET current_cash_amount = ?, weight_kg = ?, fill_percentage = ?, last_heartbeat = NOW()
       WHERE id = ?`,
      [newCash, newWeight.toFixed(2), newFillPct, id]
    );

    if (newFillPct >= 85) {
      await connection.query(
        `INSERT INTO system_alerts (box_id, alert_type, severity, message) 
         VALUES (?, 'BOX_FULL', 'HIGH', ?)`,
        [id, `Smart Dan Peti "${box.name}" is now at ${newFillPct}% capacity (${newWeight.toFixed(2)} kg). Emptying required.`]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Simulated cash deposit of ₹${cashAmount} into ${box.name}`,
      receipt_number: receiptNumber,
      new_cash_total: newCash,
      new_fill_pct: newFillPct,
      new_weight_kg: newWeight.toFixed(2)
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error simulating cash drop:', error);
    return res.status(500).json({ success: false, message: 'Failed to simulate cash deposit.' });
  } finally {
    connection.release();
  }
}

// Simulate physical tamper / tilt sensor alert
async function triggerTamperAlert(req, res) {
  try {
    const { id } = req.params;
    const [boxRows] = await pool.query('SELECT * FROM smart_boxes WHERE id = ?', [id]);
    if (boxRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Box not found.' });
    }
    const box = boxRows[0];

    // Toggle or activate tamper
    const isTampered = !box.tamper_alert;

    await pool.query(
      'UPDATE smart_boxes SET tamper_alert = ?, lid_status = ?, status = ? WHERE id = ?',
      [isTampered ? 1 : 0, isTampered ? 'OPEN' : 'CLOSED', isTampered ? 'ALERT' : 'ONLINE', id]
    );

    if (isTampered) {
      await pool.query(
        `INSERT INTO system_alerts (box_id, alert_type, severity, message) 
         VALUES (?, 'TAMPER_DETECTED', 'CRITICAL', ?)`,
        [id, `EMERGENCY ALERT: Physical tilt or unauthorized lid movement detected on ${box.name} (${box.box_uid}) at ${box.location}!`]
      );
    }

    return res.json({
      success: true,
      message: isTampered ? 'Tamper alert triggered! Alarm is active.' : 'Tamper alarm cleared. Device status restored to normal.',
      tamper_alert: isTampered
    });
  } catch (error) {
    console.error('Error triggering tamper alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tamper status.' });
  }
}

// Dual-Key Physical Cash Emptying Workflow
async function emptyBoxDualAuth(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { user1_id, user2_id, seal_bag_number, notes } = req.body;

    if (!user1_id || !user2_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Dual-authentication required: Two authorized trustees/officials must authenticate to empty the physical box.'
      });
    }

    if (parseInt(user1_id, 10) === parseInt(user2_id, 10)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Dual authentication requires two distinct individuals.'
      });
    }

    const [boxRows] = await connection.query('SELECT * FROM smart_boxes WHERE id = ?', [id]);
    if (boxRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Box not found.' });
    }
    const box = boxRows[0];

    const cashCollected = parseFloat(box.current_cash_amount);
    const weightBefore = parseFloat(box.weight_kg);
    const bagNumber = seal_bag_number || `SEAL-BAG-${Date.now().toString().slice(-6)}`;

    // Insert audit log for emptying
    await connection.query(
      `INSERT INTO cash_emptying_logs (
        box_id, emptied_by_user1_id, emptied_by_user2_id, amount_collected,
        seal_bag_number, weight_before_kg, verified_by_auditor, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [id, user1_id, user2_id, cashCollected, bagNumber, weightBefore, notes || 'Scheduled trust dual-key clearance']
    );

    // Reset smart box cash amount and weight to zero (empty baseline)
    await connection.query(
      `UPDATE smart_boxes 
       SET current_cash_amount = 0.00, weight_kg = 0.00, fill_percentage = 0,
           tamper_alert = 0, lid_status = 'CLOSED', status = 'ONLINE',
           last_emptied_at = NOW(), last_heartbeat = NOW()
       WHERE id = ?`,
      [id]
    );

    // Resolve any pending BOX_FULL or TAMPER alerts for this box
    await connection.query(
      `UPDATE system_alerts 
       SET is_resolved = 1 
       WHERE box_id = ? AND alert_type IN ('BOX_FULL', 'TAMPER_DETECTED')`,
      [id]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: `Box successfully emptied and sealed! ₹${cashCollected.toLocaleString()} safely secured in Bag #${bagNumber}.`,
      amount_collected: cashCollected,
      seal_bag_number: bagNumber,
      emptied_at: new Date().toISOString()
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error emptying box:', error);
    return res.status(500).json({ success: false, message: 'Failed to process dual-authentication cash emptying.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllBoxes,
  getBoxById,
  updateTelemetry,
  simulateCashDrop,
  triggerTamperAlert,
  emptyBoxDualAuth
};
