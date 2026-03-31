import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Prevent browser/proxy caching for API reads so dashboards always get fresh data.
  if ((config.method || '').toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
    config.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
  }

  return config;
});

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
};

export const packagesAPI = {
  list: (params) => apiClient.get('/packages', { params }),
  getById: (id) => apiClient.get(`/packages/${id}`),
  create: (data) => apiClient.post('/packages', data),
  update: (id, data) => apiClient.put(`/packages/${id}`, data),
  remove: (id) => apiClient.delete(`/packages/${id}`),
};

export const bookingsAPI = {
  create: (data) => apiClient.post('/bookings', data),
  myBookings: () => apiClient.get('/bookings/my'),
};

export const transactionsAPI = {
  getByBooking: (bookingId) => apiClient.get(`/transactions/${bookingId}`),
};

export const agentAPI = {
  bookings: () => apiClient.get('/bookings/agent'),
  updateBookingStatus: (id, status) => apiClient.patch(`/bookings/${id}/status`, { status }),
};

export const adminAPI = {
  bookings: (params) => apiClient.get('/admin/bookings', { params }),
  analyticsOverview: () => apiClient.get('/admin/analytics/overview'),
  packages: (params) => apiClient.get('/admin/packages', { params }),
  agents: () => apiClient.get('/admin/agents'),
  customers: () => apiClient.get('/admin/customers'),
  transactions: (params) => apiClient.get('/admin/transactions', { params }),
};

export default apiClient;
