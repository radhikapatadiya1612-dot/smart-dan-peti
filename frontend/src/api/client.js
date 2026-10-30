// Smart Dan Peti API Client with auto-proxy and offline demo fallback
const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('sdp_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sdp_token', token);
  } else {
    localStorage.removeItem('sdp_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      return { success: false, error: errorMsg, status: res.status };
    }

    return { ...data, success: true };
  } catch (error) {
    console.warn(`[API Client Network Notice] Failed to reach backend at ${endpoint}:`, error.message);
    return {
      success: false,
      error: 'Network connection error. Ensure Node.js backend is running on port 5000.',
      isNetworkError: true
    };
  }
}

// Fallback demo data if backend is offline
export const fallbackData = {
  causes: [
    { id: 1, name: 'Annadanam - Free Meals for Devotees', code: 'ANNADANAM' },
    { id: 2, name: 'Temple Heritage & Sanctum Renovation', code: 'RENOVATION' },
    { id: 3, name: 'Goshala - Sacred Cow Care & Fodder', code: 'GOSHALA' },
    { id: 4, name: 'Vidyadhanam - Veda Patashala & Child Education', code: 'VIDYADHANAM' },
    { id: 5, name: 'Daily Deepam & Temple Pooja Seva', code: 'POOJA_SEVA' }
  ],
  stats: {
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
    pending_review_count: 5,
    pending_review_value: 1350,
    active_alerts_count: 1,
    total_spent: 326000,
    net_balance: 3541650,
    utilization_percentage: 8,
    denomination_breakdown: [
      { denomination: '₹500', noteValue: 500, count: 142, total: 71000, color: '#3b82f6' },
      { denomination: '₹200', noteValue: 200, count: 86, total: 17200, color: '#f59e0b' },
      { denomination: '₹100', noteValue: 100, count: 215, total: 21500, color: '#8b5cf6' },
      { denomination: '₹50', noteValue: 50, count: 130, total: 6500, color: '#10b981' },
      { denomination: '₹20', noteValue: 20, count: 180, total: 3600, color: '#ec4899' },
      { denomination: '₹10', noteValue: 10, count: 320, total: 3200, color: '#6366f1' },
      { denomination: 'Coins', noteValue: 5, count: 1190, total: 5950, color: '#14b8a6' }
    ],
    daily_trends: [
      { date: '2026-10-14', amount: 32400, count: 24, cash: 12000, digital: 20400 },
      { date: '2026-10-15', amount: 48500, count: 38, cash: 18500, digital: 30000 },
      { date: '2026-10-16', amount: 56200, count: 42, cash: 21000, digital: 35200 },
      { date: '2026-10-17', amount: 62000, count: 49, cash: 24000, digital: 38000 },
      { date: '2026-10-18', amount: 89000, count: 72, cash: 32000, digital: 57000 },
      { date: '2026-10-19', amount: 74500, count: 61, cash: 28500, digital: 46000 },
      { date: '2026-10-20', amount: 48950, count: 38, cash: 19400, digital: 29550 }
    ],
    recent_donations: [
      { id: 10, receipt_number: 'SDP-REC-20261020-0010', donor_name: 'Srinivasan Iyer', amount: 15000, payment_method: 'UPI_QR', cause_name: 'Temple Heritage & Sanctum Renovation', created_at: '2026-10-20 15:15:50' },
      { id: 9, receipt_number: 'SDP-REC-20261020-0009', donor_name: 'Rajesh K. Aggarwal', amount: 2100, payment_method: 'UPI_QR', cause_name: 'Daily Deepam & Temple Pooja Seva', created_at: '2026-10-20 14:40:25' },
      { id: 8, receipt_number: 'SDP-REC-20261020-0008', donor_name: 'Anonymous Devotee', amount: 1000, payment_method: 'CASH_BOX', cause_name: 'Annadanam - Free Meals for Devotees', created_at: '2026-10-20 14:10:00' },
      { id: 7, receipt_number: 'SDP-REC-20261020-0007', donor_name: 'Vijay & Meena Patel', amount: 5000, payment_method: 'UPI_QR', cause_name: 'Goshala - Sacred Cow Care & Fodder', created_at: '2026-10-20 13:05:14' },
      { id: 6, receipt_number: 'SDP-REC-20261020-0006', donor_name: 'Dr. Sunita Deshmukh', amount: 21000, payment_method: 'NET_BANKING', cause_name: 'Vidyadhanam - Veda Patashala & Child Education', created_at: '2026-10-20 12:20:30' }
    ],
    devices: [
      { id: 1, box_uid: 'SDP-SANCTUM-01', name: 'Sanctum Sanctorum Dan Peti', location: 'Main Temple Garbhagriha Inner Sanctum', status: 'ONLINE', battery_pct: 99, fill_percentage: 72, weight_kg: 18.2, max_weight_kg: 25.0, current_cash_amount: 48500, tamper_alert: 0, lid_status: 'CLOSED' },
      { id: 2, box_uid: 'SDP-EASTGATE-02', name: 'East Gopuram Entrance Kiosk', location: 'East Gate Pilgrim Footpath & Queue', status: 'ONLINE', battery_pct: 94, fill_percentage: 48, weight_kg: 11.5, max_weight_kg: 25.0, current_cash_amount: 26800, tamper_alert: 0, lid_status: 'CLOSED' },
      { id: 3, box_uid: 'SDP-ANNADAN-03', name: 'Annakshetra Dining Hall Box', location: 'Annadanam Kitchen & Devotee Prasad Hall', status: 'ONLINE', battery_pct: 88, fill_percentage: 60, weight_kg: 14.8, max_weight_kg: 25.0, current_cash_amount: 34250, tamper_alert: 0, lid_status: 'CLOSED' },
      { id: 4, box_uid: 'SDP-GOSHALA-04', name: 'Sri Krishna Goshala Box', location: 'Goshala Cow Sanctuary & Fodder Gate', status: 'ONLINE', battery_pct: 92, fill_percentage: 35, weight_kg: 8.4, max_weight_kg: 25.0, current_cash_amount: 19400, tamper_alert: 0, lid_status: 'CLOSED' }
    ]
  }
};

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  getUsers: () => request('/auth/users'),

  // Dashboard Stats
  getDashboardStats: () => request('/stats/dashboard'),
  getAlerts: (resolved) => request(`/stats/alerts?resolved=${resolved !== undefined ? resolved : ''}`),
  resolveAlert: (id) => request(`/stats/alerts/${id}/resolve`, { method: 'PATCH' }),

  // Donations
  getDonations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/donations${query ? `?${query}` : ''}`);
  },
  createDonation: (data) => request('/donations', { method: 'POST', body: JSON.stringify(data) }),
  getReceipt: (query) => request(`/donations/receipt/${encodeURIComponent(query)}`),
  getTicker: () => request('/donations/ticker'),
  generateQr: (amount, causeId) => request(`/donations/generate-qr?amount=${amount}&cause_id=${causeId}`),

  // Devices (Smart Dan Peti Fleet)
  getDevices: () => request('/devices'),
  getDeviceById: (id) => request(`/devices/${id}`),
  updateTelemetry: (id, data) => request(`/devices/${id}/telemetry`, { method: 'POST', body: JSON.stringify(data) }),
  simulateCashDrop: (id, data) => request(`/devices/${id}/simulate-cash`, { method: 'POST', body: JSON.stringify(data) }),
  triggerTamperAlert: (id) => request(`/devices/${id}/tamper-alert`, { method: 'POST' }),
  emptyBoxDualAuth: (id, data) => request(`/devices/${id}/empty-dual-auth`, { method: 'POST', body: JSON.stringify(data) }),

  // Pending Detections (Demo Detection Mode)
  getPendingDetections: (status = 'PENDING') => request(`/detections/pending?status=${status}`),
  simulateDetection: (data) => request('/detections/simulate', { method: 'POST', body: JSON.stringify(data) }),
  approveDetection: (id, data = {}) => request(`/detections/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectDetection: (id, data = {}) => request(`/detections/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),

  // Causes
  getCauses: () => request('/causes'),
  getCauseById: (id) => request(`/causes/${id}`),
  createCause: (data) => request('/causes', { method: 'POST', body: JSON.stringify(data) }),
  updateCause: (id, data) => request(`/causes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Expenses & Transparency
  getExpenses: (causeId) => request(`/expenses${causeId ? `?cause_id=${causeId}` : ''}`),
  getExpenseSummary: () => request('/expenses/summary'),
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Sankalps
  getSankalps: (status) => request(`/sankalps${status ? `?status=${status}` : ''}`),
  createSankalp: (data) => request('/sankalps', { method: 'POST', body: JSON.stringify(data) }),
  updateSankalpStatus: (id, data) => request(`/sankalps/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },
  createAuditLog: (data) => request('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) })
};
