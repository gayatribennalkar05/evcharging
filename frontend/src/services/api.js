// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  r => r.data,
  e => Promise.reject({
    message:
      e.response?.data?.error ||
      e.response?.data?.details?.[0] ||
      (e.code === 'ECONNABORTED' ? 'Request timed out. Check backend.' : 'Network error. Is backend running?'),
    code:   e.response?.data?.code,
    status: e.response?.status
  })
);

export const stationAPI = {
  getAll:   ()         => api.get('/stations'),
  getStats: ()         => api.get('/stations/stats'),
  getOne:   id         => api.get(`/stations/${id}`),
  getSlots: (id, date) => api.get(`/stations/${id}/slots?date=${date}`)
};

export const bookingAPI = {
  create:    data      => api.post('/bookings', data),
  getByToken: tok      => api.get(`/bookings/${tok}`),
  cancel:    tok       => api.delete(`/bookings/${tok}`),
  addReview: (tok, data) => api.post(`/bookings/${tok}/review`, data)
};
