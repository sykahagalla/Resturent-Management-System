import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

export const orderAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  verify: (id: string, code: string) => api.post(`/orders/${id}/verify`, { verificationCode: code }),
  clear: (id: string) => api.put(`/orders/${id}/clear`),
};

export const foodAPI = {
  getAll: (params?: any) => api.get('/food-items', { params }),
  create: (data: any) => api.post('/food-items', data),
  update: (id: string, data: any) => api.put(`/food-items/${id}`, data),
  delete: (id: string) => api.delete(`/food-items/${id}`),
  toggleAvailability: (id: string) => api.patch(`/food-items/${id}/availability`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const reviewAPI = {
  getAll: (page = 1, limit = 20) => api.get('/reviews', { params: { page, limit } }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const promotionAPI = {
  getAll: () => api.get('/promotions'),
  getById: (id: string) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

export default api;
