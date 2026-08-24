import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// ============ User API ============
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/change-password', data),
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// ============ Category API ============
export const categoryAPI = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ============ Food API ============
export const foodAPI = {
  getAll: (params?: any) => api.get('/food-items', { params }),
  getById: (id: string) => api.get(`/food-items/${id}`),
  getBySlug: (slug: string) => api.get(`/food-items/slug/${slug}`),
  create: (data: any) => api.post('/food-items', data),
  update: (id: string, data: any) => api.put(`/food-items/${id}`, data),
  delete: (id: string) => api.delete(`/food-items/${id}`),
  toggleAvailability: (id: string) => api.patch(`/food-items/${id}/availability`),
};

// ============ Order API ============
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  getByNumber: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  cancel: (id: string, reason?: string) => api.put(`/orders/${id}/cancel`, { reason }),
  verify: (id: string, code: string) => api.post(`/orders/${id}/verify`, { verificationCode: code }),
  getVerificationStatus: (id: string) => api.get(`/orders/${id}/verification-status`),
};

// ============ Payment API ============
export const paymentAPI = {
  getByOrder: (orderId: string) => api.get(`/payments/order/${orderId}`),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  getAll: (params?: any) => api.get('/payments', { params }),
};

// ============ Promotion API ============
export const promotionAPI = {
  getAll: () => api.get('/promotions'),
  getActive: () => api.get('/promotions/active'),
  getById: (id: string) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.put(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
  validate: (code: string, orderAmount: number) =>
    api.post('/promotions/validate', { code, orderAmount }),
};

// ============ Notification API ============
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ============ Admin API ============

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getSalesReport: (days?: number) => api.get('/admin/reports/sales', { params: { days } }),
};

// ============ Kitchen API ============
export const kitchenAPI = {
  getQueue: () => api.get('/kitchen/queue'),
  getOrderDetail: (id: string) => api.get(`/kitchen/orders/${id}`),
  getCompleted: () => api.get('/kitchen/completed'),
};

// ============ Review API ============
export const reviewAPI = {
  create: (data: any) => api.post('/reviews', data),
  getForFood: (foodItemId: string) => api.get(`/reviews/food/${foodItemId}`),
  getByFoodItem: (foodItemId: string) => api.get(`/reviews/food/${foodItemId}`),
  getMyReviews: () => api.get('/reviews/mine'),
  getAll: (params?: any) => api.get('/reviews', { params }),
  update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export default api;
