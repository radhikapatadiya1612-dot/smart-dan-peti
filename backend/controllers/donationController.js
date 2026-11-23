const QRCode = require('qrcode');
const { pool } = require('../config/db');

// Helper to generate formatted receipt numbers
function generateReceiptNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SDP-REC-${dateStr}-${randomSuffix}`;
}

// Helper to generate transaction IDs
function generateTxnId(method = 'UPI') {
  const prefix = method.substring(0, 4).toUpperCase();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-TXN-${timestamp}${random}`;
}

async function createDonation(req, res) {
  let connection = null;
  try {
    const {
      amount,
      cause_id,
      box_id,
      donor_name,
      donor_phone,
      donor_email,
      donor_pan,
      donor_address,
      payment_method,
      is_80g_claimed,
      sankalp_text,
      devotee_gotra,
      devotee_nakshatra,
      is_anonymous
    } = req.body;

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid donation amount.' });
    }

    const receiptNumber = generateReceiptNumber();
    const transactionId = generateTxnId(payment_method || 'UPI');
    const method = payment_method || 'UPI_QR';
    const safeDonorName = is_anonymous ? 'Anonymous Devotee' : (donor_name?.trim() || 'Generous Devotee');
    const is80G = Boolean(is_80g_claimed && donor_pan);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify cause exists in database
    const [causeRows] = await connection.query('SELECT * FROM causes WHERE id = ? AND is_active = 1', [cause_id || 1]);
    const cause = causeRows[0] || { id: 1, name: 'General Temple Fund', code: 'GENERAL' };

    // Insert donation record directly into database
    const [donationResult] = await connection.query(
      `INSERT INTO donations (
        receipt_number, transaction_id, box_id, cause_id, donor_name,
        donor_phone, donor_email, donor_pan, donor_address, amount,
        payment_method, payment_status, is_80g_claimed, sankalp_text,
        devotee_gotra, devotee_nakshatra, is_anonymous
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?)`,
      [
        receiptNumber,
        transactionId,
        box_id || null,
        cause.id,
        safeDonorName,
        is_anonymous ? null : (donor_phone || null),
        is_anonymous ? null : (donor_email || null),
        is80G ? donor_pan.toUpperCase() : null,
        is_anonymous ? null : (donor_address || null),
        donationAmount,
        method,
        is80G ? 1 : 0,
        sankalp_text || null,
        devotee_gotra || null,
        devotee_nakshatra || null,
        is_anonymous ? 1 : 0
      ]
    );

    const donationId = donationResult.insertId;

    // Update cause collected amount
    await connection.query(
      'UPDATE causes SET collected_amount = collected_amount + ? WHERE id = ?',
      [donationAmount, cause.id]
    );

    // If box_id provided and payment is cash, update smart_box cash amount
    if (box_id && method === 'CASH_BOX') {
      await connection.query(
        'UPDATE smart_boxes SET current_cash_amount = current_cash_amount + ? WHERE id = ?',
        [donationAmount, box_id]
      );
    }

    // If sankalp_text provided, insert into sankalps table
    if (sankalp_text) {
      await connection.query(
        `INSERT INTO sankalps (donation_id, devotee_name, gotra, nakshatra, prayer_intent, status)
         VALUES (?, ?, ?, ?, ?, 'RECEIVED')`,
        [donationId, safeDonorName, devotee_gotra || null, devotee_nakshatra || null, sankalp_text]
      );
    }

    await connection.commit();

    // Generate UPI payload and QR code data URL
    const upiVpa = process.env.UPI_VPA || 'smartdanpeti@upi';
    const payeeName = process.env.UPI_PAYEE_NAME || 'Smart Dan Peti Trust';
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Donation ${receiptNumber}`)}`;
    
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(upiUri, {
        margin: 2,
        width: 300,
        color: { dark: '#1e293b', light: '#ffffff' }
      });
    } catch (qrErr) {}

    return res.status(201).json({
      success: true,
      message: 'Donation recorded and committed to database successfully!',
      donation: {
        id: donationId,
        receipt_number: receiptNumber,
        transaction_id: transactionId,
        amount: donationAmount,
        cause_id: cause.id,
        cause_name: cause.name,
        donor_name: safeDonorName,
        donor_phone: is_anonymous ? null : (donor_phone || null),
        donor_email: is_anonymous ? null : (donor_email || null),
        donor_pan: is80G ? donor_pan.toUpperCase() : null,
        is_80g_claimed: is80G,
        payment_method: method,
        payment_status: 'COMPLETED',
        created_at: new Date().toISOString(),
        qr_code: qrDataUrl,
        upi_uri: upiUri,
        blessing: 'With the blessings of the Almighty, your noble seva has been sanctified and recorded in the holy trust ledger.'
      }
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('Error creating donation:', error);
    return res.status(500).json({ success: false, message: 'Database error creating donation: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
}

async function getAllDonations(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = (page - 1) * limit;
    const causeId = req.query.cause_id;
    const method = req.query.payment_method;
    const search = req.query.search;

    let whereClauses = ['1=1'];
    let params = [];

    if (causeId && causeId !== 'ALL') {
      whereClauses.push('d.cause_id = ?');
      params.push(causeId);
    }
    if (method && method !== 'ALL') {
      whereClauses.push('d.payment_method = ?');
      params.push(method);
    }
    if (search) {
      whereClauses.push('(d.donor_name LIKE ? OR d.receipt_number LIKE ? OR d.transaction_id LIKE ? OR d.donor_phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM donations d WHERE ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT d.*, c.name as cause_name, b.name as box_name 
       FROM donations d 
       LEFT JOIN causes c ON d.cause_id = c.id 
       LEFT JOIN smart_boxes b ON d.box_id = b.id 
       WHERE ${whereSql} 
       ORDER BY d.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      donations: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve donations from database: ' + error.message });
  }
}

async function getRecentTicker(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, 
              CASE WHEN d.is_anonymous = 1 THEN 'Anonymous Devotee' ELSE d.donor_name END as donor_name,
              d.amount, d.payment_method, d.created_at, c.name as cause_name, c.icon as cause_icon
       FROM donations d 
       LEFT JOIN causes c ON d.cause_id = c.id 
       WHERE d.payment_status = 'COMPLETED'
       ORDER BY d.created_at DESC 
       LIMIT 10`
    );

    return res.json({ success: true, ticker: rows });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve donation ticker: ' + error.message });
  }
}

async function getReceipt(req, res) {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search parameter required.' });
    }

    const [rows] = await pool.query(
      `SELECT d.*, c.name as cause_name, c.tagline as cause_tagline, b.name as box_name, b.location as box_location,
              s.gotra, s.nakshatra, s.prayer_intent, s.status as sankalp_status, s.priest_remarks
       FROM donations d 
       LEFT JOIN causes c ON d.cause_id = c.id 
       LEFT JOIN smart_boxes b ON d.box_id = b.id 
       LEFT JOIN sankalps s ON s.donation_id = d.id 
       WHERE d.receipt_number = ? OR d.transaction_id = ? OR d.donor_phone = ?
       ORDER BY d.created_at DESC`,
      [query, query, query]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No donation receipt found matching the query in database.' });
    }

    const receipt = rows[0];
    const upiVpa = process.env.UPI_VPA || 'smartdanpeti@upi';
    const payeeName = process.env.UPI_PAYEE_NAME || 'Smart Dan Peti Trust';
    const donationAmount = parseFloat(receipt.amount || 0);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${donationAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Donation ${receipt.receipt_number}`)}`;

    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(upiUri, {
        margin: 2,
        width: 300,
        color: { dark: '#1e293b', light: '#ffffff' }
      });
    } catch (qrErr) {}

    receipt.qr_code = qrDataUrl;
    receipt.upi_uri = upiUri;
    receipt.blessing = 'With the blessings of the Almighty, your noble seva has been sanctified and recorded in the holy trust ledger.';

    return res.json({
      success: true,
      receipt: receipt,
      allReceipts: rows
    });
  } catch (error) {
    console.error('Error looking up receipt:', error);
    return res.status(500).json({ success: false, message: 'Error looking up receipt: ' + error.message });
  }
}

async function generatePaymentQr(req, res) {
  try {
    const amount = parseFloat(req.query.amount || '500');
    const causeId = req.query.cause_id || '1';
    const upiVpa = process.env.UPI_VPA || 'smartdanpeti@upi';
    const payeeName = process.env.UPI_PAYEE_NAME || 'Smart Dan Peti Trust';
    
    const txnNote = `Donation to Cause #${causeId}`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(txnNote)}`;

    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      margin: 2,
      width: 320,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    return res.json({
      success: true,
      upi_uri: upiUri,
      qr_code: qrDataUrl,
      amount,
      vpa: upiVpa,
      payee_name: payeeName
    });
  } catch (error) {
    console.error('Error generating payment QR:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate QR code: ' + error.message });
  }
}

async function getCashDenominations(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM cash_denominations ORDER BY type DESC, value DESC');
    return res.json({ success: true, denominations: rows });
  } catch (error) {
    console.error('Error querying cash_denominations:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateCashDenominations(req, res) {
  try {
    const { denominations } = req.body;
    if (Array.isArray(denominations)) {
      for (const item of denominations) {
        await pool.query(
          `INSERT INTO cash_denominations (id, name, value, type, color, daily, weekly, monthly, yearly)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name),
             value = VALUES(value),
             type = VALUES(type),
             color = VALUES(color),
             daily = VALUES(daily),
             weekly = VALUES(weekly),
             monthly = VALUES(monthly),
             yearly = VALUES(yearly)`,
          [
            item.id,
            item.name,
            item.value,
            item.type,
            item.color || '#3b82f6',
            item.daily || 0,
            item.weekly || 0,
            item.monthly || 0,
            item.yearly || 0
          ]
        );
      }
    }
    const [rows] = await pool.query('SELECT * FROM cash_denominations ORDER BY type DESC, value DESC');
    return res.json({ success: true, denominations: rows });
  } catch (error) {
    console.error('Error updating cash_denominations:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createDonation,
  getAllDonations,
  getRecentTicker,
  getReceipt,
  generatePaymentQr,
  getCashDenominations,
  updateCashDenominations
};
