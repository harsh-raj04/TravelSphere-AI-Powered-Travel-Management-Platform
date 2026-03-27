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

export default apiClient;
