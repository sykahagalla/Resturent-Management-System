import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
};

export const kitchenAPI = {
  getQueue: () => api.get('/kitchen/queue'),
  getCompleted: () => api.get('/kitchen/completed'),
};

export const orderAPI = {
  updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  verify: (id: string, code: string) => api.post(`/orders/${id}/verify`, { verificationCode: code }),
};

export default api;
