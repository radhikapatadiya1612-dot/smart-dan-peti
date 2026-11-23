// Smart Dan Peti API Client — Connected directly to backend API & live MySQL
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

// Clean baseline schema (no fake pre-entered dummy numbers)
export const fallbackData = {
  causes: [],
  stats: {
    total_donations: 0,
    total_transactions: 0,
    cash_total: 0,
    digital_total: 0,
    today_amount: 0,
    today_count: 0,
    cash_in_boxes: 0,
    total_weight_kg: 0,
    total_boxes: 0,
    online_boxes: 0,
    alert_boxes: 0,
    offline_boxes: 0,
    pending_review_count: 0,
    pending_review_value: 0,
    active_alerts_count: 0,
    total_spent: 0,
    net_balance: 0,
    utilization_percentage: 0,
    denomination_breakdown: [],
    daily_trends: [],
    recent_donations: [],
    devices: []
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
  getCashDenominations: () => request('/donations/denominations'),
  updateCashDenominations: (denominations) => request('/donations/denominations', { method: 'POST', body: JSON.stringify({ denominations }) }),

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
