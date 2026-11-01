// Mock fallback data when MySQL is not running
const mockCauses = [
  { id: 1, name: 'Annadanam - Free Meals for Devotees', code: 'ANNADANAM', target_amount: 1000000, collected_amount: 684500, is_active: 1, progress_percentage: 68.5, donor_count: 420 },
  { id: 2, name: 'Temple Heritage & Sanctum Renovation', code: 'RENOVATION', target_amount: 2500000, collected_amount: 1890000, is_active: 1, progress_percentage: 75.6, donor_count: 310 },
  { id: 3, name: 'Goshala - Sacred Cow Care & Fodder', code: 'GOSHALA', target_amount: 750000, collected_amount: 492000, is_active: 1, progress_percentage: 65.6, donor_count: 245 },
  { id: 4, name: 'Vidyadhanam - Veda Patashala & Child Education', code: 'VIDYADHANAM', target_amount: 600000, collected_amount: 385000, is_active: 1, progress_percentage: 64.2, donor_count: 180 },
  { id: 5, name: 'Daily Deepam & Temple Pooja Seva', code: 'POOJA_SEVA', target_amount: 300000, collected_amount: 215000, is_active: 1, progress_percentage: 71.7, donor_count: 265 }
];

const mockDonations = [
  { id: 10, receipt_number: 'SDP-REC-20261020-0010', transaction_id: 'UPI-TXN-9842109850', donor_name: 'Srinivasan Iyer', donor_phone: '+91 98401 22334', amount: 15000, payment_method: 'UPI_QR', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Temple Heritage & Sanctum Renovation', created_at: '2026-10-20 15:15:50' },
  { id: 9, receipt_number: 'SDP-REC-20261020-0009', transaction_id: 'UPI-TXN-9842109849', donor_name: 'Rajesh K. Aggarwal', donor_phone: '+91 98100 99887', amount: 2100, payment_method: 'UPI_QR', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Daily Deepam & Temple Pooja Seva', created_at: '2026-10-20 14:40:25' },
  { id: 7, receipt_number: 'SDP-REC-20261020-0007', transaction_id: 'UPI-TXN-9842109847', donor_name: 'Vijay & Meena Patel', donor_phone: '+91 99201 44556', amount: 5000, payment_method: 'UPI_QR', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Goshala - Sacred Cow Care & Fodder', created_at: '2026-10-20 13:05:14' },
  { id: 6, receipt_number: 'SDP-REC-20261020-0006', transaction_id: 'NET-TXN-9842109846', donor_name: 'Dr. Sunita Deshmukh', donor_phone: '+91 97654 32190', amount: 21000, payment_method: 'NET_BANKING', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Vidyadhanam - Veda Patashala & Child Education', created_at: '2026-10-20 12:20:30' },
  { id: 4, receipt_number: 'SDP-REC-20261020-0004', transaction_id: 'UPI-TXN-9842109844', donor_name: 'Amitabh Sengupta', donor_phone: '+91 98112 34567', amount: 2500, payment_method: 'UPI_QR', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Annadanam - Free Meals for Devotees', created_at: '2026-10-20 11:12:00' },
  { id: 3, receipt_number: 'SDP-REC-20261020-0003', transaction_id: 'CARD-TXN-9842109843', donor_name: 'Kavitha Natarajan', donor_phone: '+91 94451 88992', amount: 11000, payment_method: 'CARD', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Goshala - Sacred Cow Care & Fodder', created_at: '2026-10-20 10:30:45' },
  { id: 1, receipt_number: 'SDP-REC-20261020-0001', transaction_id: 'UPI-TXN-9842109841', donor_name: 'Rameshwar Sharma', donor_phone: '+91 98234 56789', amount: 5100, payment_method: 'UPI_QR', payment_status: 'COMPLETED', is_80g_claimed: 1, cause_name: 'Annadanam - Free Meals for Devotees', created_at: '2026-10-20 09:15:22' }
];

const mockStats = {
  total_donations: 3867650,
  total_transactions: 1420,
  cash_total: 128950,
  digital_total: 3738700,
  today_amount: 48950,
  today_count: 38,
  cash_in_boxes: 128950,
  total_weight_kg: 52.9,
  total_boxes: 4,
  online_boxes: 4,
  alert_boxes: 0,
  offline_boxes: 0,
  pending_review_count: 0,
  pending_review_value: 0,
  active_alerts_count: 0,
  total_spent: 326000,
  net_balance: 3541650,
  denomination_breakdown: [],
  daily_trends: []
};

const mockBoxes = [
  { id: 1, box_uid: 'SDP-SANCTUM-01', name: 'Sanctum Sanctorum Dan Peti', location: 'Main Temple Garbhagriha Inner Sanctum', status: 'ONLINE', battery_pct: 99, fill_percentage: 72, weight_kg: 18.2, max_weight_kg: 25.0, current_cash_amount: 48500, tamper_alert: 0, lid_status: 'CLOSED' },
  { id: 2, box_uid: 'SDP-EASTGATE-02', name: 'East Gopuram Entrance Kiosk', location: 'East Gate Pilgrim Footpath & Queue', status: 'ONLINE', battery_pct: 94, fill_percentage: 48, weight_kg: 11.5, max_weight_kg: 25.0, current_cash_amount: 26800, tamper_alert: 0, lid_status: 'CLOSED' },
  { id: 3, box_uid: 'SDP-ANNADAN-03', name: 'Annakshetra Dining Hall Box', location: 'Annadanam Kitchen & Devotee Prasad Hall', status: 'ONLINE', battery_pct: 88, fill_percentage: 60, weight_kg: 14.8, max_weight_kg: 25.0, current_cash_amount: 34250, tamper_alert: 0, lid_status: 'CLOSED' },
  { id: 4, box_uid: 'SDP-GOSHALA-04', name: 'Sri Krishna Goshala Box', location: 'Goshala Cow Sanctuary & Fodder Gate', status: 'ONLINE', battery_pct: 92, fill_percentage: 35, weight_kg: 8.4, max_weight_kg: 25.0, current_cash_amount: 19400, tamper_alert: 0, lid_status: 'CLOSED' }
];

module.exports = {
  mockCauses,
  mockDonations,
  mockStats,
  mockBoxes
};

