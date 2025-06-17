const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');
const { validateTelegramWebApp, extractTelegramUser } = require('../middleware/telegram');
const { authRateLimit } = require('../middleware/security');
const { validateUser, sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Test endpoint для проверки доступности API
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working!',
    timestamp: new Date().toISOString(),
    url: req.originalUrl
  });
});

// Test endpoint для complete-profile без middleware
router.post('/complete-profile-test', (req, res) => {
  console.log('=== TEST COMPLETE PROFILE ===');
  console.log('Body:', req.body);
  res.json({
    success: true,
    message: 'Test complete-profile endpoint is working!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Простой complete-profile БЕЗ ВСЯКИХ ТОКЕНОВ И ВАЛИДАЦИИ
router.post('/complete-profile-simple', catchAsync(async (req, res) => {
  console.log('=== SIMPLE COMPLETE PROFILE (NO AUTH) ===');
  console.log('Body:', req.body);
  
  const { email, phone, position, department, company, avatar_url, first_name, last_name, username, bio, birthday } = req.body;
  
  try {
    // Генерируем уникальный telegram_id для тестирования
    const testTelegramId = 1000000000 + Math.floor(Math.random() * 1000000);
    
    // Создаем реального пользователя в базе данных
    const [result] = await pool.query(`
      INSERT INTO users (
        telegram_id, username, first_name, last_name, email, phone, 
        position, department, company, bio, birthday, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testTelegramId,
      username || 'testuser_' + Date.now(),
      first_name || 'Test',
      last_name || 'User', 
      email || `test_${Date.now()}@example.com`,
      phone || '+1234567890',
      position || 'Developer',
      department || 'IT',
      company || 'Test Company',
      bio || 'Test bio',
      birthday || null,
      avatar_url || null
    ]);

    // Получаем созданного пользователя
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = users[0];
    
    // Генерируем JWT токен с реальным userId
    const token = jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegram_id 
      },
      process.env.JWT_SECRET || 'test_secret_key',
      { expiresIn: '7d' }
    );
    
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
          bio: user.bio,
          birthday: user.birthday,
          avatar_url: user.avatar_url,
          is_complete: true
        },
        token: token
      },
      message: 'Profile created successfully! (No auth mode)'
    });
  } catch (error) {
    console.error('Simple profile creation error:', error);
    
    // Если пользователь уже существует, получаем его
    if (error.code === 'ER_DUP_ENTRY') {
      const [users] = await pool.query('SELECT * FROM users WHERE telegram_id = ?', [123456789]);
      if (users.length > 0) {
        const user = users[0];
        
        // Генерируем токен для существующего пользователя
        const token = jwt.sign(
          { 
            userId: user.id, 
            telegramId: user.telegram_id 
          },
          process.env.JWT_SECRET || 'test_secret_key',
          { expiresIn: '7d' }
        );
        
        return res.json({
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
              bio: user.bio,
              birthday: user.birthday,
              avatar_url: user.avatar_url,
              is_complete: true
            },
            token: token
          },
          message: 'Profile retrieved successfully! (Existing user)'
        });
      }
    }
    
    throw new AppError('Profile creation failed', 500, 'PROFILE_ERROR');
  }
}));

// Start screen - initial authentication
router.post('/start', authRateLimit, sanitizeInput, validateTelegramWebApp, extractTelegramUser, catchAsync(async (req, res) => {
  try {
    console.log('=== AUTH START ENDPOINT ===');
    console.log('Extracted user data:', req.user);
    
    const { telegram_id, username, first_name, last_name, photo_url } = req.user;

    // Проверяем, существует ли пользователь с таким telegram_id
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegram_id]
    );

    let user;
    let isNewUser = false;

    if (existingUsers.length === 0) {
      console.log('Creating new user for telegram_id:', telegram_id);
      
      // Создаем нового пользователя с данными из Telegram
      try {
        const [result] = await pool.query(
          'INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
          [telegram_id, username || null, first_name || null, last_name || null, photo_url || null]
        );
        
        console.log('User created with ID:', result.insertId);
        
        // Создаем команду для нового пользователя
        const teamName = `${first_name || username || 'User'} Team`;
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
          const [teamResult] = await pool.query(
            'INSERT INTO teams (name, owner_id, invite_code) VALUES (?, ?, ?)',
            [teamName, result.insertId, inviteCode]
          );
          
          // Обновляем пользователя с team_id
          await pool.query(
            'UPDATE users SET team_id = ? WHERE id = ?',
            [teamResult.insertId, result.insertId]
          );
          
          console.log('Created new team:', teamName, 'with invite code:', inviteCode);
        } catch (teamError) {
          console.warn('Failed to create team:', teamError.message);
        }
        
        // Получаем созданного пользователя с данными команды
        const [newUsers] = await pool.query(
          'SELECT u.*, t.name as team_name, t.invite_code as team_invite_code FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.id = ?',
          [result.insertId]
        );
        user = newUsers[0];
        isNewUser = true;
        
      } catch (dbError) {
        // Если ошибка дублирования по telegram_id, возможно пользователь уже существует
        if (dbError.code === 'ER_DUP_ENTRY') {
          console.log('Duplicate telegram_id detected, fetching existing user');
          const [existingUser] = await pool.query(
            'SELECT u.*, t.name as team_name, t.invite_code as team_invite_code FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.telegram_id = ?',
            [telegram_id]
          );
          user = existingUser[0];
          isNewUser = false;
        } else {
          throw dbError;
        }
      }
    } else {
      console.log('Found existing user for telegram_id:', telegram_id);
      
      // Получаем существующего пользователя с данными команды
      const [userWithTeam] = await pool.query(
        'SELECT u.*, t.name as team_name, t.invite_code as team_invite_code FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.telegram_id = ?',
        [telegram_id]
      );
      user = userWithTeam[0];
      
      // Обновляем username и аватарку, если они изменились в Telegram
      const updateFields = [];
      const updateValues = [];
      
      if (username && username !== user.username) {
        updateFields.push('username = ?');
        updateValues.push(username);
        user.username = username;
      }
      
      if (first_name && first_name !== user.first_name) {
        updateFields.push('first_name = ?');
        updateValues.push(first_name);
        user.first_name = first_name;
      }
      
      if (last_name && last_name !== user.last_name) {
        updateFields.push('last_name = ?');
        updateValues.push(last_name);
        user.last_name = last_name;
      }
      
      // Обновляем аватарку, если пользователь не имеет её или если она изменилась в Telegram
      if (photo_url && (!user.avatar_url || user.avatar_url !== photo_url)) {
        updateFields.push('avatar_url = ?');
        updateValues.push(photo_url);
        user.avatar_url = photo_url;
      }
      
      // Выполняем обновление, если есть изменения
      if (updateFields.length > 0) {
        updateValues.push(telegram_id);
        await pool.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE telegram_id = ?`,
          updateValues
        );
        console.log('Updated user data from Telegram');
      }
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegram_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Проверяем завершенность профиля
    const isProfileComplete = !!(user.email && user.phone && user.position && user.company);
    
    console.log('Authentication successful for user:', {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      isNewUser,
      isProfileComplete
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          company: user.company,
          email: user.email,
          phone: user.phone,
          position: user.position,
          department: user.department,
          bio: user.bio,
          birthday: user.birthday,
          avatar_url: user.avatar_url,
          team_id: user.team_id,
          team_name: user.team_name,
          team_invite_code: user.team_invite_code,
          is_complete: isProfileComplete
        },
        token,
        isNewUser,
        needsProfileCompletion: !isProfileComplete,
        redirectTo: isProfileComplete ? '/tasks' : '/profile'
      }
    });

  } catch (error) {
    console.error('Start auth error:', error);
    throw new AppError('Authentication failed', 500, 'AUTH_ERROR');
  }
}));

// Complete profile after registration - упрощенный для тестирования
router.post('/complete-profile', sanitizeInput, validateTelegramWebApp, extractTelegramUser, catchAsync(async (req, res) => {
  try {
    console.log('=== COMPLETE PROFILE REQUEST START ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    console.log('Telegram user from middleware:', req.user);
    console.log('=== COMPLETE PROFILE REQUEST DATA ===');
    
    // Получаем telegram_id из middleware
    const { telegram_id } = req.user;
    const { email, phone, position, department, company, bio, birthday, avatar_url, first_name, last_name, username } = req.body;

    // Проверяем, что пользователь с таким telegram_id уже существует
    const [existingUsers] = await pool.query(
      'SELECT id, email, phone, position, company FROM users WHERE telegram_id = ?',
      [telegram_id]
    );

    if (existingUsers.length === 0) {
      throw new AppError('User not found. Please authenticate first.', 404, 'USER_NOT_FOUND');
    }

    const existingUser = existingUsers[0];

    // Проверяем, что профиль еще не завершен
    const isProfileComplete = !!(existingUser.email && existingUser.phone && existingUser.position && existingUser.company);
    
    if (isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Профиль уже создан',
        error_code: 'PROFILE_ALREADY_EXISTS'
      });
    }

    // В режиме разработки убираем строгие проверки
    if (process.env.NODE_ENV !== 'development') {
      // Validate required fields только в production
      if (!email || !phone || !position || !company) {
        return res.status(400).json({
          success: false,
          message: 'Email, phone, position, and company are required',
          errors: {
            email: !email ? 'Email is required' : null,
            phone: !phone ? 'Phone is required' : null,
            position: !position ? 'Position is required' : null,
            company: !company ? 'Company is required' : null
          }
        });
      }
    }

    // Упрощенная валидация даты для разработки
    if (birthday && process.env.NODE_ENV !== 'development') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birthday)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid birthday format. Please use YYYY-MM-DD format',
          errors: {
            birthday: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 1990-01-15)'
          }
        });
      }

      // Validate date value
      const birthdayDate = new Date(birthday);
      const currentDate = new Date();
      const minDate = new Date('1900-01-01');
      
      if (birthdayDate >= currentDate || birthdayDate < minDate || isNaN(birthdayDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid birthday date',
          errors: {
            birthday: 'Please enter a valid birthday date (between 1900 and today)'
          }
        });
      }
    }

    // Build update query with optional fields
    const updateFields = ['email = ?', 'phone = ?', 'position = ?'];
    const updateValues = [email, phone, position];

    if (company !== undefined) {
      updateFields.push('company = ?');
      updateValues.push(company);
    }

    if (department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (birthday !== undefined) {
      updateFields.push('birthday = ?');
      // Преобразуем ISO дату в формат YYYY-MM-DD для MySQL
      let formattedBirthday = birthday;
      if (birthday && birthday.includes('T')) {
        formattedBirthday = birthday.split('T')[0];
      }
      updateValues.push(formattedBirthday);
    }

    if (avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatar_url);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(telegram_id);

    // Update user profile
    const [result] = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE telegram_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegram_id]
    );

    const user = users[0];

    // Generate new JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegram_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          company: user.company,
          email: user.email,
          phone: user.phone,
          position: user.position,
          department: user.department,
          bio: user.bio,
          birthday: user.birthday,
          avatar_url: user.avatar_url,
          is_complete: true
        },
        token,
        redirectTo: '/tasks'
      },
      message: 'Profile completed successfully'
    });

  } catch (error) {
    console.error('Complete profile error:', error);
    throw new AppError('Profile completion failed', 500, 'PROFILE_ERROR');
  }
}));

// Get current user endpoint (для тестирования)
router.get('/me', catchAsync(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new AppError('No token provided', 401, 'NO_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
    
    // Для тестового токена возвращаем тестового пользователя
    if (decoded.userId === 999) {
      res.json({
        success: true,
        data: {
          id: 999,
          telegram_id: 999999999,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          email: 'test@example.com',
          phone: '+1234567890',
          position: 'Developer',
          department: 'IT',
          is_complete: true
        }
      });
      return;
    }
    
    // Для реальных пользователей делаем запрос к БД
    throw new AppError('Real user endpoints not implemented yet', 501, 'NOT_IMPLEMENTED');
  } catch (error) {
    console.log('Get user error:', error.message);
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}));

// Validate token endpoint
router.get('/validate', sanitizeInput, catchAsync(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new AppError('No token provided', 401, 'NO_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
    
    // Для тестового токена возвращаем успех
    if (decoded.userId === 999) {
      res.json({
        success: true,
        data: {
          userId: decoded.userId,
          telegramId: decoded.telegramId
        }
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        userId: decoded.userId,
        telegramId: decoded.telegramId
      }
    });
  } catch (error) {
    console.log('Token validation error:', error.message);
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}));

// Test endpoint для проверки пользователей в БД
router.get('/test-users', catchAsync(async (req, res) => {
  try {
    // Получаем всех пользователей
    const [users] = await pool.query('SELECT id, telegram_id, first_name, last_name, email FROM users LIMIT 10');
    
    res.json({
      success: true,
      message: 'Users test successful!',
      data: {
        totalUsers: users.length,
        users: users
      }
    });
  } catch (error) {
    console.error('Users Test error:', error);
    res.status(500).json({
      success: false,
      message: 'Users test failed',
      error: error.message
    });
  }
}));

// Test endpoint для проверки таблиц в БД
router.get('/test-tables', catchAsync(async (req, res) => {
  try {
    // Получаем список таблиц
    const [tables] = await pool.query('SHOW TABLES');
    
    // Проверяем структуру таблицы tasks если она существует
    let tasksStructure = null;
    try {
      const [structure] = await pool.query('DESCRIBE tasks');
      tasksStructure = structure;
    } catch (error) {
      tasksStructure = { error: error.message };
    }
    
    res.json({
      success: true,
      message: 'Tables test successful!',
      data: {
        tables: tables,
        tasksStructure: tasksStructure
      }
    });
  } catch (error) {
    console.error('Tables Test error:', error);
    res.status(500).json({
      success: false,
      message: 'Tables test failed',
      error: error.message
    });
  }
}));

// Test endpoint для создания тестовых данных
router.post('/create-test-data', catchAsync(async (req, res) => {
  try {
    // Создаем тестовые статусы если их нет
    await pool.query(`
      INSERT IGNORE INTO task_statuses (id, name, color) VALUES 
      (1, 'To Do', '#FF6B6B'),
      (2, 'In Progress', '#4ECDC4'), 
      (3, 'Review', '#45B7D1'),
      (4, 'Done', '#96CEB4')
    `);
    
    // Создаем тестовые приоритеты если их нет
    await pool.query(`
      INSERT IGNORE INTO task_priorities (id, name, color, level) VALUES
      (1, 'Low', '#95A5A6', 1),
      (2, 'Medium', '#F39C12', 2),
      (3, 'High', '#E74C3C', 3),
      (4, 'Urgent', '#8E44AD', 4)
    `);
    
    // Создаем тестовую задачу
    const [result] = await pool.query(`
      INSERT INTO tasks (
        title, description, assigned_to, created_by, status_id, priority_id, is_personal
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Тестовая задача',
      'Описание тестовой задачи',
      12, // userId из нашего теста
      12, // userId из нашего теста  
      1,  // To Do
      2,  // Medium
      0   // не личная
    ]);
    
    res.json({
      success: true,
      message: 'Test data created successfully!',
      data: {
        taskId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create test data error:', error);
    res.status(500).json({
      success: false,
      message: 'Test data creation failed',
      error: error.message
    });
  }
}));

module.exports = router; 
