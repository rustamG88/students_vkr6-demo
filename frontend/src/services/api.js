import axios from 'axios'
import { WebApp } from '@twa-dev/sdk'

// Safe WebApp checker
const isWebAppAvailable = () => {
  try {
    return !!(WebApp && typeof WebApp === 'object' && window.TG_WEB_APP_READY)
  } catch (error) {
    console.warn('WebApp availability check failed:', error)
    return false
  }
}

// Create axios instance
const getApiBaseUrl = () => {
  // Приоритет: переменная окружения > BACKEND_URL из env > определение по URL страницы
  const envUrl = import.meta.env.VITE_API_URL;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://your-app.ngrok-free.app/api'; // ✅ Переменная вместо hardcode
  const currentHost = window.location.hostname;
  
  console.log('Environment variables:', import.meta.env);
  console.log('VITE_API_URL:', envUrl);
  console.log('VITE_BACKEND_URL:', backendUrl);
  console.log('Current hostname:', currentHost);
  
  let finalUrl;
  
  // Если есть переменная окружения - используем её
  if (envUrl && envUrl.startsWith('/')) {
    finalUrl = envUrl; // Относительный путь для Railway/Docker
  } else if (envUrl) {
    finalUrl = envUrl; // Используем заданный URL
  } else if (currentHost.includes('.ngrok.') || currentHost.includes('.ngrok-free.')) {
    // Если запущено через ngrok - используем backend URL
    finalUrl = backendUrl;
  } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // Локальная разработка - используем backend URL для тестирования Telegram
    finalUrl = backendUrl;
  } else {
    // Production - используем относительный путь
    finalUrl = '/api';
  }
  
  console.log('Final API URL:', finalUrl);
  console.log('Running mode:', currentHost === 'localhost' ? 'local development (using backend)' : 'production');
  
  return finalUrl;
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // Увеличил timeout для ngrok
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - добавляем токен авторизации
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Добавляем токен авторизации если он есть
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // Логируем запросы
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
      if (config.data) {
        console.log('Request data:', config.data)
      }
    } catch (error) {
      console.warn('Error in request interceptor:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - УПРОЩЕННЫЙ без проверок авторизации
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config?.url}`)
    return response
  },
  (error) => {
    console.error('API Error:', error)

    try {
      // Простая обработка ошибок без проверок сессии
      if (error.response) {
        const { status, data } = error.response
        console.warn(`HTTP ${status}:`, error.config?.url, data)
        
        // Просто логируем, не показываем алерты
        if (status === 404) {
          console.warn('Resource not found:', error.config?.url || 'unknown')
        } else if (status >= 500) {
          console.error('Server error:', status, data)
        }
      } else if (error.request) {
        console.error('Network error (ngrok may be down):', error.request)
      }
    } catch (handlerError) {
      console.warn('Error in response interceptor:', handlerError)
    }

    return Promise.reject(error)
  }
)

export default apiClient

// API endpoints
export const authAPI = {
  // Новые методы для JSON backend
  login: (data) => apiClient.post('/auth-json/login', data),
  register: (data) => apiClient.post('/auth-json/register', data),
  validate: () => apiClient.get('/auth-json/validate'),
  
  // Старые методы (для совместимости)
  start: (initData) => apiClient.post('/auth/start', { initData }),
  completeProfile: (data) => apiClient.post('/auth/complete-profile', data),
  completeProfileSimple: (data) => apiClient.post('/auth/complete-profile-simple', data),
  test: () => apiClient.get('/auth/test')
}

export const usersAPI = {
  // JSON backend routes
  getAll: () => apiClient.get('/users-json'),
  getById: (id) => apiClient.get(`/users-json/${id}`),
  getMe: () => apiClient.get('/users-json/profile/me'),
  updateMe: (data) => apiClient.put('/users-json/profile/me', data),
  uploadAvatar: (formData) => apiClient.post('/users-json/avatar/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Старые методы для совместимости
  getByDepartment: (department) => apiClient.get(`/users/department/${department}`),
  getDepartments: () => apiClient.get('/users/departments/list')
}

export const tasksAPI = {
  // JSON backend routes
  getAll: (params) => apiClient.get('/tasks-json', { params }),
  getById: (id) => apiClient.get(`/tasks-json/${id}`),
  create: (data) => apiClient.post('/tasks-json', data),
  update: (id, data) => apiClient.put(`/tasks-json/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/tasks-json/${id}/status`, data),
  delete: (id) => apiClient.delete(`/tasks-json/${id}`),
  getStatuses: () => apiClient.get('/tasks-json/meta/statuses'),
  getPriorities: () => apiClient.get('/tasks-json/meta/priorities')
}

export const employeesAPI = {
  // JSON backend routes
  getAll: (params) => apiClient.get('/employees-json', { params }),
  getById: (id) => apiClient.get(`/employees-json/${id}`),
  create: (data) => apiClient.post('/employees-json', data),
  update: (id, data) => apiClient.put(`/employees-json/${id}`, data),
  delete: (id) => apiClient.delete(`/employees-json/${id}`),
  
  // Notes
  getNotes: (id) => apiClient.get(`/employees-json/${id}/notes`),
  addNote: (id, data) => apiClient.post(`/employees-json/${id}/notes`, data),
  deleteNote: (id, noteId) => apiClient.delete(`/employees-json/${id}/notes/${noteId}`),
  
  // Старые методы
  getDepartments: () => apiClient.get('/employees/meta/departments'),
  getByDepartment: (department) => apiClient.get(`/employees/department/${department}`),
  generateInvite: (data) => apiClient.post('/employees/invite', data)
}

export const calendarAPI = {
  // JSON backend routes  
  getTasks: (params) => apiClient.get('/calendar-json/tasks', { params }),
  getTasksByDate: (date) => apiClient.get(`/calendar-json/date/${date}`),
  getOverview: (params) => apiClient.get('/calendar-json/overview', { params }),
  getTasksWithoutDate: () => apiClient.get('/calendar-json/no-date'),
  scheduleTask: (taskId, data) => apiClient.patch(`/calendar-json/tasks/${taskId}/schedule`, data),
  updateTaskStatus: (taskId, data) => apiClient.patch(`/calendar-json/tasks/${taskId}/status`, data),
  updateTaskPriority: (taskId, data) => apiClient.patch(`/calendar-json/tasks/${taskId}/priority`, data),
  removeFromCalendar: (taskId) => apiClient.delete(`/calendar-json/tasks/${taskId}/schedule`),
  
  // Employee notes for tasks
  getEmployeeNotes: (taskId) => apiClient.get(`/calendar-json/tasks/${taskId}/notes`),
  saveEmployeeNote: (data) => apiClient.post('/calendar-json/tasks/notes', data),
  deleteEmployeeNote: (noteId) => apiClient.delete(`/calendar-json/tasks/notes/${noteId}`)
}

export const teamsAPI = {
  // JSON backend routes для команд
  getAll: () => apiClient.get('/teams-json'),
  getById: (id) => apiClient.get(`/teams-json/${id}`),
  create: (data) => apiClient.post('/teams-json', data),
  update: (id, data) => apiClient.put(`/teams-json/${id}`, data),
  delete: (id) => apiClient.delete(`/teams-json/${id}`),
  
  // Управление участниками
  getMembers: (id) => apiClient.get(`/teams-json/${id}/members`),
  addMember: (id, data) => apiClient.post(`/teams-json/${id}/members`, data),
  removeMember: (id, userId) => apiClient.delete(`/teams-json/${id}/members/${userId}`),
  
  // Приглашения
  generateInvite: (id, data) => apiClient.post(`/teams-json/${id}/invite`, data),
  acceptInvite: (code) => apiClient.post(`/teams-json/invite/accept`, { code })
} 