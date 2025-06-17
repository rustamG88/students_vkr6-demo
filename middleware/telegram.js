const crypto = require('crypto');

// Validate Telegram WebApp init data
const validateTelegramWebApp = (req, res, next) => {
  // Проверяем, есть ли реальные данные от Telegram
  const { initData } = req.body;
  
  console.log('=== TELEGRAM VALIDATION START ===');
  console.log('Received initData:', initData);
  console.log('Request body:', req.body);
  
  if (initData && initData !== 'undefined' && initData !== 'no-telegram' && initData.trim() !== '') {
    // Есть реальные данные от Telegram - обрабатываем их
    try {
      console.log('Processing real Telegram initData...');
      
      // Parse init data
      const urlParams = new URLSearchParams(initData);
      const userParam = urlParams.get('user');
      
      console.log('User param from initData:', userParam);
      
      if (userParam) {
        const telegramUser = JSON.parse(userParam);
        console.log('Parsed Telegram user:', telegramUser);
        
        req.telegramUser = telegramUser;
        return next();
      }
    } catch (error) {
      console.error('Error parsing Telegram data:', error);
    }
  }
  
  // Проверяем, есть ли пользователь в теле запроса (для запросов из самого приложения)
  if (req.body.user && req.body.user.id) {
    console.log('Using user data from request body');
    req.telegramUser = req.body.user;
    return next();
  }
  
  // ТОЛЬКО для разработки - создаем тестового пользователя
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Development mode: creating test user (should not happen in production!)');
    
    const testUserId = Date.now();
    req.telegramUser = {
      id: testUserId,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser_' + testUserId,
      language_code: 'ru',
      photo_url: null
    };
    return next();
  }
  
  // В продакшене отклоняем запросы без данных Telegram
  console.error('❌ No valid Telegram data found');
  return res.status(400).json({
    success: false,
    message: 'Invalid Telegram data'
  });
};

// Extract user info from Telegram data
const extractTelegramUser = (req, res, next) => {
  console.log('=== EXTRACTING TELEGRAM USER ===');
  console.log('req.telegramUser:', req.telegramUser);
  
  if (req.telegramUser && req.telegramUser.id) {
    req.user = {
      telegram_id: req.telegramUser.id,
      username: req.telegramUser.username || null, // Может быть null если пользователь не установил username
      first_name: req.telegramUser.first_name || null,
      last_name: req.telegramUser.last_name || null,
      language_code: req.telegramUser.language_code || 'ru',
      photo_url: req.telegramUser.photo_url || null, // Реальная аватарка из Telegram
      is_premium: req.telegramUser.is_premium || false,
      allows_write_to_pm: req.telegramUser.allows_write_to_pm || false
    };
    
    console.log('✅ Extracted user data:', req.user);
  } else {
    console.error('❌ No telegram user data found');
    return res.status(400).json({
      success: false,
      message: 'No valid user data'
    });
  }
  
  next();
};

module.exports = {
  validateTelegramWebApp,
  extractTelegramUser
}; 