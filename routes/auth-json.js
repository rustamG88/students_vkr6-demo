const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/json-db');
const { authRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { processInitData, createUserProfile } = require('../utils/telegram-sdk');
const router = express.Router();

// Функция для получения данных пользователя из Telegram WebApp
const parseTelegramInitData = (initData) => {
  try {
    if (!initData) {
      throw new Error('No init data provided');
    }

    // Парсим данные из Telegram WebApp
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    
    if (!userParam) {
      // Если нет user параметра, создаем тестового пользователя
      return {
        id: Math.floor(Math.random() * 1000000) + 1000000,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser_' + Date.now(),
        photo_url: null
      };
    }

    const user = JSON.parse(userParam);
    console.log('Parsed Telegram user:', user);
    
    return {
      id: user.id,
      first_name: user.first_name || 'User',
      last_name: user.last_name || '',
      username: user.username || null,
      photo_url: user.photo_url || null
    };
  } catch (error) {
    console.error('Error parsing Telegram init data:', error);
    
    // Возвращаем тестового пользователя в случае ошибки
    return {
      id: Math.floor(Math.random() * 1000000) + 1000000,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser_' + Date.now(),
      photo_url: null
    };
  }
};

// Тестовый endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'JSON Auth API is working!',
    timestamp: new Date().toISOString(),
    database: 'JSON-based',
    sdk: 'Official @telegram-apps/init-data-node',
    availableEndpoints: [
      'GET /test',
      'POST /login', 
      'POST /register',
      'POST /auth-sdk',
      'POST /start',
      'POST /complete-profile',
      'GET /validate'
    ]
  });
});

// НОВЫЙ ENDPOINT с официальным SDK
router.post('/auth-sdk', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== AUTH SDK ENDPOINT ===');
  console.log('🚀 Request received at:', new Date().toISOString());
  console.log('📱 Request body keys:', Object.keys(req.body));
  console.log('📱 Request headers:', req.headers);
  console.log('📱 Request method:', req.method);
  console.log('📱 Request URL:', req.url);
  
  try {
    const { initData } = req.body;
    
    console.log('🔍 Checking initData...');
    console.log('📱 initData present:', !!initData);
    console.log('📱 initData type:', typeof initData);
    console.log('📱 initData length:', initData ? initData.length : 0);
    
    if (!initData) {
      console.error('❌ No initData provided in request');
      return res.status(400).json({
        success: false,
        message: 'initData is required',
        error: 'INIT_DATA_MISSING',
        debug: {
          receivedKeys: Object.keys(req.body),
          bodyType: typeof req.body
        }
      });
    }
    
    if (typeof initData !== 'string' || initData.length === 0) {
      console.error('❌ Invalid initData format:', typeof initData, initData.length);
      return res.status(400).json({
        success: false,
        message: 'initData must be a non-empty string',
        error: 'INVALID_INIT_DATA_FORMAT',
        debug: {
          initDataType: typeof initData,
          initDataLength: initData ? initData.length : 0
        }
      });
    }
    
    console.log('🔧 Processing initData with official SDK...');
    console.log('📱 initData preview:', initData.substring(0, 100) + '...');
    
    // Обрабатываем initData с помощью официального SDK
    const telegramData = processInitData(initData);
    console.log('✅ Telegram data processed successfully');
    console.log('👤 User data:', telegramData.user);
    console.log('🔑 Auth date:', telegramData.auth_date);
    console.log('🔒 Hash present:', !!telegramData.hash);
    
    const telegramId = telegramData.user.id;
    console.log('🆔 Extracted telegram_id:', telegramId);
    
    // Проверяем, существует ли пользователь
    console.log('🔍 Checking for existing user with telegram_id:', telegramId);
    const existingUsers = await db.select('users', { telegram_id: telegramId });
    console.log('📊 Found existing users:', existingUsers.length);
    
    let user;
    let isNewUser = false;
    
    if (existingUsers.length === 0) {
      // Создаем нового пользователя
      console.log('🆕 Creating new user with official SDK data');
      isNewUser = true;
      
      console.log('📝 Creating user profile...');
      const userProfile = createUserProfile(telegramData);
      console.log('👤 User profile created:', userProfile);
      
      console.log('💾 Inserting user into database...');
      user = await db.insert('users', userProfile);
      console.log('✅ User inserted with ID:', user.id);
      
      // Создаем команду для пользователя
      const teamName = `${user.first_name || user.username || 'User'} Team`;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      console.log('🏢 Creating team:', teamName);
      const team = await db.insert('teams', {
        name: teamName,
        owner_id: user.id,
        invite_code: inviteCode
      });
      console.log('✅ Team created with ID:', team.id);
      
      // Обновляем пользователя с team_id
      console.log('🔄 Updating user with team_id...');
      await db.update('users', { id: user.id }, { team_id: team.id });
      user.team_id = team.id;
      
      console.log('✅ New user created successfully with team:', teamName);
    } else {
      // Обновляем существующего пользователя
      user = existingUsers[0];
      
      const updates = {};
      if (user.username !== telegramData.user.username) updates.username = telegramData.user.username;
      if (user.first_name !== telegramData.user.first_name) updates.first_name = telegramData.user.first_name;
      if (user.last_name !== telegramData.user.last_name) updates.last_name = telegramData.user.last_name;
      if (user.avatar_url !== telegramData.user.photo_url) updates.avatar_url = telegramData.user.photo_url;
      
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await db.update('users', { id: user.id }, updates);
        console.log('✅ User updated with Telegram data:', updates);
        
        // Получаем обновленные данные
        const updatedUsers = await db.select('users', { id: user.id });
        user = updatedUsers[0];
      }
      
      console.log('✅ Existing user authenticated');
    }
    
    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegram_id,
        teamId: user.team_id
      },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '30d' }
    );
    
    // Формируем ответ
    const userData = {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`.trim(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      department: user.department,
      company: user.company,
      bio: user.bio,
      birthday: user.birthday,
      avatar_url: user.avatar_url,
      team_id: user.team_id,
      is_admin: user.is_admin,
      is_complete: !!(user.email && user.phone && user.position && user.company)
    };
    
    res.json({
      success: true,
      user: userData,
      token,
      isNewUser,
      needsProfileCompletion: !userData.is_complete,
      message: isNewUser ? 'User created successfully' : 'User authenticated successfully',
      sdk: 'official'
    });
    
  } catch (error) {
    console.error('❌ AUTH SDK ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
      errorType: error.name,
      sdk: 'official',
      timestamp: new Date().toISOString(),
      debug: {
        requestBody: req.body,
        initDataPresent: !!req.body.initData,
        initDataLength: req.body.initData ? req.body.initData.length : 0
      }
    });
  }
}));

// Список всех доступных эндпоинтов
router.get('/endpoints', (req, res) => {
  res.json({
    success: true,
    endpoints: {
      'GET /api/auth-json/test': 'Test API connection',
      'GET /api/auth-json/endpoints': 'List all endpoints',
      'POST /api/auth-json/login': 'Login existing user (legacy)',
      'POST /api/auth-json/register': 'Register new user or update profile (legacy)',
      'POST /api/auth-json/auth-sdk': 'Authenticate with official Telegram SDK (recommended)',
      'POST /api/auth-json/start': 'Start Telegram authentication',
      'POST /api/auth-json/complete-profile': 'Complete user profile',
      'GET /api/auth-json/validate': 'Validate JWT token'
    },
    recommended: 'POST /api/auth-json/auth-sdk',
    sdk: 'Official @telegram-apps/init-data-node'
  });
});

// LOGIN endpoint (проверка существующего пользователя)
router.post('/login', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== JSON LOGIN ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
  
  const { telegram_data, user_data, telegram_user } = req.body;
  
  // Пробуем разные варианты получения telegram_id
  let telegramId = user_data?.id || telegram_user?.id;
  
  // Если нет ID, пробуем парсить из telegram_data
  if (!telegramId && telegram_data) {
    // Специальная обработка для browser-mode (тестирование)
    if (telegram_data === 'browser-mode') {
      console.log('🌐 Browser mode detected - using fallback telegram_id');
      telegramId = telegram_user?.id || 1750014092997; // Fallback ID для тестирования
    } else {
      try {
        const parsed = parseTelegramInitData(telegram_data);
        telegramId = parsed.id;
      } catch (error) {
        console.error('Error parsing telegram_data:', error);
      }
    }
  }
  
  console.log('Extracted telegram_id:', telegramId);
  
  if (!telegramId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid telegram user data - no telegram_id found',
      debug: {
        user_data,
        telegram_user,
        telegram_data: telegram_data ? 'present' : 'missing'
      }
    });
  }
  
  // Проверяем, существует ли пользователь с таким telegram_id
  const existingUsers = await db.select('users', { telegram_id: telegramId });
  
  if (existingUsers.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      needsRegistration: true
    });
  }
  
  const user = existingUsers[0];
  
  // Обновляем данные из Telegram если они изменились
  const telegramUserData = user_data || telegram_user || {};
  const updates = {};
  
  if (telegramUserData.username && user.username !== telegramUserData.username) {
    updates.username = telegramUserData.username;
  }
  if (telegramUserData.first_name && user.first_name !== telegramUserData.first_name) {
    updates.first_name = telegramUserData.first_name;
  }
  if (telegramUserData.last_name && user.last_name !== telegramUserData.last_name) {
    updates.last_name = telegramUserData.last_name;
  }
  if (telegramUserData.photo_url && user.avatar_url !== telegramUserData.photo_url) {
    updates.avatar_url = telegramUserData.photo_url;
  }
  
  if (Object.keys(updates).length > 0) {
    await db.update('users', { id: user.id }, updates);
    console.log('Updated user data from Telegram:', updates);
  }
  
  // Генерируем JWT токен
  const token = jwt.sign(
    { 
      userId: user.id, 
      telegramId: user.telegram_id,
      teamId: user.team_id
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '30d' }
  );
  
  // Формируем ответ
  const userData = {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    name: `${user.first_name} ${user.last_name}`.trim(),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    position: user.position,
    department: user.department,
    company: user.company,
    avatar_url: user.avatar_url,
    team_id: user.team_id,
    is_admin: user.is_admin
  };
  
  res.json({
    success: true,
    user: userData,
    token,
    message: 'User authenticated successfully'
  });
  
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе в систему',
      error: error.message,
      debug: {
        telegram_data: req.body.telegram_data ? 'present' : 'missing',
        telegram_user: req.body.telegram_user ? 'present' : 'missing',
        user_data: req.body.user_data ? 'present' : 'missing'
      }
    });
  }
}));

// REGISTER endpoint (создание нового пользователя)
router.post('/register', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== JSON REGISTER ===');
  console.log('Request body:', req.body);
  
  try {
  
  const { 
    telegram_data, 
    telegram_user,
    name,
    company, 
    phone, 
    nickname,
    position,
    birthday,
    about,
    avatar_url
  } = req.body;
  
  let telegramId = telegram_user?.id;
  
  // Специальная обработка для browser-mode (тестирование)
  if (!telegramId && telegram_data === 'browser-mode') {
    console.log('🌐 Browser mode detected in register - using fallback telegram_id');
    telegramId = telegram_user?.id || 1750014092997; // Fallback ID для тестирования
  }
  
  if (!telegramId) {
    return res.status(400).json({
      success: false,
      message: 'Invalid telegram user data',
      debug: {
        telegram_data,
        telegram_user,
        browser_mode: telegram_data === 'browser-mode'
      }
    });
  }
  
  // Проверяем, что пользователь еще не существует
  const existingUsers = await db.select('users', { telegram_id: telegramId });
  
  if (existingUsers.length > 0) {
    // Если пользователь уже существует, обновляем его профиль
    const user = existingUsers[0];
    
    // Разбиваем имя на части
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || telegram_user.first_name || user.first_name;
    const lastName = nameParts.slice(1).join(' ') || telegram_user.last_name || user.last_name;
    
    // Обновляем профиль пользователя
    const updates = {
      username: telegram_user.username || nickname?.replace('@', '') || user.username,
      first_name: firstName,
      last_name: lastName,
      phone: phone || user.phone,
      position: position || user.position,
      company: company || user.company,
      bio: about || user.bio,
      birthday: birthday || user.birthday,
      avatar_url: avatar_url || telegram_user.photo_url || user.avatar_url
    };
    
    await db.update('users', { id: user.id }, updates);
    
    // Получаем обновленные данные
    const updatedUsers = await db.select('users', { id: user.id });
    const updatedUser = updatedUsers[0];
    
    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: updatedUser.id, 
        telegramId: updatedUser.telegram_id,
        teamId: updatedUser.team_id
      },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '30d' }
    );
    
    // Формируем ответ
    const userData = {
      id: updatedUser.id,
      telegram_id: updatedUser.telegram_id,
      username: updatedUser.username,
      name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      position: updatedUser.position,
      department: updatedUser.department,
      company: updatedUser.company,
      bio: updatedUser.bio,
      birthday: updatedUser.birthday,
      avatar_url: updatedUser.avatar_url,
      team_id: updatedUser.team_id,
      is_admin: updatedUser.is_admin
    };
    
    console.log('Updated existing user profile:', userData);
    
    return res.json({
      success: true,
      user: userData,
      token,
      message: 'User profile updated successfully'
    });
  }
  
  // Разбиваем имя на части
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || telegram_user.first_name || 'User';
  const lastName = nameParts.slice(1).join(' ') || telegram_user.last_name || '';
  
  // Создаем нового пользователя
  const user = await db.insert('users', {
    telegram_id: telegramId,
    username: telegram_user.username || nickname?.replace('@', ''),
    first_name: firstName,
    last_name: lastName,
    email: null, // Заполнится позже если нужно
    phone: phone,
    position: position,
    department: null,
    company: company,
    bio: about || '',
    birthday: birthday,
    avatar_url: avatar_url || telegram_user.photo_url,
    is_active: true,
    is_admin: false
  });
  
  // Создаем команду для пользователя
  const teamName = `${company || firstName + ' Team'}`;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const team = await db.insert('teams', {
    name: teamName,
    owner_id: user.id,
    invite_code: inviteCode
  });
  
  // Обновляем пользователя с team_id
  await db.update('users', { id: user.id }, { team_id: team.id });
  user.team_id = team.id;
  
  // Генерируем JWT токен
  const token = jwt.sign(
    { 
      userId: user.id, 
      telegramId: user.telegram_id,
      teamId: user.team_id
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '30d' }
  );
  
  // Формируем ответ
  const userData = {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    name: `${user.first_name} ${user.last_name}`.trim(),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    position: user.position,
    department: user.department,
    company: user.company,
    bio: user.bio,
    birthday: user.birthday,
    avatar_url: user.avatar_url,
    team_id: user.team_id,
    is_admin: user.is_admin
  };
  
  console.log('Created new user:', userData);
  
  res.json({
    success: true,
    user: userData,
    token,
    team: {
      id: team.id,
      name: teamName,
      invite_code: inviteCode
    },
    message: 'User registered successfully'
  });
  
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании профиля',
      error: error.message,
      debug: {
        telegram_data: req.body.telegram_data ? 'present' : 'missing',
        telegram_user: req.body.telegram_user ? 'present' : 'missing',
        name: req.body.name ? 'present' : 'missing'
      }
    });
  }
}));

// Главный endpoint аутентификации
router.post('/start', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== JSON AUTH START ===');
  console.log('Request body:', req.body);
  
  const { initData } = req.body;
  
  // Получаем данные пользователя из Telegram
  const telegramUser = parseTelegramInitData(initData);
  console.log('Telegram user data:', telegramUser);
  
  const telegramId = telegramUser.id;
  
  // Проверяем, существует ли пользователь с таким telegram_id
  const existingUsers = await db.select('users', { telegram_id: telegramId });
  
  let user;
  let isNewUser = false;
  let needsProfileCompletion = false;

  if (existingUsers.length === 0) {
    console.log('Creating new user for telegram_id:', telegramId);
    isNewUser = true;
    needsProfileCompletion = true;
    
    // Создаем нового пользователя с данными из Telegram
    user = await db.insert('users', {
      telegram_id: telegramId,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      avatar_url: telegramUser.photo_url,
      is_active: true,
      is_admin: false,
      // Профиль не завершен - нужно заполнить дополнительные данные
      email: null,
      phone: null,
      position: null,
      department: null,
      company: null,
      team_id: null
    });
    
    console.log('Created new user:', user);
  } else {
    console.log('Found existing user for telegram_id:', telegramId);
    user = existingUsers[0];
    
    // Обновляем данные из Telegram если они изменились
    const updates = {};
    if (user.username !== telegramUser.username) updates.username = telegramUser.username;
    if (user.first_name !== telegramUser.first_name) updates.first_name = telegramUser.first_name;
    if (user.last_name !== telegramUser.last_name) updates.last_name = telegramUser.last_name;
    if (user.avatar_url !== telegramUser.photo_url) updates.avatar_url = telegramUser.photo_url;
    
    if (Object.keys(updates).length > 0) {
      await db.update('users', { id: user.id }, updates);
      console.log('Updated user data from Telegram:', updates);
      
      // Получаем обновленные данные
      const updatedUsers = await db.select('users', { id: user.id });
      user = updatedUsers[0];
    }
    
    // Проверяем, нужно ли завершить профиль
    needsProfileCompletion = !user.email || !user.phone || !user.position || !user.company;
  }
  
  // Создаем команду для нового пользователя если у него ее нет
  if (!user.team_id) {
    console.log('Creating team for user');
    
    const teamName = `${user.first_name || user.username || 'User'} Team`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const team = await db.insert('teams', {
      name: teamName,
      owner_id: user.id,
      invite_code: inviteCode
    });
    
    // Обновляем пользователя с team_id
    await db.update('users', { id: user.id }, { team_id: team.id });
    user.team_id = team.id;
    
    console.log('Created team:', teamName, 'with invite code:', inviteCode);
  }
  
  // Генерируем JWT токен
  const token = jwt.sign(
    { 
      userId: user.id, 
      telegramId: user.telegram_id,
      teamId: user.team_id
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '30d' }
  );
  
  // Формируем ответ
  const userData = {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    position: user.position,
    department: user.department,
    company: user.company,
    avatar_url: user.avatar_url,
    team_id: user.team_id,
    is_admin: user.is_admin,
    is_complete: !needsProfileCompletion
  };
  
  console.log('Auth response:', {
    user: userData,
    isNewUser,
    needsProfileCompletion
  });
  
  res.json({
    success: true,
    data: {
      user: userData,
      token,
      needsProfileCompletion,
      isNewUser
    },
    message: isNewUser ? 'New user created successfully' : 'User authenticated successfully'
  });
}));

// Завершение профиля
router.post('/complete-profile', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== COMPLETE PROFILE ===');
  console.log('Body:', req.body);
  
  const { 
    email, 
    phone, 
    position, 
    department, 
    company, 
    bio,
    birthday,
    telegram_id // Для поиска пользователя
  } = req.body;
  
  // Находим пользователя по telegram_id или создаем нового если не найден
  let users = [];
  if (telegram_id) {
    users = await db.select('users', { telegram_id: parseInt(telegram_id) });
  }
  
  let user;
  if (users.length === 0) {
    // Создаем нового пользователя если не найден
    const testTelegramId = telegram_id || (1000000000 + Math.floor(Math.random() * 1000000));
    
    user = await db.insert('users', {
      telegram_id: testTelegramId,
      username: `user_${Date.now()}`,
      first_name: 'User',
      last_name: 'Name',
      email: email,
      phone: phone,
      position: position,
      department: department,
      company: company,
      bio: bio,
      birthday: birthday,
      is_active: true,
      is_admin: false
    });
    
    // Создаем команду для пользователя
    if (!user.team_id) {
      const teamName = `${user.first_name} Team`;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const team = await db.insert('teams', {
        name: teamName,
        owner_id: user.id,
        invite_code: inviteCode
      });
      
      await db.update('users', { id: user.id }, { team_id: team.id });
      user.team_id = team.id;
    }
  } else {
    // Обновляем существующего пользователя
    user = users[0];
    
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (position) updateData.position = position;
    if (department) updateData.department = department;
    if (company) updateData.company = company;
    if (bio) updateData.bio = bio;
    if (birthday) updateData.birthday = birthday;
    
    await db.update('users', { id: user.id }, updateData);
    
    // Получаем обновленные данные
    const updatedUsers = await db.select('users', { id: user.id });
    user = updatedUsers[0];
  }
  
  // Генерируем токен
  const token = jwt.sign(
    { 
      userId: user.id, 
      telegramId: user.telegram_id,
      teamId: user.team_id
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '30d' }
  );
  
  const userData = {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    position: user.position,
    department: user.department,
    company: user.company,
    bio: user.bio,
    birthday: user.birthday,
    avatar_url: user.avatar_url,
    team_id: user.team_id,
    is_admin: user.is_admin,
    is_complete: true
  };
  
  res.json({
    success: true,
    data: {
      user: userData,
      token
    },
    message: 'Profile completed successfully'
  });
}));

// Простое завершение профиля (для браузерного режима)
router.post('/complete-profile-simple', authRateLimit, sanitizeInput, catchAsync(async (req, res) => {
  console.log('=== COMPLETE PROFILE SIMPLE ===');
  console.log('Body:', req.body);
  
  const { 
    first_name,
    last_name,
    email, 
    phone, 
    position, 
    department, 
    company, 
    username,
    bio,
    birthday,
    avatar_url,
    initData
  } = req.body;
  
  // Генерируем уникальный telegram_id для браузерного режима
  const testTelegramId = Date.now() + Math.floor(Math.random() * 1000);
  
  // Создаем нового пользователя
  const user = await db.insert('users', {
    telegram_id: testTelegramId,
    username: username || `user_${testTelegramId}`,
    first_name: first_name || 'User',
    last_name: last_name || 'Name',
    email: email,
    phone: phone,
    position: position,
    department: department,
    company: company,
    bio: bio || '',
    birthday: birthday,
    avatar_url: avatar_url,
    is_active: true,
    is_admin: false
  });
  
  // Создаем команду для пользователя
  const teamName = `${user.first_name} ${user.last_name} Team`;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const team = await db.insert('teams', {
    name: teamName,
    owner_id: user.id,
    invite_code: inviteCode
  });
  
  await db.update('users', { id: user.id }, { team_id: team.id });
  user.team_id = team.id;
  
  // Генерируем токен
  const token = jwt.sign(
    { 
      userId: user.id, 
      telegramId: user.telegram_id,
      teamId: user.team_id
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '30d' }
  );
  
  const userData = {
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    position: user.position,
    department: user.department,
    company: user.company,
    bio: user.bio,
    birthday: user.birthday,
    avatar_url: user.avatar_url,
    team_id: user.team_id,
    is_admin: user.is_admin,
    is_complete: true
  };
  
  res.json({
    success: true,
    data: {
      user: userData,
      token
    },
    message: 'Profile completed successfully (simple mode)'
  });
}));

// Валидация токена
router.get('/validate', catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
    
    // Проверяем, существует ли пользователь
    const users = await db.select('users', { id: decoded.userId });
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          position: user.position,
          department: user.department,
          company: user.company,
          avatar_url: user.avatar_url,
          team_id: user.team_id,
          is_admin: user.is_admin
        }
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
}));

module.exports = router; 