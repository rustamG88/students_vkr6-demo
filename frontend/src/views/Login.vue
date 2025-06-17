<template>
  <div class="login-screen">
    <!-- Start Screen -->
    <div v-if="currentStep === 'start'" class="start-screen">
      <div class="sticker-container">
        <div class="mailbox-sticker">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#007AFF"/>
          </svg>
        </div>
      </div>
      <div class="start-content">
        <h1 class="app-title">Добро пожаловать!</h1>
        <p class="app-description">Управление задачами и сотрудниками в Telegram</p>
        <button class="start-btn" @click="handleStart">
          Старт
        </button>
      </div>
    </div>

    <!-- Error Screen -->
    <div v-if="currentStep === 'error'" class="error-screen">
      <div class="error-content">
        <div class="error-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#FF3B30"/>
          </svg>
        </div>
        <h1 class="error-title">Ошибка запуска</h1>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-instructions">
          <p><strong>Что делать:</strong></p>
          <ul>
            <li>Убедитесь, что приложение запущено из Telegram клиента</li>
            <li>Проверьте подключение к интернету</li>
            <li>Попробуйте перезапустить приложение</li>
          </ul>
        </div>
        <button class="retry-btn" @click="location.reload()">
          Попробовать снова
        </button>
      </div>
    </div>

    <!-- Profile Form Screen -->
    <div v-if="currentStep === 'profile'" class="profile-screen">
      <div class="header">
        <button class="back-btn" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
          </svg>
        </button>
        <h1 class="title">Заполнение профиля</h1>
        <button 
          class="apply-btn" 
          @click="handleApply"
          :disabled="!canApply || loading"
        >
          {{ loading ? '...' : 'Применить' }}
        </button>
      </div>

      <div class="form-content">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-container">
            <div v-if="!form.avatar" class="avatar-placeholder">
              {{ getInitials() }}
            </div>
            <img v-else :src="form.avatar" alt="Profile" class="avatar-image" />
            <button class="avatar-upload" @click="handlePhotoUpload">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="form-section">
          <!-- Name Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.name }">
              <input
                v-model="form.name"
                type="text"
                placeholder="Имя *"
                class="field-input"
                @blur="validateName"
                @input="clearError('name')"
                @keyup="debounceValidate('name')"
              />
            </div>
            <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
          </div>

          <!-- Company Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.company }">
              <input
                v-model="form.company"
                type="text"
                placeholder="Компания *"
                class="field-input"
                @blur="validateCompany"
                @input="clearError('company')"
                @keyup="debounceValidate('company')"
              />
            </div>
            <div v-if="errors.company" class="error-text">{{ errors.company }}</div>
          </div>

          <!-- Email Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.email }">
              <input
                v-model="form.email"
                type="email"
                placeholder="Email (необязательно)"
                class="field-input"
                @blur="validateEmail"
                @input="clearError('email')"
                @keyup="debounceValidate('email')"
              />
            </div>
            <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
          </div>

          <!-- Phone Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.phone }">
              <input
                v-model="form.phone"
                type="tel"
                placeholder="Номер телефона *"
                class="field-input"
                @blur="validatePhone"
                @input="handlePhoneInput"
                @keyup="debounceValidate('phone')"
                maxlength="18"
              />
            </div>
            <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
          </div>

          <!-- Nickname Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.nickname }">
              <input
                v-model="form.nickname"
                type="text"
                placeholder="Никнейм *"
                class="field-input"
                @blur="validateNickname"
                @input="clearError('nickname')"
                @keyup="debounceValidate('nickname')"
              />
            </div>
            <div v-if="errors.nickname" class="error-text">{{ errors.nickname }}</div>
          </div>

          <!-- Position Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.position }">
              <input
                v-model="form.position"
                type="text"
                placeholder="Должность *"
                class="field-input"
                @blur="validatePosition"
                @input="clearError('position')"
                @keyup="debounceValidate('position')"
              />
            </div>
            <div v-if="errors.position" class="error-text">{{ errors.position }}</div>
          </div>

          <!-- Birthday Field -->
          <div class="field-group">
            <div class="field-container" :class="{ 'error': errors.birthday }">
              <input
                v-model="form.birthday"
                type="text"
                placeholder="День рождения (ДД.ММ.ГГГГ) *"
                class="field-input"
                @blur="validateBirthday"
                @input="handleBirthdayInput"
                maxlength="10"
              />
            </div>
            <div v-if="errors.birthday" class="error-text">{{ errors.birthday }}</div>
          </div>

          <!-- About Field -->
          <div class="field-group">
            <div class="field-container">
              <textarea
                v-model="form.about"
                placeholder="О себе"
                class="field-input field-textarea"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI, usersAPI } from '@/services/api'
import { useWebApp } from '@/composables/useWebApp'
import { useTelegramSDK } from '@/composables/useTelegramSDK'
import logger from '@/utils/logger'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const { showAlert, getInitData, getUserData, isValidTelegramEnvironment } = useWebApp()
    const { 
      isReady: sdkReady, 
      getRawInitData, 
      getUserData: getSDKUserData, 
      isValidEnvironment: isValidSDKEnvironment,
      showAlert: sdkShowAlert
    } = useTelegramSDK()
    
    const currentStep = ref('start') // 'start', 'profile', or 'error'
    const loading = ref(false)
    const errorMessage = ref('')
    const telegramUserData = ref(null)
    const useOfficialSDK = ref(true) // Флаг для использования официального SDK
    const forceNewSDK = ref(true) // ПРИНУДИТЕЛЬНО используем новый SDK

    const form = ref({
      name: '',
      email: '',
      company: '',
      phone: '',
      nickname: '',
      position: '',
      birthday: '',
      about: '',
      avatar: null,
      avatarPath: null
    })

    const errors = ref({
      name: '',
      email: '',
      company: '',
      phone: '',
      nickname: '',
      position: '',
      birthday: ''
    })

    // Инициализация при загрузке - получаем данные Telegram пользователя
    onMounted(async () => {
      console.log('🚀 Login.vue mounted - checking Telegram user data...')
      
      try {
        // ПРИНУДИТЕЛЬНО используем новый SDK endpoint
        if (forceNewSDK.value) {
          console.log('🚀 FORCE USING NEW SDK ENDPOINT - NO FALLBACK!')
          
          // Проверяем базовую доступность Telegram WebApp
          if (!window.Telegram || !window.Telegram.WebApp) {
            throw new Error('Telegram WebApp not available')
          }
          
          const webapp = window.Telegram.WebApp
          
          // Проверяем наличие initData
          if (!webapp.initData || webapp.initData.length === 0) {
            throw new Error('No initData available from Telegram WebApp')
          }
          
          console.log('✅ Telegram WebApp and initData available')
          console.log('📱 initData length:', webapp.initData.length)
          
          // Парсим пользователя для отображения
          let userData = null
          try {
            if (webapp.initDataUnsafe && webapp.initDataUnsafe.user) {
              userData = webapp.initDataUnsafe.user
            } else {
              // Ручной парсинг
              const params = new URLSearchParams(webapp.initData)
              const userParam = params.get('user')
              if (userParam) {
                userData = JSON.parse(userParam)
              }
            }
            
            if (userData && userData.id) {
              telegramUserData.value = userData
              console.log('✅ User data extracted:', userData)
            } else {
              throw new Error('Could not extract user data from initData')
            }
          } catch (parseError) {
            console.error('❌ Failed to parse user data:', parseError)
            throw new Error('Failed to parse user data from Telegram')
          }
          
          // Отправляем на новый endpoint
          await authenticateWithNewSDK(webapp.initData)
          return
        }
        
        // Старый код (НЕ ДОЛЖЕН ВЫПОЛНЯТЬСЯ)
        console.log('🔄 This should not execute - falling back to legacy method...')
        
        // КРИТИЧЕСКАЯ ПРОВЕРКА: Валидность Telegram окружения
        const validation = isValidTelegramEnvironment()
        if (!validation.isValid) {
          console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', validation.error)
          
          // Показываем ошибку пользователю и блокируем приложение
          showAlert(`Ошибка запуска: ${validation.message}`)
          
          // Устанавливаем состояние ошибки
          currentStep.value = 'error'
          errorMessage.value = validation.message
          return
        }
        
        // Получаем данные пользователя из Telegram WebApp
        const tgUser = getUserData()
        console.log('📱 Telegram user data:', tgUser)
        
        if (tgUser && tgUser.id) {
          telegramUserData.value = tgUser
          
          // Проверяем, есть ли уже пользователь с таким telegram_id в базе
          try {
            console.log('🔍 Checking if user exists with telegram_id:', tgUser.id)
            
            const authData = {
              telegram_data: getInitData(), // Теперь это реальный initData
              telegram_user: tgUser,        // Добавляем telegram_user
              user_data: tgUser             // Оставляем для совместимости
            }
            
            console.log('📤 Sending login request with data:', authData)
            
            const response = await authAPI.login(authData)
            
            console.log('📦 Login response:', response.data)
            
            if (response.data && response.data.success && response.data.user) {
              console.log('✅ Existing user found - auto login successful:', response.data.user)
              
              // Пользователь уже существует - автоматически логиним
              localStorage.setItem('token', response.data.token)
              localStorage.setItem('user', JSON.stringify(response.data.user))
              
              showAlert(`Добро пожаловать назад, ${response.data.user.name}!`)
              
              // Переходим в приложение
              router.push('/tasks')
              return
            }
          } catch (error) {
            console.log('ℹ️ User not found or login failed:', error.message)
            console.log('ℹ️ Login error details:', error.response?.data || 'No error data')
            
            // Если пользователь не найден (404), продолжаем регистрацию
            if (error.response?.status === 404) {
              console.log('✅ User not found - proceeding with registration')
            } else {
              console.warn('⚠️ Unexpected login error:', error.response?.status, error.message)
            }
            // В любом случае продолжаем регистрацию
          }
          
          // Пользователь новый - подставляем данные из Telegram
          console.log('📝 New user - auto-filling form with Telegram data')
          autoFillFromTelegram(tgUser)
        } else {
          console.error('❌ Не удалось получить данные пользователя')
          showAlert('Ошибка получения данных пользователя из Telegram')
          currentStep.value = 'error'
          errorMessage.value = 'Не удалось получить данные пользователя из Telegram'
        }
        
      } catch (error) {
        console.error('❌ Critical error during initialization:', error)
        showAlert(`Критическая ошибка: ${error.message}`)
        currentStep.value = 'error'
        errorMessage.value = error.message
      }
    })

    // НОВАЯ аутентификация с принудительным использованием нового endpoint
    const authenticateWithNewSDK = async (initData) => {
      try {
        console.log('🚀 AUTHENTICATING WITH NEW SDK ENDPOINT')
        console.log('📱 initData length:', initData.length)
        console.log('📱 initData preview:', initData.substring(0, 100) + '...')
        
        const authData = { initData }
        console.log('📤 Sending request to /api/auth-json/auth-sdk...')
        
        const response = await fetch('/api/auth-json/auth-sdk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authData)
        })
        
        console.log('📦 Response status:', response.status)
        console.log('📦 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ HTTP Error:', response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const result = await response.json()
        console.log('📦 Auth-SDK response:', result)
        
        if (result.success && result.user) {
          console.log('✅ NEW SDK AUTHENTICATION SUCCESSFUL!')
          console.log('👤 User data:', result.user)
          console.log('🔑 Token received:', result.token ? 'Yes' : 'No')
          console.log('🆕 Is new user:', result.isNewUser)
          console.log('📝 Needs profile completion:', result.needsProfileCompletion)
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', result.token)
          localStorage.setItem('user', JSON.stringify(result.user))
          
          if (result.isNewUser) {
            showAlert(`Добро пожаловать, ${result.user.name}!`)
            
            // Для новых пользователей ВСЕГДА показываем форму профиля
            console.log('📝 New user - showing profile completion form...')
            autoFillFromTelegram(telegramUserData.value)
            currentStep.value = 'profile'
          } else {
            // Для существующих пользователей проверяем заполненность профиля
            const isProfileComplete = !!(
              result.user.email && 
              result.user.phone && 
              result.user.position && 
              result.user.company
            )
            
            console.log('🔍 Profile completeness check:', {
              email: !!result.user.email,
              phone: !!result.user.phone,
              position: !!result.user.position,
              company: !!result.user.company,
              isComplete: isProfileComplete
            })
            
            if (isProfileComplete) {
              showAlert(`Добро пожаловать назад, ${result.user.name}!`)
              console.log('✅ Existing user with complete profile - redirecting to tasks...')
              router.push('/tasks')
            } else {
              showAlert(`Добро пожаловать назад! Пожалуйста, завершите заполнение профиля.`)
              console.log('📝 Existing user with incomplete profile - showing form...')
              
              // Заполняем форму существующими данными
              autoFillFromTelegram(telegramUserData.value)
              if (result.user.email) form.value.email = result.user.email
              if (result.user.phone) form.value.phone = result.user.phone
              if (result.user.position) form.value.position = result.user.position
              if (result.user.company) form.value.company = result.user.company
              if (result.user.bio) form.value.about = result.user.bio
              if (result.user.birthday) form.value.birthday = result.user.birthday
              
              currentStep.value = 'profile'
            }
          }
        } else {
          console.error('❌ Authentication failed - invalid response:', result)
          throw new Error(result.message || result.error || 'Authentication failed - no user data')
        }
        
      } catch (error) {
        console.error('❌ NEW SDK AUTHENTICATION FAILED:', error)
        console.error('❌ Error stack:', error.stack)
        
        // Показываем детальную ошибку пользователю
        showAlert(`Ошибка аутентификации: ${error.message}`)
        currentStep.value = 'error'
        errorMessage.value = `Ошибка аутентификации: ${error.message}`
        
        throw error
      }
    }

    // Старая функция (для совместимости, но не используется)
    const authenticateWithOfficialSDK = async () => {
      console.warn('⚠️ authenticateWithOfficialSDK called - this should not happen!')
      return authenticateWithNewSDK(getRawInitData())
    }

    // Автоматическое заполнение формы данными из Telegram
    const autoFillFromTelegram = (tgUser) => {
      // Подставляем имя
      if (tgUser.first_name || tgUser.last_name) {
        const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
        form.value.name = fullName
        console.log('✓ Auto-filled name:', fullName)
      }
      
      // Подставляем никнейм
      if (tgUser.username) {
        form.value.nickname = '@' + tgUser.username
        console.log('✓ Auto-filled nickname:', '@' + tgUser.username)
      }
      
      // Подставляем аватар
      if (tgUser.photo_url) {
        form.value.avatar = tgUser.photo_url
        console.log('✓ Auto-filled avatar:', tgUser.photo_url)
      }
      
      // Очищаем ошибки для автозаполненных полей
      if (form.value.name) errors.value.name = ''
      if (form.value.nickname) errors.value.nickname = ''
    }

    // Проверка доступности кнопки "Применить" - ВСЕ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ
    const canApply = computed(() => {
      // Проверяем все обязательные поля
      const requiredFields = [
        form.value.name.trim(),
        form.value.company.trim(), 
        form.value.phone.trim(),
        form.value.nickname.trim(),
        form.value.position.trim(),
        form.value.birthday
      ]
      
      // Все обязательные поля должны быть заполнены
      const allFieldsFilled = requiredFields.every(field => field && field.length > 0)
      
      // Проверяем отсутствие ошибок валидации
      const noErrors = !Object.values(errors.value).some(error => error && error.length > 0)
      
      return allFieldsFilled && noErrors
    })

    // Начать заполнение профиля
    const handleStart = () => {
      console.log('📝 Starting profile creation')
      currentStep.value = 'profile'
    }

    // Вернуться назад
    const goBack = () => {
      currentStep.value = 'start'
    }

    // Получить инициалы для аватара-заглушки
    const getInitials = () => {
      if (!form.value.name.trim()) return '👤'
      
      const words = form.value.name.trim().split(' ')
      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase()
      }
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
    }

    // Обработка загрузки фото
    const handlePhotoUpload = () => {
      showAlert('Загрузка фото будет доступна в следующей версии')
    }

    // Применить изменения - регистрация нового пользователя
    const handleApply = async () => {
      console.log('💾 Starting user registration...')
      
      if (!canApply.value) {
        showAlert('Пожалуйста, заполните все обязательные поля')
        return
      }

      loading.value = true

      try {
        // КРИТИЧЕСКАЯ ПРОВЕРКА перед регистрацией
        const validation = isValidTelegramEnvironment()
        if (!validation.isValid) {
          showAlert(`Ошибка: ${validation.message}`)
          return
        }
        
        // Подготавливаем данные для регистрации
        const registrationData = {
          // Данные из Telegram - ОБЯЗАТЕЛЬНЫЕ
          telegram_data: getInitData(),        // Реальный initData строкой
          telegram_user: telegramUserData.value, // Объект пользователя
          
          // Данные из формы
          name: form.value.name.trim(),
          company: form.value.company.trim(),
          phone: form.value.phone.replace(/\D/g, ''), // Убираем форматирование
          nickname: form.value.nickname.trim(),
          position: form.value.position.trim(),
          birthday: convertDateToISO(form.value.birthday),
          about: form.value.about.trim(),
          avatar_url: form.value.avatar
        }
        
        // Проверяем что telegram_user.id присутствует
        if (!telegramUserData.value?.id) {
          throw new Error('Отсутствует telegram_user.id - невозможно создать профиль')
        }
        
        console.log('🔍 Registering user with telegram_id:', telegramUserData.value.id)
        
        console.log('📤 Sending registration data:', registrationData)
        
        // ОБНОВЛЯЕМ ПРОФИЛЬ ЧЕРЕЗ USERS API
        console.log('🚀 Updating user profile via /api/users-json/profile/me')
        
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Нет токена авторизации')
        }
        
        const profileData = {
          name: registrationData.name,
          email: registrationData.email || null,
          phone: registrationData.phone,
          position: registrationData.position,
          company: registrationData.company,
          bio: registrationData.about,
          birthday: registrationData.birthday,
          avatar_url: registrationData.avatar_url
        }
        
        const response = await fetch('/api/users-json/profile/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const responseData = await response.json()
        
        // Создаем объект response в формате axios для совместимости
        const axiosLikeResponse = {
          data: responseData,
          status: response.status
        }
        
        console.log('📦 Регистрация - полный ответ сервера:', axiosLikeResponse)
        console.log('📦 Регистрация - данные ответа:', axiosLikeResponse.data)
        console.log('📦 Регистрация - статус ответа:', axiosLikeResponse.status)
        
        // Проверяем response.data.success
        if (axiosLikeResponse.data && axiosLikeResponse.data.success) {
          console.log('✅ Registration successful:', axiosLikeResponse.data.user)
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', axiosLikeResponse.data.token)
          localStorage.setItem('user', JSON.stringify(axiosLikeResponse.data.user))
          
          showAlert('Профиль успешно создан!')
          
          // Переходим в приложение
          router.push('/tasks')
        } else {
          console.error('❌ Регистрация неуспешна:', axiosLikeResponse.data)
          throw new Error(axiosLikeResponse.data?.message || axiosLikeResponse.data?.error || 'Ошибка при создании профиля')
        }
        
                    } catch (error) {
        console.error('❌ Registration failed:', error)
        console.error('❌ Error response:', error.response?.data || 'No response data')
        console.error('❌ Error status:', error.response?.status || 'No status')
        
        let errorMessage = 'Ошибка при создании профиля'
        
        // Детальная обработка ошибок
        if (error.response) {
          // HTTP ошибка с ответом от сервера
          const status = error.response.status
          const data = error.response.data
          
          console.log('❌ HTTP Error Status:', status)
          console.log('❌ HTTP Error Data:', data)
          
          if (status === 404) {
            errorMessage = 'Сервер недоступен. Проверьте подключение к интернету.'
          } else if (status === 409) {
            errorMessage = 'Пользователь уже существует. Попробуйте войти.'
          } else if (status === 400) {
            errorMessage = data?.message || 'Неверные данные для регистрации'
          } else if (status === 500) {
            errorMessage = data?.message || data?.error || 'Внутренняя ошибка сервера'
          } else if (data?.message) {
            errorMessage = data.message
          } else if (data?.error) {
            errorMessage = data.error
          }
        } else if (error.request) {
          // Запрос был отправлен, но ответа не получено
          console.log('❌ No response received:', error.request)
          errorMessage = 'Нет ответа от сервера. Проверьте подключение к интернету.'
        } else {
          // Ошибка при настройке запроса
          console.log('❌ Request setup error:', error.message)
          errorMessage = error.message || 'Неизвестная ошибка'
        }
        
        console.log('❌ Final error message:', errorMessage)
        showAlert(`Ошибка регистрации: ${errorMessage}`)
        } finally {
          loading.value = false
        }
    }

    // Validation methods
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

    const validateEmail = () => {
      const email = form.value.email.trim()
      
      // Email не обязателен, но если заполнен - должен быть валидным
      if (!email) {
        errors.value.email = ''
        return true
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.value.email = 'Введите корректный email адрес'
        return false
      }
      
      errors.value.email = ''
      return true
    }

    const validatePhone = () => {
      const phone = form.value.phone.trim()
      if (!phone) {
        errors.value.phone = 'Номер телефона обязателен для заполнения'
        return false
      }
      
      // Строгая валидация российских номеров
      // Удаляем все символы кроме цифр и +
      const cleanPhone = phone.replace(/[^\d+]/g, '')
      
      // Проверяем только российские номера в формате +7 или 8
      const phoneRegexPlus7 = /^\+7[0-9]{10}$/  // +7 и 10 цифр
      const phoneRegex8 = /^8[0-9]{10}$/        // 8 и 10 цифр
      
      if (!phoneRegexPlus7.test(cleanPhone) && !phoneRegex8.test(cleanPhone)) {
        errors.value.phone = 'Введите российский номер: +7XXXXXXXXXX или 8XXXXXXXXXX'
        return false
      }
      
      // Определяем код оператора в зависимости от формата
      let operatorCode
      if (cleanPhone.startsWith('+7')) {
        operatorCode = cleanPhone.substring(2, 5)  // После +7
      } else if (cleanPhone.startsWith('8')) {
        operatorCode = cleanPhone.substring(1, 4)  // После 8
      }
      
      // Проверяем валидные коды российских операторов
      const validCodes = [
        // Мобильные операторы
        '900', '901', '902', '903', '904', '905', '906', '908', '909',
        '910', '911', '912', '913', '914', '915', '916', '917', '918', '919',
        '920', '921', '922', '923', '924', '925', '926', '927', '928', '929',
        '930', '931', '932', '933', '934', '936', '937', '938', '939',
        '950', '951', '952', '953', '954', '955', '956', '958',
        '960', '961', '962', '963', '964', '965', '966', '967', '968', '969',
        '970', '971', '977', '978',
        '980', '981', '982', '983', '984', '985', '986', '987', '988', '989',
        '991', '992', '993', '994', '995', '996', '997', '999'
      ]
      
      if (!validCodes.includes(operatorCode)) {
        errors.value.phone = 'Неверный код мобильного оператора: ' + operatorCode
        return false
      }
      
      errors.value.phone = ''
      return true
    }

    const validateNickname = () => {
      if (!form.value.nickname.trim()) {
        errors.value.nickname = 'Никнейм обязателен для заполнения'
        return false
      }
      errors.value.nickname = ''
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

    // Обработчик ввода номера телефона с форматированием
    const handlePhoneInput = (event) => {
      let value = event.target.value.replace(/[^\d+]/g, '') // Убираем всё кроме цифр и +
      
      // Если пользователь начинает с 8, автоматически заменяем на +7
      if (value.startsWith('8')) {
        value = '+7' + value.substring(1)
      }
      
      // Если пользователь начинает с 7, добавляем +
      if (value.startsWith('7') && !value.startsWith('+7')) {
        value = '+' + value
      }
      
      // Если начинается с +7, форматируем
      if (value.startsWith('+7') && value.length > 2) {
        let digits = value.substring(2)
        if (digits.length > 10) {
          digits = digits.slice(0, 10)
        }
        
        // Форматируем как +7 XXX XXX-XX-XX
        let formatted = '+7'
        if (digits.length > 0) {
          formatted += ' ' + digits.substring(0, 3)
        }
        if (digits.length > 3) {
          formatted += ' ' + digits.substring(3, 6)
        }
        if (digits.length > 6) {
          formatted += '-' + digits.substring(6, 8)
        }
        if (digits.length > 8) {
          formatted += '-' + digits.substring(8, 10)
        }
        
        value = formatted
      }
      
      form.value.phone = value
      clearError('phone')
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
      clearError('birthday')
      debounceValidate('birthday')
      
      // Автоматически валидируем при достижении полного формата
      if (value.length === 10) {
        setTimeout(() => validateBirthday(), 100)
      }
    }

    const validateBirthday = () => {
      if (!form.value.birthday) {
        errors.value.birthday = 'Дата рождения обязательна для заполнения'
        return false
      }
      
      // Проверяем формат ДД.ММ.ГГГГ
      const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/
      const matches = form.value.birthday.match(dateRegex)
      
      if (!matches) {
        errors.value.birthday = 'Используйте формат ДД.ММ.ГГГГ'
        return false
      }
      
      const day = parseInt(matches[1])
      const month = parseInt(matches[2])
      const year = parseInt(matches[3])
      
      // Создаем дату в формате YYYY-MM-DD для корректной валидации
      const birthDate = new Date(year, month - 1, day)
      
      // Проверяем корректность даты
      if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1 || birthDate.getFullYear() !== year) {
        errors.value.birthday = 'Некорректная дата'
        return false
      }
      
      const today = new Date()
      
      // Проверяем, что дата не в будущем
      if (birthDate > today) {
        errors.value.birthday = 'Дата рождения не может быть в будущем'
        return false
      }
      
      // Проверяем возраст
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
      
      if (adjustedAge < 16) {
        errors.value.birthday = 'Возраст должен быть не менее 16 лет'
        return false
      }
      
      if (adjustedAge > 100) {
        errors.value.birthday = 'Возраст должен быть не более 100 лет'
        return false
      }
      
      errors.value.birthday = ''
      return true
    }

    const clearError = (field) => {
      errors.value[field] = ''
    }

    // Преобразование даты из формата ДД.ММ.ГГГГ в YYYY-MM-DD
    const convertDateToISO = (dateStr) => {
      if (!dateStr) return null
      
      const matches = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
      if (!matches) return null
      
      const day = matches[1]
      const month = matches[2]
      const year = matches[3]
      
      return `${year}-${month}-${day}`
    }

    // Дебаунс для валидации в реальном времени
    let validationTimeouts = {}
    const debounceValidate = (field) => {
      if (validationTimeouts[field]) {
        clearTimeout(validationTimeouts[field])
      }
      
      validationTimeouts[field] = setTimeout(() => {
        switch (field) {
          case 'name':
            validateName()
            break
          case 'company':
            validateCompany()
            break
          case 'phone':
            validatePhone()
            break
          case 'nickname':
            validateNickname()
            break
          case 'position':
            validatePosition()
            break
          case 'birthday':
            validateBirthday()
            break
        }
      }, 500) // Валидация через 500мс после остановки ввода
    }

    return {
      currentStep,
      loading,
      errorMessage,
      form,
      errors,
      canApply,
      getInitials,
      handleStart,
      goBack,
      handlePhotoUpload,
      handleApply,
      validateName,
      validateEmail,
      validateCompany,
      validatePhone,
      validateNickname,
      validatePosition,
      validateBirthday,
      handlePhoneInput,
      clearError,
      debounceValidate,
      convertDateToISO
    }
  }
}
</script>

<style scoped>
.login-screen {
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Start Screen */
.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.sticker-container {
  margin-bottom: 40px;
}

.mailbox-sticker {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 60px;
  border: 2px solid rgba(0, 122, 255, 0.2);
}

.mailbox-sticker svg {
  filter: drop-shadow(0 2px 8px rgba(0, 122, 255, 0.3));
}

.start-content {
  max-width: 300px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-description {
  font-size: 16px;
  color: #8E8E93;
  margin: 0 0 40px 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.start-btn {
  background: #007AFF;
  border: none;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  padding: 16px 48px;
  border-radius: 12px;
  transition: all 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.start-btn:active {
  background: #0056B3;
  transform: scale(0.98);
}

/* Error Screen */
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.error-content {
  max-width: 350px;
}

.error-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: #FF3B30;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-message {
  font-size: 16px;
  color: #ffffff;
  margin: 0 0 24px 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-instructions {
  background: rgba(44, 44, 46, 0.8);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 32px;
  text-align: left;
}

.error-instructions p {
  font-size: 14px;
  color: #ffffff;
  margin: 0 0 8px 0;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-instructions ul {
  margin: 0;
  padding-left: 16px;
  color: #8E8E93;
}

.error-instructions li {
  font-size: 14px;
  margin-bottom: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.retry-btn {
  background: #007AFF;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 12px 32px;
  border-radius: 10px;
  transition: all 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.retry-btn:active {
  background: #0056B3;
  transform: scale(0.98);
}

/* Profile Screen */
.profile-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.apply-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.apply-btn:disabled {
  color: #8E8E93;
  cursor: not-allowed;
}

.apply-btn:active:not(:disabled) {
  opacity: 0.6;
}

.form-content {
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