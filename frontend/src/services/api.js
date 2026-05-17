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
  getTerms: () => apiClient.get('/packages/terms'),
  searchCount: (params) => apiClient.get('/packages/search-count', { params }),
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
  bookings: (params) => apiClient.get('/bookings/agent', { params }),
  marketplaceCount: () => apiClient.get('/bookings/marketplace/count'),
  marketplace: () => apiClient.get('/bookings/marketplace'),
  marketplaceDetails: (id) => apiClient.get(`/bookings/marketplace/${id}`),
  applyForTrip: (id, payload) => apiClient.post(`/bookings/${id}/apply`, payload),
  myApplications: () => apiClient.get('/bookings/applications/my'),
  myPackageInterests: () => apiClient.get('/packages/interests/my'),
  optInPackage: (id, payload) => apiClient.post(`/packages/${id}/interest`, payload),
  optOutPackage: (id) => apiClient.delete(`/packages/${id}/interest`),
  updateBookingStatus: (id, payload) => apiClient.patch(`/bookings/${id}/status`, payload),
  requestChange: (id, remark) => apiClient.patch(`/bookings/${id}/request-change`, { remark }),
  // Profile
  getProfile: () => apiClient.get('/agent/profile'),
  updateProfile: (data) => apiClient.put('/agent/profile', data),
  requestEmailChange: (newEmail) => apiClient.post('/agent/profile/request-email-change', { newEmail }),
  verifyEmailChange: (newEmail, otp) => apiClient.post('/agent/profile/verify-email-change', { newEmail, otp }),
  requestPhoneChange: (newPhone) => apiClient.post('/agent/profile/request-phone-change', { newPhone }),
  verifyPhoneChange: (newPhone, otp) => apiClient.post('/agent/profile/verify-phone-change', { newPhone, otp }),
  // Payment methods
  getPaymentMethods: () => apiClient.get('/agent/payment-methods'),
  addPaymentMethod: (data) => apiClient.post('/agent/payment-methods', data),
  updatePaymentMethod: (id, data) => apiClient.put(`/agent/payment-methods/${id}`, data),
  deletePaymentMethod: (id) => apiClient.delete(`/agent/payment-methods/${id}`),
  // Earnings & withdrawals
  getEarningsSummary: () => apiClient.get('/agent/earnings/summary'),
  getWithdrawalHistory: () => apiClient.get('/agent/earnings/withdrawals'),
  createWithdrawal: (amount, paymentMethodId) =>
    apiClient.post('/agent/earnings/withdraw', { amount, paymentMethodId }),
  // Notifications
  getNotifications: (params) => apiClient.get('/agent/notifications', { params }),
  getUnreadCount: () => apiClient.get('/agent/notifications/unread-count'),
  markNotificationRead: (id) => apiClient.patch(`/agent/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/agent/notifications/mark-all-read'),
  // Support tickets
  createTicket: (data) => apiClient.post('/tickets', data),
  getMyTickets: () => apiClient.get('/tickets'),
  getTicket: (id) => apiClient.get(`/tickets/${id}`),
  addTicketMessage: (id, message) => apiClient.post(`/tickets/${id}/messages`, { message }),
  updateTicketStatus: (id, status) => apiClient.patch(`/tickets/${id}/status`, { status }),
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
  // Agent withdrawal management
  getWithdrawals: (params) => apiClient.get('/admin/withdrawals', { params }),
  approveWithdrawal: (id) => apiClient.patch(`/admin/withdrawals/${id}/approve`),
  completeWithdrawal: (id, reference) => apiClient.patch(`/admin/withdrawals/${id}/complete`, { reference }),
  failWithdrawal: (id, reason) => apiClient.patch(`/admin/withdrawals/${id}/fail`, { reason }),
  // Support tickets
  adminTickets: (params) => apiClient.get('/admin/tickets', { params }),
  adminTicketStats: () => apiClient.get('/admin/tickets/stats'),
  adminGetTicket: (id) => apiClient.get(`/admin/tickets/${id}`),
  adminReplyTicket: (id, data) => apiClient.post(`/admin/tickets/${id}/messages`, data),
  adminUpdateTicket: (id, data) => apiClient.patch(`/admin/tickets/${id}`, data),
  // Admin notifications
  getNotifications: () => apiClient.get('/admin/notifications'),
  getUnreadNotificationCount: () => apiClient.get('/admin/notifications/unread-count'),
  markNotificationRead: (id) => apiClient.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch('/admin/notifications/mark-all-read'),
  // Admin create booking
  createBookingForCustomer: (data) => apiClient.post('/admin/bookings', data),
};

export const supportAPI = {
  createTicket: (data) => apiClient.post('/tickets', data),
  getMyTickets: () => apiClient.get('/tickets'),
  getTicket: (id) => apiClient.get(`/tickets/${id}`),
  addMessage: (id, message) => apiClient.post(`/tickets/${id}/messages`, { message }),
  closeTicket: (id) => apiClient.patch(`/tickets/${id}/status`, { status: 'resolved' }),
};

export const customerAPI = {
  getProfile: () => apiClient.get('/customer/profile'),
  updateProfile: (data) => apiClient.patch('/customer/profile', data),
  changePassword: (data) => apiClient.patch('/customer/password', data),
};

export const customRequestsAPI = {
  // Customer
  submit:          (data) => apiClient.post('/custom-requests', data),
  getMyRequests:   ()     => apiClient.get('/custom-requests/my'),
  respond:         (id, action, customerNote) => apiClient.patch(`/custom-requests/${id}/respond`, { action, customerNote }),
  getMessages:     (id)   => apiClient.get(`/custom-requests/${id}/messages`),
  addMessage:      (id, message) => apiClient.post(`/custom-requests/${id}/messages`, { message }),
  createOrder:     (id)   => apiClient.post(`/custom-requests/${id}/create-order`),
  verifyPayment:   (id, data) => apiClient.post(`/custom-requests/${id}/verify-payment`, data),
  // Admin
  getAll:             (params) => apiClient.get('/custom-requests', { params }),
  setReviewing:       (id)     => apiClient.patch(`/custom-requests/${id}/reviewing`),
  postToMarketplace:  (id)     => apiClient.post(`/custom-requests/${id}/post-to-marketplace`),
  sendQuote:          (id, data) => apiClient.post(`/custom-requests/${id}/send-quote`, data),
  updateNote:         (id, adminNote) => apiClient.patch(`/custom-requests/${id}`, { adminNote }),
};

export const aiAPI = {
  getMyConversations: () => apiClient.get('/ai/my-conversations'),
  getConversation: (sessionId) => apiClient.get(`/ai/conversations/${sessionId}`),
  submitFeedback: (sessionId, messageIndex, feedback) =>
    apiClient.patch(`/ai/conversations/${sessionId}/feedback`, { messageIndex, feedback }),
  getAnalytics: () => apiClient.get('/ai/analytics'),
};

export default apiClient;
