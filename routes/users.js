const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { apiRateLimit, strictRateLimit } = require('../middleware/security');
const { validateUser, validateId, validateSearchQuery, sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { uploadAvatar, handleUploadError, deleteOldAvatar } = require('../middleware/upload');
const { notifyNewEmployee, getAdminTelegramIds } = require('./notifications');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Можно загружать только изображения'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Get all users with filters and pagination
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, validateSearchQuery, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { search, page = 1, limit = 20, department, position, is_active } = req.query;

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Build WHERE conditions with team isolation
  let whereConditions = ['u.is_active = 1', 'u.team_id = ?'];
  let queryParams = [teamId];

  if (search) {
    whereConditions.push(`(
      u.first_name LIKE ? OR 
      u.last_name LIKE ? OR 
      u.email LIKE ? OR 
      u.username LIKE ? OR 
      u.position LIKE ? OR
      u.company LIKE ?
    )`);
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (department) {
    whereConditions.push('u.department = ?');
    queryParams.push(department);
  }

  if (position) {
    whereConditions.push('u.position LIKE ?');
    queryParams.push(`%${position}%`);
  }

  if (is_active !== undefined) {
    whereConditions.push('u.is_active = ?');
    queryParams.push(is_active === 'true');
  }

  const whereClause = whereConditions.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get total count for pagination
  const [countResult] = await pool.query(`
    SELECT COUNT(*) as total
    FROM users u
    WHERE ${whereClause}
  `, queryParams);

  const total = countResult[0].total;

  // Get users with pagination
  const query = `
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.is_active,
      u.created_at,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status_id != 4) as active_tasks_count
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.first_name, u.last_name
    LIMIT ? OFFSET ?
  `;

  queryParams.push(parseInt(limit), offset);
  const [users] = await pool.query(query, queryParams);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  });
}));

// Get user profile by ID
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.params.id;
  const currentUserId = req.user.userId;

  // Получаем team_id текущего пользователя
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [currentUserId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.is_active,
      u.is_admin,
      u.created_at,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status_id = 4) as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE created_by = u.id) as created_tasks
    FROM users u
    WHERE u.id = ? AND u.is_active = 1 AND u.team_id = ?
  `, [userId, teamId]);

  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: users[0]
  });
}));

// Get current user profile
router.get('/profile/me', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.bio,
      u.birthday,
      u.is_active,
      u.is_admin,
      u.created_at,
      u.team_id,
      t.name as team_name,
      t.invite_code as team_invite_code,
      t.owner_id as team_owner_id,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status_id = 4) as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE created_by = u.id) as created_tasks,
      (SELECT COUNT(*) FROM users WHERE team_id = u.team_id AND is_active = 1) as team_members_count
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.id = ? AND u.is_active = 1
  `, [userId]);

  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = users[0];

  res.json({
    success: true,
    data: {
      ...user,
      is_team_owner: user.team_owner_id === userId,
      team_info: user.team_id ? {
        id: user.team_id,
        name: user.team_name,
        invite_code: user.team_invite_code,
        owner_id: user.team_owner_id,
        members_count: user.team_members_count,
        is_owner: user.team_owner_id === userId
      } : null
    }
  });
}));

// Update user profile (only own profile or admin)
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, requireOwnerOrAdmin, validateUser, catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { email, phone, position, company, department, first_name, last_name } = req.body;

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];

  if (email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    updateValues.push(phone);
  }
  if (position !== undefined) {
    updateFields.push('position = ?');
    updateValues.push(position);
  }
  if (company !== undefined) {
    updateFields.push('company = ?');
    updateValues.push(company);
  }
  if (department !== undefined) {
    updateFields.push('department = ?');
    updateValues.push(department);
  }
  if (first_name !== undefined) {
    updateFields.push('first_name = ?');
    updateValues.push(first_name);
  }
  if (last_name !== undefined) {
    updateFields.push('last_name = ?');
    updateValues.push(last_name);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(userId);

  const [result] = await pool.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  if (result.affectedRows === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Get updated user
  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.is_active,
      u.is_admin,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = ?
  `, [userId]);

  res.json({
    success: true,
    data: users[0],
    message: 'Profile updated successfully'
  });
}));

// Update current user profile (shortcut)
router.put('/profile/me', apiRateLimit, sanitizeInput, authenticateToken, validateUser, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { email, phone, position, company, department, first_name, last_name, username, bio, birthday } = req.body;

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];

  if (email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?');
    updateValues.push(phone);
  }
  if (position !== undefined) {
    updateFields.push('position = ?');
    updateValues.push(position);
  }
  if (company !== undefined) {
    updateFields.push('company = ?');
    updateValues.push(company);
  }
  if (department !== undefined) {
    updateFields.push('department = ?');
    updateValues.push(department);
  }
  if (first_name !== undefined) {
    updateFields.push('first_name = ?');
    updateValues.push(first_name);
  }
  if (last_name !== undefined) {
    updateFields.push('last_name = ?');
    updateValues.push(last_name);
  }
  if (username !== undefined) {
    updateFields.push('username = ?');
    updateValues.push(username);
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

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(userId);

  const [result] = await pool.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  if (result.affectedRows === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Get updated user
  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.bio,
      u.birthday,
      u.is_active,
      u.is_admin,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = ?
  `, [userId]);

  res.json({
    success: true,
    data: users[0],
    message: 'Profile updated successfully'
  });
}));

// Upload avatar for current user
router.post('/profile/me/avatar', apiRateLimit, authenticateToken, uploadAvatar.single('avatar'), handleUploadError, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    throw new AppError('Файл не был загружен', 400, 'NO_FILE_UPLOADED');
  }

  // Get current user's avatar to delete old one
  const [currentUser] = await pool.query(
    'SELECT avatar_url FROM users WHERE id = ?',
    [userId]
  );

  if (currentUser.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Delete old avatar if exists
  if (currentUser[0].avatar_url) {
    deleteOldAvatar(currentUser[0].avatar_url);
  }

  // Update user's avatar_url in database
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  
  const [result] = await pool.query(
    'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
    [avatarUrl, userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Failed to update avatar', 500, 'UPDATE_FAILED');
  }

  // Get updated user data
  const [users] = await pool.query(`
    SELECT 
      u.id, 
      u.telegram_id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      u.position, 
      u.company,
      u.department, 
      u.avatar_url,
      u.bio,
      u.birthday,
      u.is_active,
      u.is_admin,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = ?
  `, [userId]);

  res.json({
    success: true,
    data: users[0],
    message: 'Аватар успешно загружен'
  });
}));

// Загрузка аватара
router.post('/avatar/upload', apiRateLimit, upload.single('avatar'), catchAsync(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }

    // Создаем URL для доступа к файлу
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        avatar_url: avatarUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке файла'
    });
  }
}));

// Create new user (admin only)
router.post('/', strictRateLimit, sanitizeInput, authenticateToken, requireAdmin, validateUser, catchAsync(async (req, res) => {
  const { 
    telegram_id, 
    username, 
    first_name, 
    last_name, 
    email, 
    phone, 
    position, 
    company,
    department,
    is_admin = false
  } = req.body;

  // Check if user with this telegram_id already exists
  const [existingUsers] = await pool.query(
    'SELECT id FROM users WHERE telegram_id = ? OR email = ?',
    [telegram_id, email]
  );

  if (existingUsers.length > 0) {
    throw new AppError('User with this Telegram ID or email already exists', 409, 'USER_ALREADY_EXISTS');
  }

  // Create new user
  const [result] = await pool.query(`
    INSERT INTO users (
      telegram_id, username, first_name, last_name, 
      email, phone, position, company, department, is_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    telegram_id, username, first_name, last_name,
    email, phone, position, company, department, is_admin
  ]);

  // Get created user
  const [newUser] = await pool.query(`
    SELECT 
      id, telegram_id, username, first_name, last_name, 
      email, phone, position, company, department, avatar_url,
      is_active, is_admin, created_at
    FROM users 
    WHERE id = ?
  `, [result.insertId]);

  const user = newUser[0];

  // Отправляем уведомление администраторам о новом сотруднике
  try {
    const adminIds = await getAdminTelegramIds();
    if (adminIds.length > 0) {
      const employeeName = `${first_name} ${last_name}`.trim() || username || 'Новый сотрудник';
      
      // Отправляем уведомление асинхронно
      notifyNewEmployee(
        adminIds,
        employeeName,
        position || 'Не указана',
        department || 'Не указан'
      ).catch(error => {
        console.error('Failed to send new employee notification:', error);
      });
    }
  } catch (error) {
    console.error('Error getting admin IDs for notification:', error);
  }

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
}));

// Deactivate user (admin only)
router.delete('/:id', strictRateLimit, sanitizeInput, authenticateToken, validateId, requireAdmin, catchAsync(async (req, res) => {
  const userId = req.params.id;
  const currentUserId = req.user.userId;

  // Prevent self-deletion
  if (parseInt(userId) === currentUserId) {
    throw new AppError('Cannot deactivate your own account', 400, 'SELF_DELETION_FORBIDDEN');
  }

  // Deactivate user instead of deleting
  const [result] = await pool.query(
    'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
    [userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// Reactivate user (admin only)
router.patch('/:id/activate', strictRateLimit, sanitizeInput, authenticateToken, validateId, requireAdmin, catchAsync(async (req, res) => {
  const userId = req.params.id;

  const [result] = await pool.query(
    'UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?',
    [userId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'User activated successfully'
  });
}));

// Get departments list
router.get('/meta/departments', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [departments] = await pool.query(`
    SELECT DISTINCT department as name
    FROM users 
    WHERE department IS NOT NULL AND department != '' AND is_active = 1
    ORDER BY department
  `);

  res.json({
    success: true,
    data: departments
  });
}));

// Get positions list
router.get('/meta/positions', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [positions] = await pool.query(`
    SELECT DISTINCT position as name
    FROM users 
    WHERE position IS NOT NULL AND position != '' AND is_active = 1
    ORDER BY position
  `);

  res.json({
    success: true,
    data: positions
  });
}));

// Get user statistics (admin only)
router.get('/meta/stats', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const [stats] = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
      (SELECT COUNT(*) FROM users WHERE is_active = 0) as inactive_users,
      (SELECT COUNT(DISTINCT department) FROM users WHERE is_active = 1) as departments_count,
      (SELECT COUNT(DISTINCT position) FROM users WHERE is_active = 1) as positions_count,
      (SELECT COUNT(*) FROM tasks) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status_id = 4) as completed_tasks
  `);

  res.json({
    success: true,
    data: stats[0]
  });
}));

module.exports = router; 
