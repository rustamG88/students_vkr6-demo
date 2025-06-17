<template>
  <div class="user-profile-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
        </svg>
      </button>
      <h1 class="title">Профиль</h1>
      <button 
        class="save-btn" 
        @click="handleSave"
        :disabled="!hasChanges || loading"
      >
        {{ loading ? '...' : 'Сохранить' }}
      </button>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-container">
          <div v-if="!form.avatar_url" class="avatar-placeholder">
            {{ getInitials() }}
          </div>
          <img v-else :src="getAvatarUrl(form.avatar_url)" alt="Profile" class="avatar-image" />
          <button class="avatar-upload" @click="handlePhotoUpload" :disabled="loading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="form-section">
        <!-- Name Fields -->
        <div class="field-group">
          <label class="field-label">Name (Имя)</label>
          <div class="field-container" :class="{ 'error': errors.first_name }">
            <input
              v-model="form.first_name"
              type="text"
              placeholder="Имя"
              class="field-input"
              @blur="validateFirstName"
              @input="clearError('first_name')"
            />
          </div>
          <div v-if="errors.first_name" class="error-text">{{ errors.first_name }}</div>
        </div>

        <div class="field-group">
          <label class="field-label">Фамилия</label>
          <div class="field-container" :class="{ 'error': errors.last_name }">
            <input
              v-model="form.last_name"
              type="text"
              placeholder="Фамилия"
              class="field-input"
              @blur="validateLastName"
              @input="clearError('last_name')"
            />
          </div>
          <div v-if="errors.last_name" class="error-text">{{ errors.last_name }}</div>
        </div>

        <!-- Position Field -->
        <div class="field-group">
          <label class="field-label">Position (Должность)</label>
          <div class="field-container">
            <input
              v-model="form.position"
              type="text"
              placeholder="Введите должность"
              class="field-input"
              readonly
            />
          </div>
        </div>

        <!-- Company Field -->
        <div class="field-group">
          <label class="field-label">Company (Компания)</label>
          <div class="field-container">
            <input
              v-model="form.company"
              type="text"
              placeholder="Введите название компании"
              class="field-input"
              readonly
            />
          </div>
        </div>

        <!-- Phone Field -->
        <div class="field-group">
          <label class="field-label">Phone number (Номер телефона)</label>
          <div class="field-container" :class="{ 'error': errors.phone }">
            <input
              v-model="form.phone"
              type="tel"
              placeholder="+7 (900) 123-45-67"
              class="field-input"
              @blur="validatePhone"
              @input="clearError('phone')"
            />
          </div>
          <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
        </div>

        <!-- Nickname Field -->
        <div class="field-group">
          <label class="field-label">Nickname (Никнейм Тг)</label>
          <div class="field-container" :class="{ 'error': errors.username }">
            <input
              v-model="form.username"
              type="text"
              placeholder="@username"
              class="field-input"
              @blur="validateUsername"
              @input="clearError('username')"
            />
          </div>
          <div v-if="errors.username" class="error-text">{{ errors.username }}</div>
        </div>

        <!-- Birthday Field -->
        <div class="field-group">
          <label class="field-label">Birthday (Дата рождения)</label>
          <div class="field-container" :class="{ 'error': errors.birthday }">
            <input
              v-model="form.birthday"
              type="date"
              class="field-input"
              @blur="validateBirthday"
              @input="clearError('birthday')"
              :max="getMaxBirthdayDate()"
            />
          </div>
          <div v-if="errors.birthday" class="error-text">{{ errors.birthday }}</div>
        </div>

        <!-- About Field - только если есть данные -->
        <div class="field-group" v-if="form.bio && form.bio.trim()">
          <label class="field-label">About me (Обо мне)</label>
          <div class="field-container">
            <textarea
              v-model="form.bio"
              placeholder="Расскажите о себе..."
              class="field-input field-textarea"
              rows="4"
            ></textarea>
          </div>
        </div>
        
        <!-- Add Bio Button - показываем только если поле пустое -->
        <div class="field-group" v-else>
          <button class="add-bio-btn" type="button" @click="showBioField">
            Добавить описание о себе
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation - ИСПРАВЛЕНО -->
    <BottomNavigation />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { usersAPI } from '@/services/api'
import BottomNavigation from '@/components/BottomNavigation.vue'

export default {
  name: 'UserProfile',
  components: {
    BottomNavigation
  },
  setup() {
    const router = useRouter()
    const { showAlert } = useWebApp()
    const loading = ref(false)
    const originalData = ref({})

    const form = ref({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      company: '',
      department: '',
      username: '',
      bio: '',
      birthday: '',
      avatar_url: null
    })

    const errors = ref({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      company: '',
      department: '',
      username: '',
      birthday: ''
    })

    // Computed
    const hasChanges = computed(() => {
      if (!originalData.value || Object.keys(originalData.value).length === 0) {
        return true // Если originalData пустая, считаем что есть изменения
      }
      return JSON.stringify(form.value) !== JSON.stringify(originalData.value)
    })

    // Methods
    const getInitials = () => {
      const firstName = form.value.first_name || ''
      const lastName = form.value.last_name || ''
      
      if (firstName && lastName) {
        return (firstName[0] + lastName[0]).toUpperCase()
      } else if (firstName) {
        return firstName[0].toUpperCase()
      }
      
      return 'П'
    }

    const getAvatarUrl = (avatarUrl) => {
      if (!avatarUrl) return null
      
      // If already a full URL, return as is
      if (avatarUrl.startsWith('http')) {
        return avatarUrl
      }
      
      // If relative path, prepend API base URL
              const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')
      return `${baseUrl}${avatarUrl}`
    }

    // Validation methods
    const validateFirstName = () => {
      if (!form.value.first_name.trim()) {
        errors.value.first_name = 'Имя обязательно для заполнения'
        return false
      }
      if (form.value.first_name.trim().length < 2) {
        errors.value.first_name = 'Имя должно содержать минимум 2 символа'
        return false
      }
      errors.value.first_name = ''
      return true
    }

    const validateLastName = () => {
      if (!form.value.last_name.trim()) {
        errors.value.last_name = 'Фамилия обязательна для заполнения'
        return false
      }
      if (form.value.last_name.trim().length < 2) {
        errors.value.last_name = 'Фамилия должна содержать минимум 2 символа'
        return false
      }
      errors.value.last_name = ''
      return true
    }

    const validateCompany = () => {
      if (!form.value.company.trim()) {
        errors.value.company = 'Компания обязательна для заполнения'
        return false
      }
      errors.value.company = ''
      return true
    }

    const validateDepartment = () => {
      // Department is optional
      errors.value.department = ''
      return true
    }

    const validatePhone = () => {
      // Номер телефона не обязателен, проверяем только если заполнен
      if (form.value.phone.trim()) {
        // Удаляем все символы кроме цифр и +
        const phoneDigits = form.value.phone.replace(/[^\d+]/g, '')
        
        // Более мягкая валидация - просто проверяем что есть + и хотя бы 10 цифр
        if (phoneDigits.length < 10) {
          errors.value.phone = 'Номер телефона слишком короткий'
          return false
        }
        
        // Автоматически добавляем + если его нет
        if (!phoneDigits.startsWith('+')) {
          // Если начинается с 8, заменяем на +7
          if (phoneDigits.startsWith('8')) {
            form.value.phone = '+7' + phoneDigits.substring(1)
          } else if (phoneDigits.startsWith('7')) {
            form.value.phone = '+' + phoneDigits
          } else {
            form.value.phone = '+' + phoneDigits
          }
        }
      }
      errors.value.phone = ''
      return true
    }

    const validateUsername = () => {
      if (form.value.username.trim()) {
        if (!form.value.username.startsWith('@')) {
          form.value.username = '@' + form.value.username
        }
      }
      errors.value.username = ''
      return true
    }

    const validatePosition = () => {
      if (!form.value.position.trim()) {
        errors.value.position = 'Должность обязательна для заполнения'
        return false
      }
      errors.value.position = ''
      return true
    }

    const validateBirthday = () => {
      if (!form.value.birthday) {
        errors.value.birthday = ''
        return true // Birthday is optional
      }

      const birthday = new Date(form.value.birthday)
      const today = new Date()
      const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()) // Minimum 14 years old
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()) // Maximum 100 years old

      if (birthday > today) {
        errors.value.birthday = 'Дата рождения не может быть в будущем'
        return false
      }

      if (birthday > maxDate) {
        errors.value.birthday = 'Возраст должен быть не менее 14 лет'
        return false
      }

      if (birthday < minDate) {
        errors.value.birthday = 'Неверная дата рождения'
        return false
      }

      // Check for valid date format
      const dateString = form.value.birthday
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateString)) {
        errors.value.birthday = 'Неверный формат даты (используйте ГГГГ-ММ-ДД)'
        return false
      }

      errors.value.birthday = ''
      return true
    }

    const getMaxBirthdayDate = () => {
      const today = new Date()
      return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
    }

    const clearError = (field) => {
      errors.value[field] = ''
    }

    // API Methods
    const loadUserProfile = async () => {
      loading.value = true
      try {
        const response = await usersAPI.getMe()
        if (response.data.success) {
          const userData = response.data.data
          
          // Заполняем форму только реальными данными пользователя, без автозаполнения из Telegram
          form.value = {
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            position: userData.position || '',
            company: userData.company || '',
            department: userData.department || '',
            username: userData.username || '',
            bio: userData.bio || '', // Только реальные данные от пользователя
            // Преобразуем дату в формат YYYY-MM-DD для input[type="date"]
            birthday: userData.birthday ? (userData.birthday.includes('T') ? userData.birthday.split('T')[0] : userData.birthday) : '',
            avatar_url: userData.avatar_url || null
          }
          
          // Store original data for comparison
          originalData.value = { ...form.value }
          
          console.log('Profile loaded:', form.value)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        showAlert('Ошибка при загрузке профиля')
      } finally {
        loading.value = false
      }
    }

    // Actions
    const handleBack = () => {
      if (hasChanges.value) {
        const shouldLeave = window.confirm('Есть несохраненные изменения. Покинуть страницу?')
        if (shouldLeave) {
          router.go(-1)
        }
      } else {
        router.go(-1)
      }
    }

    const handlePhotoUpload = () => {
      // Create file input element
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = 'image/*'
      fileInput.style.display = 'none'
      
      fileInput.onchange = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          showAlert('Файл слишком большой. Максимальный размер: 5MB')
          return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          showAlert('Выберите изображение')
          return
        }

        loading.value = true
        
        try {
          // Create FormData
          const formData = new FormData()
          formData.append('avatar', file)

          // Upload avatar
          const response = await usersAPI.uploadAvatar(formData)
          
          if (response.data.success) {
            // Update form with new avatar URL
            form.value.avatar_url = response.data.data.avatar_url
            originalData.value.avatar_url = response.data.data.avatar_url
            showAlert('Фото профиля успешно обновлено!')
          } else {
            showAlert('Ошибка при загрузке фото: ' + response.data.message)
          }
        } catch (error) {
          console.error('Error uploading avatar:', error)
          if (error.response?.data?.message) {
            showAlert('Ошибка: ' + error.response.data.message)
          } else {
            showAlert('Ошибка при загрузке фото')
          }
        } finally {
          loading.value = false
        }
      }
      
      document.body.appendChild(fileInput)
      fileInput.click()
      document.body.removeChild(fileInput)
    }

    const handleSave = async () => {
      loading.value = true

      try {
        console.log('Attempting to save profile:', form.value)
        
        // УПРОЩЕННАЯ ВАЛИДАЦИЯ - только обязательные поля
        if (!form.value.first_name?.trim()) {
          showAlert('Имя обязательно для заполнения')
          return
        }

        // Подготавливаем данные для отправки
        const dataToSend = {
          first_name: form.value.first_name?.trim() || '',
          last_name: form.value.last_name?.trim() || '',
          email: form.value.email?.trim() || '',
          phone: form.value.phone?.trim() || '',
          position: form.value.position?.trim() || '',
          company: form.value.company?.trim() || '',
          department: form.value.department?.trim() || '',
          username: form.value.username?.trim() || '',
          bio: form.value.bio?.trim() || '',
          birthday: form.value.birthday || null
        }

        console.log('Sending data:', dataToSend)

        // Update profile
        const response = await usersAPI.updateMe(dataToSend)
        
        console.log('Response received:', response.data)
        
        if (response.data.success) {
          originalData.value = { ...form.value }
          showAlert('Профиль успешно обновлен!')
        } else {
          console.error('Update failed:', response.data)
          showAlert('Ошибка при обновлении профиля: ' + (response.data.message || 'Неизвестная ошибка'))
        }

      } catch (error) {
        console.error('Error updating profile:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        if (error.response?.data?.message) {
          showAlert('Ошибка: ' + error.response.data.message)
        } else if (error.response?.status === 422) {
          showAlert('Ошибка валидации данных')
        } else {
          showAlert('Ошибка при сохранении профиля')
        }
      } finally {
        loading.value = false
      }
    }

    const showBioField = () => {
      form.value.bio = '' // Инициализируем пустым значением для показа поля
    }

    // Lifecycle
    onMounted(() => {
      loadUserProfile()
    })

    return {
      loading,
      form,
      errors,
      hasChanges,
      getInitials,
      getAvatarUrl,
      handleBack,
      handlePhotoUpload,
      handleSave,
      validateFirstName,
      validateLastName,
      validateCompany,
      validateDepartment,
      validatePhone,
      validateUsername,
      validatePosition,
      validateBirthday,
      getMaxBirthdayDate,
      clearError,
      showBioField
    }
  }
}
</script>

<style scoped>
.user-profile-screen {
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  padding-top: calc(8px + env(safe-area-inset-top));
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
  height: 44px;
  min-height: 44px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.back-btn:active {
  opacity: 0.6;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.save-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.save-btn:disabled {
  color: #8E8E93;
  cursor: not-allowed;
}

.save-btn:active:not(:disabled) {
  opacity: 0.6;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px; /* Space for bottom navigation */
}

.avatar-section {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  object-fit: cover;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #007AFF;
  border: 3px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.avatar-upload:active {
  background: #0056B3;
  transform: scale(0.95);
}

.form-section {
  padding: 0 20px;
}

.field-group {
  margin-bottom: 20px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.field-container {
  display: flex;
  align-items: center;
  background: rgba(44, 44, 46, 0.8);
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid rgba(84, 84, 88, 0.6);
  transition: all 0.15s ease;
}

.field-container:focus-within {
  border-color: #007AFF;
  background: rgba(44, 44, 46, 1);
}

.field-container.error {
  border-color: #FF3B30;
}

.field-input {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  width: 100%;
}

.field-input::placeholder {
  color: #8E8E93;
}

.field-input[type="date"] {
  color-scheme: dark;
}

.field-input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.field-textarea {
  resize: none;
  min-height: 60px;
}

.error-text {
  font-size: 12px;
  color: #FF3B30;
  margin-top: 4px;
  margin-left: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.add-bio-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@media (max-width: 480px) {
  .avatar-container {
    width: 80px;
    height: 80px;
  }
  
  .avatar-placeholder,
  .avatar-image {
    width: 80px;
    height: 80px;
    border-radius: 40px;
  }
  
  .avatar-placeholder {
    font-size: 30px;
  }
  
  .avatar-upload {
    width: 28px;
    height: 28px;
    border-radius: 14px;
  }
}
</style> 