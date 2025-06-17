<template>
  <div class="profile-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="handleCancel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
        </svg>
      </button>
      <div class="title-container">
        <h1 class="title">Профиль</h1>
        <span class="subtitle">Личные данные</span>
      </div>
      <div class="menu-btn" @click="handleMenu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#007AFF"/>
          <circle cx="12" cy="12" r="2" fill="#007AFF"/>
          <circle cx="12" cy="19" r="2" fill="#007AFF"/>
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Loading indicator -->
      <div v-if="loadingProfile" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Загрузка профиля...</div>
      </div>

      <!-- Profile form -->
      <div v-else>
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-container">
            <div v-if="!form.photo" class="avatar-placeholder">
              {{ getInitials() }}
            </div>
            <img v-else :src="form.photo" alt="Profile" class="avatar-image" />
            <button class="avatar-upload" @click="handlePhotoUpload">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="form-section">
          <!-- Name Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.21 7 16 8.79 16 11C16 13.21 14.21 15 12 15C9.79 15 8 13.21 8 11C8 8.79 9.79 7 12 7ZM6 19C6 16.33 9.33 15 12 15C14.67 15 18 16.33 18 19V20H6V19Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.name"
                type="text"
                placeholder="Введите текст"
                class="field-input"
                :class="{ 'error': errors.name }"
                @blur="validateName"
              />
            </div>
            <div class="field-label">Имя</div>
            <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
          </div>

          <!-- Company Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H18V17H20V19ZM20 15H18V13H20V15ZM20 11H18V9H20V11ZM16 19H14V17H16V19ZM16 15H14V13H16V15ZM16 11H14V9H16V11Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.company"
                type="text"
                placeholder="Введите текст"
                class="field-input"
                :class="{ 'error': errors.company }"
                @blur="validateCompany"
              />
            </div>
            <div class="field-label">Компания</div>
            <div v-if="errors.company" class="error-text">{{ errors.company }}</div>
          </div>

          <!-- Phone Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="Введите текст"
                class="field-input"
                :class="{ 'error': errors.phone }"
                @blur="validatePhone"
              />
            </div>
            <div class="field-label">Номер телефона</div>
            <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
          </div>

          <!-- Username Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM6.023 15.416C7.491 17.606 9.695 19 12.16 19C14.625 19 16.829 17.606 18.297 15.416C16.755 13.249 14.615 11.954 12.16 11.954C9.705 11.954 7.565 13.249 6.023 15.416ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.username"
                type="text"
                placeholder="Введите текст"
                class="field-input"
                :class="{ 'error': errors.username }"
                @blur="validateUsername"
              />
            </div>
            <div class="field-label">Никнейм</div>
            <div v-if="errors.username" class="error-text">{{ errors.username }}</div>
          </div>

          <!-- Position Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6H16L14 4H10L8 6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.position"
                type="text"
                placeholder="Введите текст"
                class="field-input"
                :class="{ 'error': errors.position }"
                @blur="validatePosition"
              />
            </div>
            <div class="field-label">Должность</div>
            <div v-if="errors.position" class="error-text">{{ errors.position }}</div>
          </div>

          <!-- Birthday Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#8E8E93"/>
                </svg>
              </div>
              <input
                v-model="form.birthday"
                type="text"
                placeholder="День рождения (ДД.ММ.ГГГГ)"
                class="field-input"
                :class="{ 'error': errors.birthday }"
                @blur="validateBirthday"
                @input="handleBirthdayInput"
                maxlength="10"
              />
            </div>
            <div class="field-label">День рождения</div>
            <div v-if="errors.birthday" class="error-text">{{ errors.birthday }}</div>
          </div>

          <!-- About Field -->
          <div class="field-group">
            <div class="field-container">
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9Z" fill="#8E8E93"/>
                </svg>
              </div>
              <textarea
                v-model="form.about"
                placeholder="Введите текст"
                class="field-input field-textarea"
                :class="{ 'error': errors.about }"
                @blur="validateAbout"
                rows="3"
              ></textarea>
            </div>
            <div class="field-label">О себе</div>
            <div v-if="errors.about" class="error-text">{{ errors.about }}</div>
          </div>
        </div>



        <!-- Apply Button -->
        <div class="button-container" v-if="canSubmit">
          <button 
            class="apply-button"
            @click="handleApply"
            :disabled="loading"
          >
            <span v-if="!loading">Применить</span>
            <div v-else class="loading-spinner"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-navigation">
      <button class="nav-btn" @click="navigateTo('/tasks')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#8E8E93"/>
        </svg>
        <span>Задачи</span>
      </button>
      <button class="nav-btn" @click="navigateTo('/calendar')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#8E8E93"/>
        </svg>
        <span>Календарь</span>
      </button>
      <button class="nav-btn" @click="navigateTo('/employees')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.21 7 16 8.79 16 11C16 13.21 14.21 15 12 15C9.79 15 8 13.21 8 11C8 8.79 9.79 7 12 7ZM6 19C6 16.33 9.33 15 12 15C14.67 15 18 16.33 18 19V20H6V19Z" fill="#8E8E93"/>
        </svg>
        <span>Сотрудники</span>
      </button>
      <button class="nav-btn active" @click="navigateTo('/profile')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM6.023 15.416C7.491 17.606 9.695 19 12.16 19C14.625 19 16.829 17.606 18.297 15.416C16.755 13.249 14.615 11.954 12.16 11.954C9.705 11.954 7.565 13.249 6.023 15.416ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4Z" fill="#007AFF"/>
        </svg>
        <span>Профиль</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { useAuthStore } from '@/stores/auth'
import { authAPI, usersAPI } from '@/services/api'

export default {
  name: 'ProfileScreen',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const webApp = useWebApp()
    const loading = ref(false)
    const loadingProfile = ref(true)

    const form = ref({
      name: '',
      company: '',
      phone: '',
      username: '',
      position: '',
      birthday: '',
      about: '',
      photo: null
    })

    const errors = ref({
      name: '',
      company: '',
      phone: '',
      username: '',
      position: '',
      birthday: '',
      about: ''
    })

    const validateName = () => {
      if (!form.value.name.trim()) {
        errors.value.name = 'Имя обязательно для заполнения'
        return false
      }
      if (form.value.name.trim().length < 2) {
        errors.value.name = 'Имя должно содержать минимум 2 символа'
        return false
      }
      errors.value.name = ''
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

    const validatePhone = () => {
      // Телефон теперь необязателен
      if (!form.value.phone.trim()) {
        errors.value.phone = ''
        return true
      }
      
      // Remove all spaces, dashes, and parentheses for validation
      const cleanPhone = form.value.phone.replace(/[\s\-\(\)]/g, '')
      
      // Более мягкая проверка - просто проверяем что это похоже на номер телефона
      const phoneRegex = /^\+?[1-9]\d{7,14}$/
      
      if (!phoneRegex.test(cleanPhone)) {
        errors.value.phone = 'Неверный формат номера. Пример: +7912345678 или 8912345678'
        return false
      }
      
      errors.value.phone = ''
      return true
    }

    const validateUsername = () => {
      if (!form.value.username.trim()) {
        errors.value.username = 'Никнейм обязателен для заполнения'
        return false
      }
      if (form.value.username.length < 3) {
        errors.value.username = 'Никнейм должен содержать минимум 3 символа'
        return false
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
        errors.value.birthday = 'Дата рождения обязательна для заполнения'
        return false
      }
      
      // Check if the date is valid
      const birthDate = new Date(form.value.birthday)
      if (isNaN(birthDate.getTime())) {
        errors.value.birthday = 'Неверный формат даты. Используйте формат дд.мм.гггг'
        return false
      }
      
      // Check if date is not in the future
      const today = new Date()
      if (birthDate > today) {
        errors.value.birthday = 'Дата рождения не может быть в будущем'
        return false
      }
      
      // Check age constraints
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const dayDiff = today.getDate() - birthDate.getDate()
      
      // Adjust age if birthday hasn't occurred this year
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
      
      if (actualAge < 16) {
        errors.value.birthday = 'Возраст должен быть не менее 16 лет'
        return false
      }
      
      if (actualAge > 100) {
        errors.value.birthday = 'Возраст не может превышать 100 лет'
        return false
      }
      
      errors.value.birthday = ''
      return true
    }

    const validateAbout = () => {
      // About field is required according to TZ
      if (!form.value.about.trim()) {
        errors.value.about = 'Описание "О себе" обязательно для заполнения'
        return false
      }
      if (form.value.about.trim().length < 10) {
        errors.value.about = 'Описание должно содержать минимум 10 символов'
        return false
      }
      errors.value.about = ''
      return true
    }

    const canSubmit = computed(() => {
      return validateName() && 
             validateCompany() && 
             validatePhone() && 
             validateUsername() && 
             validatePosition() && 
             validateBirthday() && 
             validateAbout() &&
             !Object.values(errors.value).some(error => error !== '')
    })

    const getInitials = () => {
      if (!form.value.name.trim()) return 'F'
      const names = form.value.name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const handleCancel = () => {
      if (webApp.isAvailable) {
        webApp.close()
      } else {
        console.log('Cancel clicked - running in browser mode')
        router.push('/tasks')
      }
    }

    const handleMenu = () => {
      console.log('Menu clicked')
    }

    const handlePhotoUpload = () => {
      // Placeholder for photo upload functionality
      console.log('Photo upload clicked')
      webApp.showAlert('Функция загрузки фото будет добавлена позже')
    }

    const handleApply = async () => {
      loading.value = true
      
      try {
        // Validate all fields one more time
        const isValid = validateName() && 
                        validateCompany() && 
                        validatePhone() && 
                        validateUsername() && 
                        validatePosition() && 
                        validateBirthday() && 
                        validateAbout()

        if (!isValid) {
          webApp.showAlert('Пожалуйста, исправьте ошибки в форме')
          return
        }

        // Подготавливаем данные для API
        const profileData = {
          email: form.value.username.trim() + '@example.com', // Генерируем email из никнейма
          phone: form.value.phone.trim(),
          position: form.value.position.trim(),
          company: form.value.company.trim(), // Компания как отдельное поле
          department: null, // Отдел можно добавить отдельно при необходимости
          first_name: form.value.name.trim().split(' ')[0] || '',
          last_name: form.value.name.trim().split(' ').slice(1).join(' ') || '',
          username: form.value.username.trim(),
          bio: form.value.about.trim(),
          birthday: form.value.birthday,
          avatar_url: form.value.photo
        }
        
        console.log('Отправляем данные профиля:', profileData)
        
        // Пытаемся обновить существующий профиль
        try {
          const updateResult = await usersAPI.updateMe(profileData)
          console.log('Результат обновления профиля:', updateResult)
          
          if (updateResult.data.success) {
            webApp.showAlert('Профиль успешно обновлен!')
            return
          }
        } catch (updateError) {
          console.log('Профиль не найден, создаем новый...')
          
          // Если обновление не удалось, создаем новый профиль
          const result = await authStore.completeProfile(profileData)
          console.log('Результат создания профиля:', result)
          
          if (result.success) {
            webApp.showAlert('Профиль успешно создан!')
            
            // Сразу переходим к задачам
            router.push('/tasks')
          } else {
            webApp.showAlert(result.message || result.error || 'Ошибка при сохранении профиля')
          }
        }
      } catch (error) {
        console.error('Profile completion error:', error)
        webApp.showAlert('Произошла ошибка. Попробуйте еще раз.')
      } finally {
        loading.value = false
      }
    }

    // Загрузка данных профиля пользователя
    const loadUserProfile = async () => {
      try {
        loadingProfile.value = true
        console.log('Loading user profile...')
        
        const response = await usersAPI.getMe()
        console.log('User profile loaded:', response.data)
        
        if (response.data.success && response.data.data) {
          const user = response.data.data
          
          // Заполняем форму данными пользователя
          form.value.name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
          form.value.company = user.company || ''
          form.value.phone = user.phone || ''
          form.value.username = user.username || ''
          form.value.position = user.position || ''
          // Преобразуем дату в формат YYYY-MM-DD для input[type="date"]
          if (user.birthday) {
            if (user.birthday.includes('T')) {
              // ISO формат - берем только дату
              form.value.birthday = user.birthday.split('T')[0]
            } else {
              form.value.birthday = user.birthday
            }
          } else {
            form.value.birthday = ''
          }
          form.value.about = user.bio || ''
          // Исправляем URL аватара
          if (user.avatar_url) {
            if (user.avatar_url.startsWith('http')) {
              form.value.photo = user.avatar_url
            } else {
              // Для локальных файлов добавляем базовый URL сервера
              const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')
              form.value.photo = `${baseUrl}${user.avatar_url}`
            }
          } else {
            form.value.photo = null
          }
          
          console.log('Form filled with user data:', form.value)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        // Если ошибка 401, возможно токен истек - перенаправляем на логин
        if (error.response?.status === 401) {
          console.log('Unauthorized - redirecting to login')
          router.push('/login')
          return
        }
        
        // Если профиль не найден, заполняем данными из Telegram WebApp
        try {
          if (webApp.isAvailable && webApp.user) {
            const telegramUser = webApp.user
            console.log('Filling form with Telegram user data:', telegramUser)
            
            // Автоматически заполняем поля из Telegram
            form.value.name = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim()
            form.value.username = telegramUser.username || ''
            
            // Если есть фото профиля в Telegram, пытаемся его получить
            if (telegramUser.photo_url) {
              form.value.photo = telegramUser.photo_url
            }
          }
        } catch (telegramError) {
          console.warn('Could not load Telegram user data:', telegramError)
        }
        
        webApp.showAlert('Заполните профиль для продолжения')
      } finally {
        loadingProfile.value = false
      }
    }

    // Загружаем профиль при монтировании компонента
    onMounted(() => {
      loadUserProfile()
    })

    const navigateTo = (path) => {
      router.push(path)
    }

    // Обработчик ввода даты с маской
    const handleBirthdayInput = (event) => {
      let value = event.target.value.replace(/\D/g, '') // Убираем всё кроме цифр
      
      // Ограничиваем максимальную длину
      if (value.length > 8) {
        value = value.slice(0, 8)
      }
      
      // Автоматически добавляем точки
      if (value.length >= 2) {
        value = value.slice(0, 2) + '.' + value.slice(2)
      }
      if (value.length >= 5) {
        value = value.slice(0, 5) + '.' + value.slice(5, 9)
      }
      
      form.value.birthday = value
      
      // Автоматически валидируем при достижении полного формата
      if (value.length === 10) {
        setTimeout(() => validateBirthday(), 100)
      }
    }

    return {
      form,
      errors,
      loading,
      loadingProfile,
      canSubmit,
      getInitials,
      handleCancel,
      handleMenu,
      handlePhotoUpload,
      handleApply,
      validateName,
      validateCompany,
      validatePhone,
      validateUsername,
      validatePosition,
      validateBirthday,
      validateAbout,
      navigateTo,
      handleBirthdayInput
    }
  }
}
</script>

<style scoped>
.profile-screen {
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
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.back-btn:active {
  opacity: 0.6;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #8E8E93;
  margin: 0;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.menu-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 22px;
}

.menu-btn:active {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.1);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.avatar-section {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background: linear-gradient(135deg, #333333 0%, #666666 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  object-fit: cover;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 18px;
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

.field-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
}

.field-input::placeholder {
  color: #8E8E93;
}

.field-textarea {
  resize: none;
  min-height: 60px;
}

.field-input.error {
  color: #FF3B30;
}

.field-label {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 8px;
  margin-left: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-text {
  font-size: 12px;
  color: #FF3B30;
  margin-top: 4px;
  margin-left: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.button-container {
  padding: 20px;
  margin-top: 20px;
}

.apply-button {
  width: 100%;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  padding: 16px 24px;
  min-height: 56px;
  background: #007AFF;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.apply-button:active {
  background: #0056B3;
  transform: scale(0.97);
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.4);
}

.apply-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-text {
  color: #8E8E93;
  font-size: 16px;
  margin-top: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-height: 667px) {
  .avatar-section {
    padding: 15px;
  }
  
  .avatar-container {
    width: 100px;
    height: 100px;
  }
  
  .avatar-placeholder,
  .avatar-image {
    width: 100px;
    height: 100px;
    border-radius: 50px;
  }
  
  .avatar-placeholder {
    font-size: 40px;
  }
  
  .avatar-upload {
    width: 32px;
    height: 32px;
    border-radius: 16px;
  }
  
  .field-group {
    margin-bottom: 16px;
  }
}

/* Bottom Navigation */
.bottom-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.nav-btn {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-btn:active {
  opacity: 0.6;
}

.nav-btn.active {
  color: #007AFF;
}

.nav-btn span {
  margin-top: 4px;
}
</style> 