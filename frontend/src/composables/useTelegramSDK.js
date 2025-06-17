import { ref, onMounted } from 'vue'

export function useTelegramSDK() {
  const isWebAppAvailable = ref(false)
  const webApp = ref(null)
  const initData = ref('')
  const user = ref(null)
  const isReady = ref(false)

  // Инициализация Telegram WebApp
  const initWebApp = () => {
    try {
      console.log('🚀 Initializing Telegram WebApp with official SDK...')
      
      // Проверяем доступность Telegram WebApp
      if (!window.Telegram || !window.Telegram.WebApp) {
        console.error('❌ Telegram WebApp not available')
        return false
      }

      const webapp = window.Telegram.WebApp
      webApp.value = webapp
      isWebAppAvailable.value = true

      console.log('✅ Telegram WebApp available')
      console.log('📱 Version:', webapp.version)
      console.log('📱 Platform:', webapp.platform)

      // Получаем initData
      if (webapp.initData && webapp.initData.length > 0) {
        initData.value = webapp.initData
        console.log('✅ initData received:', webapp.initData.substring(0, 50) + '...')
        
        // Парсим данные пользователя
        if (webapp.initDataUnsafe && webapp.initDataUnsafe.user) {
          user.value = webapp.initDataUnsafe.user
          console.log('✅ User data parsed:', user.value)
        } else {
          // Пробуем ручной парсинг
          try {
            const params = new URLSearchParams(webapp.initData)
            const userParam = params.get('user')
            
            if (userParam) {
              user.value = JSON.parse(userParam)
              console.log('✅ User data parsed manually:', user.value)
            }
          } catch (error) {
            console.error('❌ Failed to parse user data:', error)
          }
        }
      } else {
        console.warn('⚠️ No initData available')
        return false
      }

      // Инициализируем WebApp
      if (typeof webapp.ready === 'function') {
        webapp.ready()
        console.log('📱 WebApp.ready() called')
      }

      if (typeof webapp.expand === 'function') {
        webapp.expand()
        console.log('📱 WebApp.expand() called')
      }

      isReady.value = true
      return true

    } catch (error) {
      console.error('❌ Error initializing Telegram WebApp:', error)
      return false
    }
  }

  // Проверка валидности данных
  const isValidEnvironment = () => {
    if (!isWebAppAvailable.value) {
      return {
        isValid: false,
        error: 'TELEGRAM_NOT_AVAILABLE',
        message: 'Приложение должно запускаться из Telegram клиента'
      }
    }

    if (!initData.value || initData.value.length === 0) {
      return {
        isValid: false,
        error: 'INIT_DATA_MISSING',
        message: 'Приложение не получило данные от Telegram'
      }
    }

    if (!user.value || !user.value.id) {
      return {
        isValid: false,
        error: 'USER_DATA_MISSING',
        message: 'Не удалось получить данные пользователя из Telegram'
      }
    }

    return { isValid: true }
  }

  // Получение данных пользователя
  const getUserData = () => {
    const validation = isValidEnvironment()
    if (!validation.isValid) {
      throw new Error(validation.message)
    }

    return {
      id: user.value.id,
      first_name: user.value.first_name || '',
      last_name: user.value.last_name || '',
      username: user.value.username || '',
      language_code: user.value.language_code || 'ru',
      is_premium: user.value.is_premium || false,
      photo_url: user.value.photo_url || null,
      allows_write_to_pm: user.value.allows_write_to_pm || false
    }
  }

  // Получение raw initData для отправки на сервер
  const getRawInitData = () => {
    const validation = isValidEnvironment()
    if (!validation.isValid) {
      throw new Error(validation.message)
    }

    return initData.value
  }

  // Показ уведомлений
  const showAlert = (message) => {
    try {
      console.log('📱 showAlert called with message:', message)
      
      const webapp = webApp.value
      if (webapp && typeof webapp.showAlert === 'function') {
        console.log('📱 Using Telegram showAlert')
        webapp.showAlert(message)
        return
      }
      
      console.log('📱 Telegram showAlert not available, using browser alert')
      alert(message)
    } catch (error) {
      console.warn('showAlert error:', error)
      alert(message)
    }
  }

  // Закрытие приложения
  const close = () => {
    if (webApp.value && typeof webApp.value.close === 'function') {
      webApp.value.close()
    } else {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.close()
      }
    }
  }

  // Открытие Telegram ссылки
  const openTelegramLink = (url) => {
    if (webApp.value && typeof webApp.value.openTelegramLink === 'function') {
      webApp.value.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  // Инициализация при монтировании
  onMounted(() => {
    console.log('🚀 useTelegramSDK mounted - initializing...')
    
    // Небольшая задержка для инициализации Telegram WebApp
    setTimeout(() => {
      initWebApp()
    }, 100)
  })

  return {
    // Состояние
    isWebAppAvailable,
    webApp,
    initData,
    user,
    isReady,
    
    // Методы
    initWebApp,
    isValidEnvironment,
    getUserData,
    getRawInitData,
    showAlert,
    close,
    openTelegramLink
  }
} 