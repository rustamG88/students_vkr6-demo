import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const loading = ref(false)

  // Actions
  const authenticateStart = async (initData) => {
    loading.value = true
    
    try {
      const response = await apiClient.post('/auth/start', {
        initData
      })

      if (response.data.success) {
        const { user: userData, token: authToken, needsProfileCompletion, isNewUser } = response.data.data
        
        // Store auth data
        user.value = userData
        token.value = authToken
        localStorage.setItem('token', authToken)
        
        // Set default authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
        
        return {
          success: true,
          needsProfileCompletion,
          isNewUser,
          user: userData
        }
      }
      
      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Authentication error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка аутентификации' 
      }
    } finally {
      loading.value = false
    }
  }

  const completeProfile = async (profileData) => {
    loading.value = true
    
    try {
      // Простой запрос без токенов и авторизации
      const response = await apiClient.post('/auth/complete-profile-simple', profileData)
      
      if (response.data.success) {
        const { user: userData } = response.data.data
        
        // Просто сохраняем данные пользователя
        user.value = userData
        
        // Имитируем что пользователь авторизован
        token.value = 'no-auth-mode'
        localStorage.setItem('token', 'no-auth-mode')
        
        return { success: true, user: userData, message: response.data.message }
      }
      
      return { success: false, message: response.data.message || 'Неизвестная ошибка' }
    } catch (error) {
      console.error('Profile completion error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка сохранения профиля' 
      }
    } finally {
      loading.value = false
    }
  }

  const validateToken = async () => {
    // В режиме без авторизации всегда возвращаем true
    return true
  }

  const updateProfile = async (profileData) => {
    loading.value = true
    
    try {
      const response = await apiClient.put('/users/me', profileData)
      
      if (response.data.success) {
        user.value = response.data.data
        return { success: true, user: response.data.data }
      }
      
      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Profile update error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка обновления профиля' 
      }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    delete apiClient.defaults.headers.common['Authorization']
  }

  const initializeAuth = async () => {
    // В упрощенном режиме просто проверяем есть ли токен
    if (token.value && token.value !== 'null') {
      console.log('Found token, user is considered authenticated')
      return true
    }
    return false
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    
    // Actions
    authenticateStart,
    completeProfile,
    validateToken,
    updateProfile,
    logout,
    initializeAuth
  }
}) 