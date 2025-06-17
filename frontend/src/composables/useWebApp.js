import { ref, onMounted } from 'vue'

export function useWebApp() {
  const isWebAppAvailable = ref(false)
  const webApp = ref(null)

  // Check if we're running in Telegram WebApp
  const checkWebApp = () => {
    try {
      console.log('🔍 Checking Telegram WebApp availability...')
      
      // Проверяем multiple sources для Telegram WebApp
      const telegramSources = [
        window.Telegram?.WebApp,
        window.TelegramWebviewProxy,
        window.TelegramWebView,
        window.external?.TelegramWebApp
      ].filter(Boolean)
      
      if (telegramSources.length > 0) {
        const webapp = telegramSources[0]
        isWebAppAvailable.value = true
        webApp.value = webapp
        
        console.log('✅ Telegram WebApp SDK found!')
        console.log('WebApp object:', webapp)
        
        // Вызываем ready() и expand() если доступны
        if (typeof webapp.ready === 'function') {
          webapp.ready()
          console.log('📱 WebApp.ready() called')
        }
        
        if (typeof webapp.expand === 'function') {
          webapp.expand()
          console.log('📱 WebApp.expand() called')
        }
        
        // Детальная отладка
        console.log('🔍 TELEGRAM WEBAPP DEBUG INFO:')
        console.log('- Version:', webapp.version || 'unknown')
        console.log('- Platform:', webapp.platform || 'unknown')
        console.log('- ViewportHeight:', webapp.viewportHeight || 'unknown')
        console.log('- IsExpanded:', webapp.isExpanded || false)
        console.log('- Raw initData:', webapp.initData || 'empty')
        console.log('- Parsed initDataUnsafe:', webapp.initDataUnsafe || 'empty')
        
        // Детальная отладка пользователя
        if (webapp.initDataUnsafe && webapp.initDataUnsafe.user) {
          const user = webapp.initDataUnsafe.user
          console.log('👤 REAL USER DATA FROM TELEGRAM:')
          console.log('- ID:', user.id)
          console.log('- Username:', user.username || 'not provided')
          console.log('- First name:', user.first_name || 'not provided')
          console.log('- Last name:', user.last_name || 'not provided')
          console.log('- Photo URL:', user.photo_url || 'not provided')
          console.log('- Language:', user.language_code || 'not provided')
          console.log('- Is premium:', user.is_premium || false)
        } else {
          console.warn('⚠️ NO USER DATA IN initDataUnsafe')
          console.log('initDataUnsafe structure:', webapp.initDataUnsafe)
        }
        
        return true
      } else {
        console.warn('⚠️ No Telegram WebApp sources found')
        console.log('Available window objects:', Object.keys(window).filter(k => k.toLowerCase().includes('telegram')))
      }
    } catch (error) {
      console.error('❌ Error checking Telegram WebApp:', error)
    }
    return false
  }

  // Safe showAlert function - ИСПРАВЛЕНО для Telegram WebApp 6.0
  const showAlert = (message) => {
    try {
      console.log('📱 showAlert called with message:', message)
      
      const webapp = window.Telegram?.WebApp
      if (webapp && typeof webapp.showAlert === 'function') {
        console.log('📱 Using Telegram showAlert (v6.0+)')
        webapp.showAlert(message)
        return
      }
      
      // Fallback для старых версий или если showAlert недоступен
      console.log('📱 Telegram showAlert not available, using browser alert')
      alert(message)
    } catch (error) {
      console.warn('showAlert error:', error)
      alert(message) // Последний fallback
    }
  }

  // Safe close function
  const close = () => {
    if (isWebAppAvailable.value && webApp.value?.close) {
      webApp.value.close()
    } else {
      // In browser, just go back or close tab
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.close()
      }
    }
  }

  // Safe openTelegramLink function
  const openTelegramLink = (url) => {
    if (isWebAppAvailable.value && webApp.value?.openTelegramLink) {
      webApp.value.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  // Get init data safely - ТОЛЬКО ДЛЯ ВАЛИДНОГО ОКРУЖЕНИЯ
  const getInitData = () => {
    console.log('📤 getInitData() called...')
    
    // ОБЯЗАТЕЛЬНАЯ проверка валидности окружения
    const validation = isValidTelegramEnvironment()
    if (!validation.isValid) {
      console.error('❌ Невалидное Telegram окружение для getInitData:', validation.error)
      throw new Error(validation.message)
    }
    
    const webapp = window.Telegram.WebApp
    console.log('✅ Real initData found:', webapp.initData)
    return webapp.initData
  }

  // Проверка валидности Telegram данных - КРИТИЧЕСКАЯ ФУНКЦИЯ
  const isValidTelegramEnvironment = () => {
    // Проверяем наличие Telegram WebApp
    if (!window.Telegram || !window.Telegram.WebApp) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Telegram WebApp недоступен!')
      console.error('❌ window.Telegram:', !!window.Telegram)
      console.error('❌ window.Telegram.WebApp:', !!window.Telegram?.WebApp)
      return {
        isValid: false,
        error: 'TELEGRAM_NOT_AVAILABLE',
        message: 'Приложение должно запускаться из Telegram клиента. Откройте его через Telegram.'
      }
    }
    
    const webapp = window.Telegram.WebApp
    console.log('📱 WebApp version:', webapp.version)
    console.log('📱 WebApp platform:', webapp.platform)
    
    // Проверяем наличие initData
    if (!webapp.initData || webapp.initData.length === 0) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: initData отсутствует!')
      console.error('❌ initData present:', !!webapp.initData)
      console.error('❌ initData length:', webapp.initData ? webapp.initData.length : 0)
      
      // Показываем пользователю инструкцию
      const errorMsg = 'Приложение не получило данные авторизации от Telegram. Попробуйте:\n\n1. Закрыть и заново открыть приложение\n2. Перезапустить Telegram\n3. Обновить Telegram до последней версии'
      
      // Пытаемся закрыть приложение
      if (typeof webapp.close === 'function') {
        setTimeout(() => {
          webapp.close()
        }, 3000)
      }
      
      return {
        isValid: false,
        error: 'INIT_DATA_MISSING',
        message: errorMsg
      }
    }
    
    console.log('✅ initData present, length:', webapp.initData.length)
    
    // Проверяем наличие пользователя - с улучшенной диагностикой
    let userFound = false
    
    // Проверяем initDataUnsafe
    if (webapp.initDataUnsafe && webapp.initDataUnsafe.user && webapp.initDataUnsafe.user.id) {
      console.log('✅ User found in initDataUnsafe:', webapp.initDataUnsafe.user.id)
      userFound = true
    } else {
      console.warn('⚠️ No user in initDataUnsafe, trying manual parsing...')
      
      // Пробуем ручной парсинг как последний шанс
      try {
        const params = new URLSearchParams(webapp.initData)
        const userParam = params.get('user')
        
        if (userParam) {
          const user = JSON.parse(userParam)
          if (user && user.id) {
            console.log('✅ User found via manual parsing:', user.id)
            userFound = true
          } else {
            console.error('❌ Parsed user has no ID:', user)
          }
        } else {
          console.error('❌ No user parameter in initData')
          console.error('❌ Available parameters:', Array.from(params.keys()))
        }
      } catch (error) {
        console.error('❌ Manual parsing failed:', error)
      }
    }
    
    if (!userFound) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Данные пользователя отсутствуют!')
      
      const errorMsg = 'Не удалось получить ваши данные из Telegram. Это может произойти если:\n\n1. Приложение запущено не из Telegram\n2. Устаревшая версия Telegram\n3. Проблемы с интернет-соединением\n\nПопробуйте перезапустить Telegram и открыть приложение заново.'
      
      // Пытаемся закрыть приложение через 5 секунд
      if (typeof webapp.close === 'function') {
        setTimeout(() => {
          webapp.close()
        }, 5000)
      }
      
      return {
        isValid: false,
        error: 'USER_DATA_MISSING',
        message: errorMsg
      }
    }
    
    console.log('✅ Telegram окружение полностью валидно')
    return { isValid: true }
  }

  // Get user data safely from Telegram WebApp - ТОЛЬКО ДЛЯ ВАЛИДНОГО ОКРУЖЕНИЯ
  const getUserData = () => {
    console.log('🔍 getUserData() called - checking for Telegram user data...')
    
    // ОБЯЗАТЕЛЬНАЯ проверка валидности окружения
    const validation = isValidTelegramEnvironment()
    if (!validation.isValid) {
      console.error('❌ Невалидное Telegram окружение:', validation.error)
      throw new Error(validation.message)
    }
    
    const webapp = window.Telegram.WebApp
    
    // Если мы дошли сюда, значит все проверки пройдены
    let user = webapp.initDataUnsafe.user
    
    // Если initDataUnsafe не работает, пробуем ручной парсинг
    if (!user || !user.id) {
      try {
        const params = new URLSearchParams(webapp.initData)
        const userParam = params.get('user')
        
        if (userParam) {
          user = JSON.parse(userParam)
          console.log('✅ Пользователь получен через ручной парсинг:', user)
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга initData:', error)
        throw new Error('Не удалось получить данные пользователя')
      }
    }
    
    if (!user || !user.id) {
      throw new Error('Данные пользователя недоступны')
    }
    
    console.log('🎉 РЕАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ TELEGRAM!')
    console.log('Raw user object:', user)
    
    const userData = {
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      language_code: user.language_code || 'ru',
      is_premium: user.is_premium || false,
      photo_url: user.photo_url || null,
      allows_write_to_pm: user.allows_write_to_pm || false
    }
    
    console.log('✅ Обработанные данные пользователя:', userData)
    return userData
  }

  onMounted(() => {
    console.log('🚀 useWebApp mounted - initializing...')
    
    // Задержка для инициализации Telegram WebApp
    setTimeout(() => {
      checkWebApp()
    }, 100)
  })

  return {
    isWebAppAvailable,
    webApp,
    showAlert,
    close,
    openTelegramLink,
    getInitData,
    getUserData,
    checkWebApp,
    isValidTelegramEnvironment
  }
} 