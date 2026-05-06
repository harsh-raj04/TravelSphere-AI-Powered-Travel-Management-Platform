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
  getDetails: (id) => apiClient.get(`/packages/${id}/details`),
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

export const paymentAPI = {
  createOrder: (data) => apiClient.post('/payments/create-order', data),
  verify: (data) => apiClient.post('/payments/verify', data),
  getKey: () => apiClient.get('/payments/key'),
};

export const agentAPI = {
  bookings: () => apiClient.get('/bookings/agent'),
  marketplace: () => apiClient.get('/bookings/marketplace'),
  marketplaceDetails: (id) => apiClient.get(`/bookings/marketplace/${id}`),
  applyForTrip: (id, payload) => apiClient.post(`/bookings/${id}/apply`, payload),
  myApplications: () => apiClient.get('/bookings/applications/my'),
  myPackageInterests: () => apiClient.get('/packages/interests/my'),
  optInPackage: (id, payload) => apiClient.post(`/packages/${id}/interest`, payload),
  updateBookingStatus: (id, payload) => apiClient.patch(`/bookings/${id}/status`, payload),
  requestChange: (id, remark) => apiClient.patch(`/bookings/${id}/request-change`, { remark }),
};

export const adminAPI = {
  bookings: (params) => apiClient.get('/admin/bookings', { params }),
  confirmBooking: (id) => apiClient.patch(`/admin/bookings/${id}/confirm`),
  updateBookingStatus: (id, payload) => apiClient.patch(`/admin/bookings/${id}/status`, payload),
  publishBooking: (id) => apiClient.patch(`/admin/bookings/${id}/publish`),
  assignAgent: (id, payload) => apiClient.patch(`/admin/bookings/${id}/assign-agent`, payload),
  updateBookingPayout: (id, payload) => apiClient.patch(`/admin/bookings/${id}/payout`, payload),
  bookingApplications: (id) => apiClient.get(`/admin/bookings/${id}/applications`),
  selectBookingApplication: (bookingId, applicationId) => apiClient.patch(`/admin/bookings/${bookingId}/applications/${applicationId}/select`),
  packageInterests: (id) => apiClient.get(`/admin/packages/${id}/interests`),
  analyticsOverview: () => apiClient.get('/admin/analytics/overview'),
  packages: (params) => apiClient.get('/admin/packages', { params }),
  getPackage: (id) => apiClient.get(`/admin/packages/${id}`),
  updatePackage: (id, data) => apiClient.put(`/admin/packages/${id}`, data),
  featurePackage: (id, payload) => apiClient.patch(`/admin/packages/${id}/feature`, payload),
  togglePackageActive: (id, payload) => apiClient.patch(`/admin/packages/${id}/active`, payload),
  getPackageHistory: (id, params) => apiClient.get(`/admin/packages/${id}/history`, { params }),
  getPackageAgents: (id) => apiClient.get(`/admin/packages/${id}/agents`),
  getPackageReviews: (id, params) => apiClient.get(`/admin/packages/${id}/reviews`, { params }),
  createPackage: (data) => apiClient.post('/packages', data),
  agents: () => apiClient.get('/admin/agents'),
  getAgent: (id) => apiClient.get(`/admin/agents/${id}`),
  customers: () => apiClient.get('/admin/customers'),
  getUser: (id) => apiClient.get(`/admin/users/${id}`),
  transactions: (params) => apiClient.get('/admin/transactions', { params }),
};

export default apiClient;
