const express = require('express');
const { db } = require('../database/json-db');
const { authenticateToken } = require('./auth-middleware-json');
const { apiRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'JSON Tasks API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get all tasks с фильтрацией
router.get('/', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  const { status, assigned_to, created_by, priority, page = 1, limit = 50 } = req.query;
  
  let filter = { team_id: teamId };
  
  if (status) filter.status = status;
  if (assigned_to) filter.assigned_to = parseInt(assigned_to);
  if (created_by) filter.created_by = parseInt(created_by);
  if (priority) filter.priority = priority;
  
  const tasks = await db.select('tasks', filter);
  
  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: tasks.length
    }
  });
}));

// Get task by id
router.get('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const tasks = await db.select('tasks', { id: taskId, team_id: teamId });
  
  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  res.json({
    success: true,
    data: tasks[0]
  });
}));

// Update task
router.put('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const tasks = await db.select('tasks', { id: taskId, team_id: teamId });
  
  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const task = tasks[0];
  
  // Проверяем права (создатель или назначенный)
  if (task.created_by !== userId && task.assigned_to !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  const updateData = { ...req.body };
  updateData.updated_at = new Date().toISOString();
  
  await db.update('tasks', { id: taskId }, updateData);
  const updatedTasks = await db.select('tasks', { id: taskId });
  
  res.json({
    success: true,
    data: updatedTasks[0]
  });
}));

// Delete task
router.delete('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const tasks = await db.select('tasks', { id: taskId, team_id: teamId });
  
  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const task = tasks[0];
  
  // Только создатель может удалить
  if (task.created_by !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only task creator can delete'
    });
  }
  
  await db.delete('tasks', { id: taskId });
  
  res.json({
    success: true,
    message: 'Task deleted'
  });
}));

// Task comments
router.get('/:id/comments', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  // Проверяем доступ к задаче
  const tasks = await db.select('tasks', { id: taskId, team_id: teamId });
  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const comments = await db.select('task_comments', { task_id: taskId });
  
  res.json({
    success: true,
    data: comments
  });
}));

router.post('/:id/comments', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Comment content is required'
    });
  }
  
  // Проверяем доступ к задаче
  const tasks = await db.select('tasks', { id: taskId, team_id: teamId });
  if (tasks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }
  
  const comment = await db.insert('task_comments', {
    task_id: taskId,
    user_id: userId,
    content: content.trim(),
    created_at: new Date().toISOString()
  });
  
  res.json({
    success: true,
    data: comment
  });
}));

// Task files/attachments
router.get('/:id/files', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  // Заглушка для файлов
  res.json({
    success: true,
    data: []
  });
}));

router.post('/:id/files', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  // Заглушка для загрузки файлов
  res.json({
    success: true,
    message: 'File upload not implemented yet'
  });
}));

// Task time tracking
router.get('/:id/time', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  // Заглушка для времени
  res.json({
    success: true,
    data: {
      logged_time: 0,
      estimated_time: 0
    }
  });
}));

router.post('/:id/time', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  // Заглушка для логирования времени
  res.json({
    success: true,
    message: 'Time logging not implemented yet'
  });
}));

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'JSON Tasks API is working!',
    timestamp: new Date().toISOString()
  });
});

// Получить все задачи пользователя
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const { 
    type = 'all',
    status, 
    priority, 
    page = 1,
    limit = 20
  } = req.query;

  console.log('Getting tasks for user:', userId, 'team:', teamId, 'type:', type);
  
  // Получаем все задачи команды пользователя
  let tasks = await db.select('tasks', { team_id: teamId });
  
  console.log('Found tasks in team:', tasks.length);
  
  // Фильтруем по типу согласно ТЗ
  if (type === 'incoming') {
    // ВХОДЯЩИЕ: задачи, которые мне назначили другие (я получатель, но не создатель)
    tasks = tasks.filter(task => 
      task.assigned_to === userId && task.created_by !== userId && !task.is_personal
    );
    console.log('Incoming tasks:', tasks.length);
  } else if (type === 'outgoing') {
    // ИСХОДЯЩИЕ: задачи, которые я назначил другим (я создатель, но не получатель)
    tasks = tasks.filter(task => 
      task.created_by === userId && task.assigned_to !== userId && !task.is_personal
    );
    console.log('Outgoing tasks:', tasks.length);
  } else if (type === 'personal') {
    // ЛИЧНЫЕ: задачи, которые я создал для себя
    tasks = tasks.filter(task => 
      task.is_personal || (task.assigned_to === userId && task.created_by === userId)
    );
    console.log('Personal tasks:', tasks.length);
  } else {
    // ВСЕ: задачи, где я участвую (создатель или получатель)
    tasks = tasks.filter(task => 
      task.assigned_to === userId || task.created_by === userId
    );
    console.log('All tasks:', tasks.length);
  }
  
  // Фильтруем по статусу
  if (status) {
    tasks = tasks.filter(task => task.status_id === parseInt(status));
  }
  
  // Фильтруем по приоритету
  if (priority) {
    tasks = tasks.filter(task => task.priority_id === parseInt(priority));
  }
  
  // Получаем статусы и приоритеты
  const statuses = await db.select('task_statuses');
  const priorities = await db.select('task_priorities');
  const users = await db.select('users');
  
  // Обогащаем задачи дополнительными данными
  const enrichedTasks = tasks.map(task => {
    const status = statuses.find(s => s.id === task.status_id) || { name: 'Unknown', color: '#999999' };
    const priority = priorities.find(p => p.id === task.priority_id) || { name: 'Medium', color: '#F39C12', level: 2 };
    const assignedUser = users.find(u => u.id === task.assigned_to) || {};
    const creatorUser = users.find(u => u.id === task.created_by) || {};
    
    return {
      ...task,
      status_name: status.name,
      status_color: status.color,
      priority_name: priority.name,
      priority_color: priority.color,
      priority_level: priority.level,
      assigned_first_name: assignedUser.first_name || 'Unknown',
      assigned_last_name: assignedUser.last_name || '',
      assigned_username: assignedUser.username || '',
      creator_first_name: creatorUser.first_name || 'Unknown',
      creator_last_name: creatorUser.last_name || '',
      creator_username: creatorUser.username || ''
    };
  });
  
  // Сортировка
  enrichedTasks.sort((a, b) => {
    // Сначала по приоритету (высокий приоритет выше)
    if (a.priority_level !== b.priority_level) {
      return b.priority_level - a.priority_level;
    }
    // Потом по дате создания (новые сверху)
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginatedTasks = enrichedTasks.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      tasks: paginatedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrichedTasks.length,
        totalPages: Math.ceil(enrichedTasks.length / parseInt(limit)),
        hasNext: offset + parseInt(limit) < enrichedTasks.length,
        hasPrev: parseInt(page) > 1
      }
    }
  });
}));

// Получить задачу по ID
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Проверяем доступ к задаче
  const teamUsers = await db.select('users', { team_id: teamId });
  const teamUserIds = teamUsers.map(u => u.id);
  
  if (!teamUserIds.includes(task.assigned_to) && 
      !teamUserIds.includes(task.created_by) &&
      task.assigned_to !== userId &&
      task.created_by !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  // Получаем дополнительные данные
  const statuses = await db.select('task_statuses');
  const priorities = await db.select('task_priorities');
  const users = await db.select('users');
  
  const status = statuses.find(s => s.id === task.status_id) || { name: 'Unknown', color: '#999999' };
  const priority = priorities.find(p => p.id === task.priority_id) || { name: 'Medium', color: '#F39C12', level: 2 };
  const assignedUser = users.find(u => u.id === task.assigned_to) || {};
  const creatorUser = users.find(u => u.id === task.created_by) || {};
  
  const enrichedTask = {
    ...task,
    status_name: status.name,
    status_color: status.color,
    priority_name: priority.name,
    priority_color: priority.color,
    priority_level: priority.level,
    assigned_user: {
      id: assignedUser.id,
      first_name: assignedUser.first_name || 'Unknown',
      last_name: assignedUser.last_name || '',
      username: assignedUser.username || '',
      avatar_url: assignedUser.avatar_url
    },
    creator_user: {
      id: creatorUser.id,
      first_name: creatorUser.first_name || 'Unknown',
      last_name: creatorUser.last_name || '',
      username: creatorUser.username || '',
      avatar_url: creatorUser.avatar_url
    }
  };
  
  res.json({
    success: true,
    data: enrichedTask
  });
}));

// Создать новую задачу
router.post('/', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const {
    title,
    description,
    assigned_to,
    status_id = 1,
    priority_id = 2,
    due_date,
    is_personal = false
  } = req.body;
  
  if (!title || title.trim().length === 0) {
    throw new AppError('Task title is required', 400, 'TITLE_REQUIRED');
  }
  
  // Проверяем, что assigned_to принадлежит команде
  if (assigned_to) {
    const assignedUsers = await db.select('users', { id: assigned_to, team_id: teamId });
    if (assignedUsers.length === 0) {
      throw new AppError('Assigned user not found in team', 400, 'INVALID_ASSIGNED_USER');
    }
  }
  
  const newTask = await db.insert('tasks', {
    title: title.trim(),
    description: description || '',
    assigned_to: assigned_to || null,
    created_by: userId,
    team_id: teamId,
    status_id: parseInt(status_id),
    priority_id: parseInt(priority_id),
    due_date: due_date || null,
    is_personal: Boolean(is_personal),
    hidden_for_assignee: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  res.json({
    success: true,
    data: newTask,
    message: 'Task created successfully'
  });
}));

// Обновить задачу
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Проверяем права на редактирование (создатель или назначенный)
  if (task.created_by !== userId && task.assigned_to !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const {
    title,
    description,
    assigned_to,
    status_id,
    priority_id,
    due_date,
    is_personal
  } = req.body;
  
  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description;
  if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
  if (status_id !== undefined) updateData.status_id = parseInt(status_id);
  if (priority_id !== undefined) updateData.priority_id = parseInt(priority_id);
  if (due_date !== undefined) updateData.due_date = due_date;
  if (is_personal !== undefined) updateData.is_personal = Boolean(is_personal);
  
  // Проверяем assigned_to если он указан
  if (updateData.assigned_to) {
    const assignedUsers = await db.select('users', { id: updateData.assigned_to, team_id: teamId });
    if (assignedUsers.length === 0) {
      throw new AppError('Assigned user not found in team', 400, 'INVALID_ASSIGNED_USER');
    }
  }
  
  await db.update('tasks', { id: taskId }, updateData);
  
  // Получаем обновленную задачу
  const updatedTasks = await db.select('tasks', { id: taskId });
  
  res.json({
    success: true,
    data: updatedTasks[0],
    message: 'Task updated successfully'
  });
}));

// Обновить статус задачи
router.patch('/:id/status', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.userId;
  const { status_id } = req.body;
  
  if (!status_id) {
    throw new AppError('Status ID is required', 400, 'STATUS_REQUIRED');
  }
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Проверяем права на изменение статуса
  if (task.created_by !== userId && task.assigned_to !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  await db.update('tasks', { id: taskId }, { status_id: parseInt(status_id) });
  
  res.json({
    success: true,
    message: 'Task status updated successfully'
  });
}));

// Удалить задачу
router.delete('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.userId;
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Только создатель может удалить задачу
  if (task.created_by !== userId) {
    throw new AppError('Only task creator can delete task', 403, 'ACCESS_DENIED');
  }
  
  await db.delete('tasks', { id: taskId });
  
  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// Получить статусы задач
router.get('/meta/statuses', apiRateLimit, catchAsync(async (req, res) => {
  const statuses = await db.select('task_statuses');
  
  res.json({
    success: true,
    data: statuses
  });
}));

// Получить приоритеты задач
router.get('/meta/priorities', apiRateLimit, catchAsync(async (req, res) => {
  const priorities = await db.select('task_priorities');
  
  res.json({
    success: true,
    data: priorities
  });
}));

module.exports = router; 