const { pool } = require('../config/db');

async function getPendingDetections(req, res) {
  try {
    const status = req.query.status || 'PENDING';
    const [rows] = await pool.query(
      `SELECT d.*, b.name as box_name, b.box_uid, b.location as box_location,
              c.name as cause_name, c.code as cause_code,
              u.name as reviewed_by_name
       FROM pending_detections d
       LEFT JOIN smart_boxes b ON d.box_id = b.id
       LEFT JOIN causes c ON d.cause_id = c.id
       LEFT JOIN users u ON d.reviewed_by_user_id = u.id
       WHERE d.status = ?
       ORDER BY d.created_at DESC`,
      [status]
    );

    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as total_pending,
         COALESCE(SUM(detected_denomination), 0) as pending_value,
         COALESCE(AVG(confidence_score) * 100, 0) as avg_confidence
       FROM pending_detections 
       WHERE status = 'PENDING'`
    );

    return res.json({
      success: true,
      detections: rows,
      stats: {
        total_pending: stats[0].total_pending,
        pending_value: parseFloat(stats[0].pending_value),
        avg_confidence: Math.round(stats[0].avg_confidence)
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) { return res.json({ success: true, detections: [], stats: { total_pending: 0, pending_value: 0, avg_confidence: 95 }, isDemo: true }); }
    console.error('Error fetching pending detections:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pending detections.' });
  }
}

async function simulateDetection(req, res) {
  try {
    const { box_id, detected_denomination, confidence_score, sensor_type, notes, cause_id } = req.body;
    
    const denom = parseInt(detected_denomination || '500', 10);
    const boxId = parseInt(box_id || '1', 10);
    const causeId = parseInt(cause_id || '1', 10);
    const confidence = parseFloat(confidence_score || '0.92');
    const sensor = sensor_type || 'OPTICAL_SPECTRAL';
    const randomSerial = `${Math.floor(1 + Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(100000 + Math.random() * 900000)}`;

    const [result] = await pool.query(
      `INSERT INTO pending_detections (
        box_id, detected_denomination, confidence_score, sensor_type,
        mode, serial_number_snippet, status, cause_id, notes
      ) VALUES (?, ?, ?, ?, 'DEMO_SIMULATION', ?, 'PENDING', ?, ?)`,
      [
        boxId,
        denom,
        confidence,
        sensor,
        randomSerial,
        causeId,
        notes || `Simulated ${denom} INR bill insertion. Optical spectral & UV watermark scan logged.`
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Demo detection logged: ₹${denom} banknote captured in verification buffer.`,
      detection_id: result.insertId,
      denomination: denom,
      confidence_score: confidence,
      serial_snippet: randomSerial
    });
  } catch (error) {
    console.error('Error simulating detection:', error);
    return res.status(500).json({ success: false, message: 'Failed to simulate banknote detection.' });
  }
}

async function approveDetection(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { override_denomination, notes } = req.body;
    const reviewerId = req.user ? req.user.id : 1;
    const reviewerName = req.user ? req.user.name : 'System Auditor';

    const [rows] = await connection.query('SELECT * FROM pending_detections WHERE id = ?', [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Detection record not found.' });
    }

    const detection = rows[0];
    if (detection.status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Detection already marked as ${detection.status}.` });
    }

    const finalAmount = parseFloat(override_denomination || detection.detected_denomination);
    const receiptNumber = `SDP-DET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const transactionId = `HW-DET-${Date.now().toString().slice(-8)}`;

    // 1. Insert official donation record
    await connection.query(
      `INSERT INTO donations (
        receipt_number, transaction_id, box_id, cause_id, donor_name,
        amount, payment_method, payment_status, is_anonymous
      ) VALUES (?, ?, ?, ?, 'Devotee (Verified Hardware Deposit)', ?, 'CASH_BOX', 'COMPLETED', 1)`,
      [receiptNumber, transactionId, detection.box_id, detection.cause_id, finalAmount]
    );

    // 2. Increment cause collected amount
    await connection.query(
      'UPDATE causes SET collected_amount = collected_amount + ? WHERE id = ?',
      [finalAmount, detection.cause_id]
    );

    // 3. Update smart box cash & weight
    const [boxRows] = await connection.query('SELECT * FROM smart_boxes WHERE id = ?', [detection.box_id]);
    if (boxRows.length > 0) {
      const box = boxRows[0];
      const newCash = parseFloat(box.current_cash_amount) + finalAmount;
      const addedWeight = (finalAmount / 500) * 0.05 + 0.02;
      const newWeight = Math.min(parseFloat(box.max_weight_kg), parseFloat(box.weight_kg) + addedWeight);
      const newFill = Math.min(100, Math.round((newWeight / parseFloat(box.max_weight_kg)) * 100));

      await connection.query(
        `UPDATE smart_boxes 
         SET current_cash_amount = ?, weight_kg = ?, fill_percentage = ?, last_heartbeat = NOW()
         WHERE id = ?`,
        [newCash, newWeight.toFixed(2), newFill, detection.box_id]
      );
    }

    // 4. Mark detection as APPROVED
    await connection.query(
      `UPDATE pending_detections 
       SET status = 'APPROVED', reviewed_by_user_id = ?, reviewed_at = NOW(), notes = COALESCE(?, notes)
       WHERE id = ?`,
      [reviewerId, notes || `Verified & confirmed by ${reviewerName}`, id]
    );

    // 5. Audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, 'DETECTION_APPROVED', 'PENDING_DETECTION', ?, ?)`,
      [
        reviewerId,
        reviewerName,
        id.toString(),
        `Approved ₹${finalAmount} banknote detection from Box #${detection.box_id}. Receipt #${receiptNumber} generated.`
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message: `Banknote of ₹${finalAmount} verified and posted to official trust ledger.`,
      receipt_number: receiptNumber
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error approving detection:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve detection.' });
  } finally {
    connection.release();
  }
}

async function rejectDetection(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user ? req.user.id : 1;
    const reviewerName = req.user ? req.user.name : 'System Auditor';

    const [rows] = await pool.query('SELECT * FROM pending_detections WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Detection record not found.' });
    }

    await pool.query(
      `UPDATE pending_detections 
       SET status = 'REJECTED', reviewed_by_user_id = ?, reviewed_at = NOW(), notes = ?
       WHERE id = ?`,
      [reviewerId, reason || 'Rejected: Counterfeit/mutilated/foreign token', id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
       VALUES (?, ?, 'DETECTION_REJECTED', 'PENDING_DETECTION', ?, ?)`,
      [reviewerId, reviewerName, id.toString(), `Rejected detection #${id}: ${reason || 'Unacceptable banknote'}`]
    );

    return res.json({ success: true, message: 'Detection rejected and flagged in rejection log.' });
  } catch (error) {
    console.error('Error rejecting detection:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject detection.' });
  }
}

module.exports = {
  getPendingDetections,
  simulateDetection,
  approveDetection,
  rejectDetection
};
