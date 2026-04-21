import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add JWT token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
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

// Handle 401 Unauthorized responses (expired token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('[API] Received 401 - clearing session');
      // Clear token from storage on unauthorized response
      sessionStorage.removeItem('authToken');
      // Trigger logout by reloading
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  updateStatus: (id, payload) => apiClient.patch(`/bookings/${id}/status`, payload),
  submitFeedback: (id, payload) => apiClient.patch(`/bookings/${id}/feedback`, payload),
};

export const transactionsAPI = {
  getByBooking: (bookingId) => apiClient.get(`/transactions/${bookingId}`),
};

export const agentAPI = {
  bookings: () => apiClient.get('/bookings/agent'),
  updateBookingStatus: (id, payload) => apiClient.patch(`/bookings/${id}/status`, payload),
  requestChange: (id, remark) => apiClient.patch(`/bookings/${id}/request-change`, { remark }),
};

export const adminAPI = {
  bookings: (params) => apiClient.get('/admin/bookings', { params }),
  confirmBooking: (id) => apiClient.patch(`/admin/bookings/${id}/confirm`),
  assignAgent: (id, payload) => apiClient.patch(`/admin/bookings/${id}/assign-agent`, payload),
  analyticsOverview: () => apiClient.get('/admin/analytics/overview'),
  packages: (params) => apiClient.get('/admin/packages', { params }),
  createPackage: (data) => apiClient.post('/packages', data),
  agents: () => apiClient.get('/admin/agents'),
  customers: () => apiClient.get('/admin/customers'),
  transactions: (params) => apiClient.get('/admin/transactions', { params }),
};

export default apiClient;
