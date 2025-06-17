const { validate, parse } = require('@telegram-apps/init-data-node');

// Получаем BOT_TOKEN из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not found in environment variables');
}

/**
 * Валидация и парсинг initData от Telegram WebApp
 * @param {string} initDataRaw - Raw initData string from Telegram WebApp
 * @returns {Object} Parsed user data
 */
function validateAndParseInitData(initDataRaw) {
  try {
    console.log('🔍 Validating initData with official SDK...');
    console.log('📱 initData type:', typeof initDataRaw);
    console.log('📱 initData length:', initDataRaw ? initDataRaw.length : 0);
    
    if (!initDataRaw || typeof initDataRaw !== 'string') {
      console.error('❌ Invalid initData format:', typeof initDataRaw, initDataRaw ? initDataRaw.length : 0);
      throw new Error('Invalid initData: must be a non-empty string');
    }
    
    if (initDataRaw.length === 0) {
      console.error('❌ Empty initData string');
      throw new Error('Invalid initData: empty string');
    }

    // Валидируем подпись (если есть BOT_TOKEN)
    if (BOT_TOKEN) {
      try {
        validate(initDataRaw, BOT_TOKEN);
        console.log('✅ initData signature validated successfully');
      } catch (error) {
        console.warn('⚠️ initData signature validation failed:', error.message);
        // В development режиме продолжаем без валидации
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Invalid initData signature');
        }
      }
    } else {
      console.warn('⚠️ BOT_TOKEN not available, skipping signature validation');
    }

    // Парсим данные
    console.log('📊 Parsing initData...');
    const initData = parse(initDataRaw);
    console.log('✅ initData parsed successfully');
    console.log('📊 Parsed data keys:', Object.keys(initData));

    if (!initData.user) {
      console.error('❌ No user object in parsed initData');
      console.error('❌ Available keys:', Object.keys(initData));
      throw new Error('No user data found in initData');
    }
    
    if (!initData.user.id) {
      console.error('❌ No user.id in parsed initData');
      console.error('❌ User object:', initData.user);
      throw new Error('No user ID found in initData');
    }
    
    console.log('✅ User ID found:', initData.user.id);

    return {
      user: {
        id: initData.user.id,
        first_name: initData.user.first_name || '',
        last_name: initData.user.last_name || '',
        username: initData.user.username || '',
        language_code: initData.user.language_code || 'ru',
        is_premium: initData.user.is_premium || false,
        photo_url: initData.user.photo_url || null,
        allows_write_to_pm: initData.user.allows_write_to_pm || false
      },
      auth_date: initData.auth_date,
      hash: initData.hash,
      query_id: initData.query_id
    };

  } catch (error) {
    console.error('❌ Error validating/parsing initData:', error);
    throw error;
  }
}

/**
 * Fallback парсинг для случаев когда официальный SDK не работает
 * @param {string} initDataRaw - Raw initData string
 * @returns {Object} Parsed user data
 */
function fallbackParseInitData(initDataRaw) {
  try {
    console.log('🔄 Using fallback initData parsing...');
    
    const params = new URLSearchParams(initDataRaw);
    const userParam = params.get('user');
    
    if (!userParam) {
      throw new Error('No user parameter found in initData');
    }

    const user = JSON.parse(userParam);
    
    if (!user || !user.id) {
      throw new Error('Invalid user data in initData');
    }

    console.log('✅ Fallback parsing successful');

    return {
      user: {
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        language_code: user.language_code || 'ru',
        is_premium: user.is_premium || false,
        photo_url: user.photo_url || null,
        allows_write_to_pm: user.allows_write_to_pm || false
      },
      auth_date: params.get('auth_date'),
      hash: params.get('hash'),
      query_id: params.get('query_id')
    };

  } catch (error) {
    console.error('❌ Fallback parsing failed:', error);
    throw error;
  }
}

/**
 * Основная функция для обработки initData
 * @param {string} initDataRaw - Raw initData string
 * @returns {Object} Parsed and validated user data
 */
function processInitData(initDataRaw) {
  console.log('📱 Processing initData...');
  
  try {
    // Сначала пробуем официальный SDK
    return validateAndParseInitData(initDataRaw);
  } catch (error) {
    console.warn('⚠️ Official SDK failed, trying fallback:', error.message);
    
    try {
      // Если не получилось, используем fallback
      return fallbackParseInitData(initDataRaw);
    } catch (fallbackError) {
      console.error('❌ Both official and fallback parsing failed');
      throw new Error(`Failed to process initData: ${fallbackError.message}`);
    }
  }
}

/**
 * Создание профиля пользователя на основе Telegram данных
 * @param {Object} telegramData - Parsed Telegram data
 * @returns {Object} User profile object
 */
function createUserProfile(telegramData) {
  const user = telegramData.user;
  
  return {
    telegram_id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.photo_url,
    language_code: user.language_code,
    is_premium: user.is_premium,
    allows_write_to_pm: user.allows_write_to_pm,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Поля для заполнения пользователем
    email: null,
    phone: null,
    position: null,
    company: null,
    bio: null,
    birthday: null,
    is_active: true,
    is_admin: false
  };
}

module.exports = {
  validateAndParseInitData,
  fallbackParseInitData,
  processInitData,
  createUserProfile
}; 