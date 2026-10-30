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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid donation amount.' });
    }

    if (!cause_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Please select a cause or fund for donation.' });
    }

    // Verify cause exists
    const [causeRows] = await connection.query('SELECT * FROM causes WHERE id = ? AND is_active = 1', [cause_id]);
    if (causeRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Selected donation cause not found or inactive.' });
    }
    const cause = causeRows[0];

    const receiptNumber = generateReceiptNumber();
    const transactionId = generateTxnId(payment_method || 'UPI');
    const method = payment_method || 'UPI_QR';

    const safeDonorName = is_anonymous ? 'Anonymous Devotee' : (donor_name?.trim() || 'Generous Devotee');
    const is80G = Boolean(is_80g_claimed && donor_pan);

    // Insert donation record
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
        cause_id,
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
      [donationAmount, cause_id]
    );

    // If cash inserted at a physical box or kiosk
    let boxName = null;
    if (box_id) {
      const [boxRows] = await connection.query('SELECT * FROM smart_boxes WHERE id = ?', [box_id]);
      if (boxRows.length > 0) {
        const box = boxRows[0];
        boxName = box.name;
        let newCash = parseFloat(box.current_cash_amount);
        let newWeight = parseFloat(box.weight_kg);

        if (method === 'CASH_BOX') {
          newCash += donationAmount;
          // Approximate weight addition: ~1.5g per currency note / coin blend
          const addedKg = (donationAmount / 500) * 0.05 + 0.02;
          newWeight = Math.min(parseFloat(box.max_weight_kg), newWeight + addedKg);
        }

        const maxWeight = parseFloat(box.max_weight_kg) || 25;
        const newFillPct = Math.min(100, Math.round((newWeight / maxWeight) * 100));

        await connection.query(
          `UPDATE smart_boxes 
           SET current_cash_amount = ?, weight_kg = ?, fill_percentage = ?, last_heartbeat = NOW()
           WHERE id = ?`,
          [newCash, newWeight.toFixed(2), newFillPct, box_id]
        );

        // Check if box capacity triggers an alert
        if (newFillPct >= 85) {
          await connection.query(
            `INSERT INTO system_alerts (box_id, alert_type, severity, message) 
             VALUES (?, 'BOX_FULL', 'HIGH', ?)`,
            [box_id, `Smart Dan Peti "${box.name}" has reached ${newFillPct}% capacity. Urgent emptying recommended.`]
          );
        }
      }
    }

    // If Sankalp provided, insert into sankalps table
    let sankalpId = null;
    if (sankalp_text && sankalp_text.trim().length > 0) {
      const [sankalpRes] = await connection.query(
        `INSERT INTO sankalps (donation_id, devotee_name, gotra, nakshatra, prayer_intent, status)
         VALUES (?, ?, ?, ?, ?, 'RECEIVED')`,
        [
          donationId,
          safeDonorName,
          devotee_gotra || null,
          devotee_nakshatra || null,
          sankalp_text.trim()
        ]
      );
      sankalpId = sankalpRes.insertId;
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
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR Code generation notice:', qrErr.message);
    }

    // Spiritual blessing message for devotee
    const blessings = [
      'May the supreme divine shower eternal peace, prosperity, and divine grace upon you and your family.',
      'Your auspicious contribution directly nourishes lives and preserves our sacred sanctuary. Om Shanti.',
      'Blessed is the hand that gives with devotion. May health, harmony, and joy always illuminate your home.',
      'With the blessings of the Almighty, your noble seva has been sanctified and recorded in the holy trust ledger.'
    ];
    const blessing = blessings[Math.floor(Math.random() * blessings.length)];

    return res.status(201).json({
      success: true,
      message: 'Donation processed successfully!',
      donation: {
        id: donationId,
        receipt_number: receiptNumber,
        transaction_id: transactionId,
        amount: donationAmount,
        cause_id: cause.id,
        cause_name: cause.name,
        cause_code: cause.code,
        box_id: box_id || null,
        box_name: boxName,
        donor_name: safeDonorName,
        donor_phone: is_anonymous ? null : (donor_phone || null),
        donor_email: is_anonymous ? null : (donor_email || null),
        donor_pan: is80G ? donor_pan.toUpperCase() : null,
        donor_address: is_anonymous ? null : (donor_address || null),
        is_80g_claimed: is80G,
        payment_method: method,
        payment_status: 'COMPLETED',
        created_at: new Date().toISOString(),
        qr_code: qrDataUrl,
        upi_uri: upiUri,
        sankalp_id: sankalpId,
        sankalp_text: sankalp_text || null,
        devotee_gotra: devotee_gotra || null,
        devotee_nakshatra: devotee_nakshatra || null,
        is_anonymous: is_anonymous ? 1 : 0,
        blessing
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating donation:', error);
    return res.status(500).json({ success: false, message: 'Failed to process donation. Please try again.' });
  } finally {
    connection.release();
  }
}

async function getAllDonations(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const causeId = req.query.cause_id;
    const method = req.query.payment_method;
    const search = req.query.search;

    let whereClauses = ['1=1'];
    let params = [];

    if (causeId) {
      whereClauses.push('d.cause_id = ?');
      params.push(causeId);
    }
    if (method) {
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
    return res.status(500).json({ success: false, message: 'Failed to retrieve donations.' });
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
    return res.status(500).json({ success: false, message: 'Failed to retrieve donation ticker.' });
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
      return res.status(404).json({ success: false, message: 'No donation receipt found matching the query.' });
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
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR Code generation notice:', qrErr.message);
    }

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
    return res.status(500).json({ success: false, message: 'Error looking up receipt.' });
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
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
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
    return res.status(500).json({ success: false, message: 'Failed to generate QR code.' });
  }
}

module.exports = {
  createDonation,
  getAllDonations,
  getRecentTicker,
  getReceipt,
  generatePaymentQr
};
