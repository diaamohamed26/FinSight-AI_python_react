
import axios from 'axios'

// ==========================================
// API Configuration
// ==========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ==========================================
// Request Interceptor - JWT Authentication
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finsight_access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ==========================================
// Response Interceptor - Error Handling
// ==========================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthRequest = requestUrl.includes('/auth/')

      if (!isAuthRequest) {
        localStorage.removeItem('finsight_access_token')
        localStorage.removeItem('finsight_user')

        const currentPath = window.location.pathname

        if (!['/login', '/register'].includes(currentPath)) {
          window.location.replace('/login')
        }
      }
    }

    return Promise.reject(error)
  },
)

// ==========================================
// API Error Helper
// ==========================================

export const getAPIError = (error) => {
  const detail = error.response?.data?.detail

  if (detail) {
    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || item.message || 'Invalid input')
        .join(', ')
    }

    if (typeof detail === 'string') {
      return detail
    }

    return 'Request validation failed.'
  }

  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.response?.data?.error) {
    return error.response.data.error
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.'
  }

  if (!error.response) {
    return 'Unable to connect to the server. Check that the backend is running.'
  }

  if (error.response.status === 401) {
    return 'Your session has expired. Please log in again.'
  }

  if (error.response.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  if (error.response.status === 404) {
    return 'The requested resource was not found.'
  }

  if (error.response.status >= 500) {
    return 'Server error. Please try again later.'
  }

  return 'Something went wrong. Please try again.'
}

// ==========================================
// Authentication API
// ==========================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ==========================================
// Dashboard API
// ==========================================

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// ==========================================
// Transactions API
// ==========================================

export const transactionsAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
}

// ==========================================
// Budgets API
// ==========================================

export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// ==========================================
// Reports API
// ==========================================

export const reportsAPI = {
  expenses: (params = {}) => api.get('/reports/expenses', { params }),
}

// ==========================================
// Financial Forecast API
// ==========================================

export const forecastAPI = {
  get: () => api.get('/forecast'),
}

// ==========================================
// AI Assistant API
// ==========================================

export const aiAPI = {
  chat: (message, history = []) =>
    api.post('/ai/chat', {
      message,
      history,
    }),

  health: () => api.get('/ai/health'),
}

// ==========================================
// Settings API
// ==========================================

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

// ==========================================
// Health API
// ==========================================

export const healthAPI = {
  check: () => api.get('/health'),
}

// ==========================================
// Default Export
// ==========================================

export default api
