const express = require('express');
const { db } = require('../database/json-db');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('./auth-middleware-json');
const { apiRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'JSON Users API is working!',
    timestamp: new Date().toISOString()
  });
});

// Avatar upload endpoint (нужен для frontend)
router.post('/avatar/upload', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  // Временная заглушка для загрузки аватара
  res.json({
    success: true,
    message: 'Avatar upload not implemented yet',
    avatar_url: null
  });
}));

// Получить всех пользователей команды
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const { 
    search, 
    department, 
    position,
    is_active = 1,
    page = 1,
    limit = 20
  } = req.query;

  // Получаем пользователей только из команды текущего пользователя
  let users = await db.select('users', { team_id: teamId });
  
  // Применяем фильтры
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(user => 
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  }
  
  if (department) {
    users = users.filter(user => user.department === department);
  }
  
  if (position) {
    users = users.filter(user => user.position && user.position.toLowerCase().includes(position.toLowerCase()));
  }
  
  if (is_active !== undefined) {
    users = users.filter(user => user.is_active === Boolean(parseInt(is_active)));
  }
  
  // Сортировка по имени
  users.sort((a, b) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
    return nameA.localeCompare(nameB);
  });
  
  // Добавляем статистику по задачам для каждого пользователя
  const allTasks = await db.select('tasks');
  const enrichedUsers = users.map(user => {
    const userTasks = allTasks.filter(task => task.assigned_to === user.id);
    const activeTasks = userTasks.filter(task => task.status_id !== 4); // не завершенные
    
    return {
      ...user,
      active_tasks_count: activeTasks.length,
      total_tasks_count: userTasks.length
    };
  });
  
  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginatedUsers = enrichedUsers.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrichedUsers.length,
        totalPages: Math.ceil(enrichedUsers.length / parseInt(limit)),
        hasNext: offset + parseInt(limit) < enrichedUsers.length,
        hasPrev: parseInt(page) > 1
      }
    }
  });
}));

// Получить пользователя по ID
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = parseInt(req.params.id);
  const currentUserTeamId = req.user.teamId;
  
  const users = await db.select('users', { id: userId });
  
  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  const user = users[0];
  
  // Проверяем, что пользователь из той же команды
  if (user.team_id !== currentUserTeamId && !req.user.isAdmin) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Получаем статистику по задачам
  const allTasks = await db.select('tasks');
  const userTasks = allTasks.filter(task => task.assigned_to === user.id || task.created_by === user.id);
  const assignedTasks = allTasks.filter(task => task.assigned_to === user.id);
  const createdTasks = allTasks.filter(task => task.created_by === user.id);
  const completedTasks = assignedTasks.filter(task => task.status_id === 4);
  
  const enrichedUser = {
    ...user,
    total_tasks: userTasks.length,
    assigned_tasks: assignedTasks.length,
    created_tasks: createdTasks.length,
    completed_tasks: completedTasks.length,
    active_tasks: assignedTasks.filter(task => task.status_id !== 4).length
  };
  
  res.json({
    success: true,
    data: enrichedUser
  });
}));

// Получить профиль текущего пользователя
router.get('/profile/me', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  const users = await db.select('users', { id: userId });
  
  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  const user = users[0];
  
  // Получаем информацию о команде
  let team = null;
  if (user.team_id) {
    const teams = await db.select('teams', { id: user.team_id });
    if (teams.length > 0) {
      team = teams[0];
    }
  }
  
  // Получаем статистику по задачам
  const allTasks = await db.select('tasks');
  const assignedTasks = allTasks.filter(task => task.assigned_to === user.id);
  const createdTasks = allTasks.filter(task => task.created_by === user.id);
  const completedTasks = assignedTasks.filter(task => task.status_id === 4);
  
  const profileData = {
    ...user,
    team: team ? {
      id: team.id,
      name: team.name,
      invite_code: team.invite_code,
      is_owner: team.owner_id === user.id
    } : null,
    stats: {
      assigned_tasks: assignedTasks.length,
      created_tasks: createdTasks.length,
      completed_tasks: completedTasks.length,
      active_tasks: assignedTasks.filter(task => task.status_id !== 4).length
    }
  };
  
  res.json({
    success: true,
    data: profileData
  });
}));

// Обновить профиль текущего пользователя
router.put('/profile/me', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  const {
    first_name,
    last_name,
    email,
    phone,
    position,
    department,
    company,
    bio,
    birthday
  } = req.body;
  
  const updateData = {};
  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (position !== undefined) updateData.position = position;
  if (department !== undefined) updateData.department = department;
  if (company !== undefined) updateData.company = company;
  if (bio !== undefined) updateData.bio = bio;
  if (birthday !== undefined) updateData.birthday = birthday;
  
  // Проверяем уникальность email если он обновляется
  if (email) {
    const existingUsers = await db.select('users', { email: email });
    const emailExists = existingUsers.some(user => user.id !== userId);
    if (emailExists) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }
  }
  
  await db.update('users', { id: userId }, updateData);
  
  // Получаем обновленного пользователя
  const updatedUsers = await db.select('users', { id: userId });
  
  res.json({
    success: true,
    data: updatedUsers[0],
    message: 'Profile updated successfully'
  });
}));

// Обновить пользователя (только для админа или владельца)
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, requireOwnerOrAdmin, catchAsync(async (req, res) => {
  const userId = parseInt(req.params.id);
  
  const users = await db.select('users', { id: userId });
  
  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  const {
    first_name,
    last_name,
    email,
    phone,
    position,
    department,
    company,
    bio,
    birthday,
    is_admin
  } = req.body;
  
  const updateData = {};
  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (position !== undefined) updateData.position = position;
  if (department !== undefined) updateData.department = department;
  if (company !== undefined) updateData.company = company;
  if (bio !== undefined) updateData.bio = bio;
  if (birthday !== undefined) updateData.birthday = birthday;
  
  // Только админы могут изменять права администратора
  if (is_admin !== undefined && req.user.isAdmin) {
    updateData.is_admin = Boolean(is_admin);
  }
  
  // Проверяем уникальность email
  if (email) {
    const existingUsers = await db.select('users', { email: email });
    const emailExists = existingUsers.some(user => user.id !== userId);
    if (emailExists) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }
  }
  
  await db.update('users', { id: userId }, updateData);
  
  // Получаем обновленного пользователя
  const updatedUsers = await db.select('users', { id: userId });
  
  res.json({
    success: true,
    data: updatedUsers[0],
    message: 'User updated successfully'
  });
}));

// Деактивировать пользователя (только для админа)
router.delete('/:id', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (userId === req.user.userId) {
    throw new AppError('Cannot deactivate yourself', 400, 'CANNOT_DEACTIVATE_SELF');
  }
  
  const users = await db.select('users', { id: userId });
  
  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  await db.update('users', { id: userId }, { is_active: false });
  
  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// Активировать пользователя (только для админа)
router.patch('/:id/activate', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const userId = parseInt(req.params.id);
  
  const users = await db.select('users', { id: userId });
  
  if (users.length === 0) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  await db.update('users', { id: userId }, { is_active: true });
  
  res.json({
    success: true,
    message: 'User activated successfully'
  });
}));

// Получить список отделов
router.get('/meta/departments', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const users = await db.select('users', { team_id: teamId });
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))].sort();
  
  res.json({
    success: true,
    data: departments
  });
}));

// Получить список должностей
router.get('/meta/positions', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const users = await db.select('users', { team_id: teamId });
  const positions = [...new Set(users.map(user => user.position).filter(Boolean))].sort();
  
  res.json({
    success: true,
    data: positions
  });
}));

// Получить статистику пользователей (только для админа)
router.get('/meta/stats', apiRateLimit, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const users = await db.select('users', { team_id: teamId });
  const tasks = await db.select('tasks');
  
  const stats = {
    total_users: users.length,
    active_users: users.filter(u => u.is_active).length,
    inactive_users: users.filter(u => !u.is_active).length,
    admin_users: users.filter(u => u.is_admin).length,
    departments: [...new Set(users.map(u => u.department).filter(Boolean))].length,
    users_with_tasks: users.filter(u => tasks.some(t => t.assigned_to === u.id)).length
  };
  
  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router; 