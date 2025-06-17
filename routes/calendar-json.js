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
    message: 'JSON Calendar API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get calendar events (с фильтрацией по дате)
router.get('/events', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  const { start_date, end_date, user_id } = req.query;
  
  let filter = { team_id: teamId };
  
  if (user_id) {
    filter.user_id = parseInt(user_id);
  }
  
  let events = await db.select('calendar_events', filter);
  
  // Фильтрация по дате если указана
  if (start_date || end_date) {
    events = events.filter(event => {
      const eventDate = new Date(event.event_date);
      if (start_date && eventDate < new Date(start_date)) return false;
      if (end_date && eventDate > new Date(end_date)) return false;
      return true;
    });
  }
  
  res.json({
    success: true,
    data: events
  });
}));

// Create calendar event
router.post('/events', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const eventData = {
    ...req.body,
    team_id: teamId,
    created_by: userId,
    created_at: new Date().toISOString()
  };
  
  const event = await db.insert('calendar_events', eventData);
  
  res.json({
    success: true,
    data: event
  });
}));

// Get single event
router.get('/events/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const eventId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const events = await db.select('calendar_events', { id: eventId, team_id: teamId });
  
  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  res.json({
    success: true,
    data: events[0]
  });
}));

// Update event
router.put('/events/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const eventId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const events = await db.select('calendar_events', { id: eventId, team_id: teamId });
  
  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  const event = events[0];
  
  // Проверяем права (создатель или админ)
  if (event.created_by !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  const updateData = { ...req.body };
  updateData.updated_at = new Date().toISOString();
  
  await db.update('calendar_events', { id: eventId }, updateData);
  const updatedEvents = await db.select('calendar_events', { id: eventId });
  
  res.json({
    success: true,
    data: updatedEvents[0]
  });
}));

// Delete event
router.delete('/events/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const eventId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const events = await db.select('calendar_events', { id: eventId, team_id: teamId });
  
  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }
  
  const event = events[0];
  
  // Только создатель может удалить
  if (event.created_by !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only event creator can delete'
    });
  }
  
  await db.delete('calendar_events', { id: eventId });
  
  res.json({
    success: true,
    message: 'Event deleted'
  });
}));

// Получить задачи для календаря
router.get('/tasks', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const { 
    date,
    month,
    year
  } = req.query;

  // Получаем все задачи команды
  let tasks = await db.select('tasks');
  
  // Фильтруем по команде
  const teamUsers = await db.select('users', { team_id: teamId });
  const teamUserIds = teamUsers.map(u => u.id);
  
  tasks = tasks.filter(task => 
    teamUserIds.includes(task.assigned_to) || 
    teamUserIds.includes(task.created_by) ||
    task.assigned_to === userId ||
    task.created_by === userId
  );
  
  // Фильтруем по дате если указана
  if (date) {
    tasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === date;
    });
  } else if (month && year) {
    tasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getMonth() + 1 === parseInt(month) && taskDate.getFullYear() === parseInt(year);
    });
  }
  
  // Получаем дополнительные данные
  const statuses = await db.select('task_statuses');
  const priorities = await db.select('task_priorities');
  const users = await db.select('users');
  
  // Обогащаем задачи
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
  });
  
  // Сортировка по дате
  enrichedTasks.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });
  
  res.json({
    success: true,
    data: {
      tasks: enrichedTasks,
      total: enrichedTasks.length
    }
  });
}));

// Получить задачи по конкретной дате
router.get('/date/:date', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  const date = req.params.date;

  // Получаем все задачи команды
  let tasks = await db.select('tasks');
  
  // Фильтруем по команде
  const teamUsers = await db.select('users', { team_id: teamId });
  const teamUserIds = teamUsers.map(u => u.id);
  
  tasks = tasks.filter(task => 
    teamUserIds.includes(task.assigned_to) || 
    teamUserIds.includes(task.created_by) ||
    task.assigned_to === userId ||
    task.created_by === userId
  );
  
  // Фильтруем по дате
  tasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date).toISOString().split('T')[0];
    return taskDate === date;
  });
  
  // Получаем дополнительные данные
  const statuses = await db.select('task_statuses');
  const priorities = await db.select('task_priorities');
  const users = await db.select('users');
  
  // Обогащаем задачи
  const enrichedTasks = tasks.map(task => {
    const status = statuses.find(s => s.id === task.status_id) || { name: 'Unknown', color: '#999999' };
    const priority = priorities.find(p => p.id === task.priority_id) || { name: 'Medium', color: '#F39C12', level: 2 };
    const assignedUser = users.find(u => u.id === task.assigned_to) || {};
    
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
      assigned_avatar_url: assignedUser.avatar_url
    };
  });
  
  res.json({
    success: true,
    data: enrichedTasks
  });
}));

// Получить обзор календаря
router.get('/overview', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  const { month, year } = req.query;

  // Получаем все задачи команды
  let tasks = await db.select('tasks');
  
  // Фильтруем по команде
  const teamUsers = await db.select('users', { team_id: teamId });
  const teamUserIds = teamUsers.map(u => u.id);
  
  tasks = tasks.filter(task => 
    teamUserIds.includes(task.assigned_to) || 
    teamUserIds.includes(task.created_by) ||
    task.assigned_to === userId ||
    task.created_by === userId
  );
  
  // Фильтруем по месяцу если указан
  if (month && year) {
    tasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getMonth() + 1 === parseInt(month) && taskDate.getFullYear() === parseInt(year);
    });
  }
  
  // Группируем задачи по дням
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.due_date) {
      const date = new Date(task.due_date).toISOString().split('T')[0];
      if (!tasksByDate[date]) {
        tasksByDate[date] = [];
      }
      tasksByDate[date].push(task);
    }
  });
  
  // Считаем статистику
  const stats = {
    total_tasks: tasks.length,
    completed_tasks: tasks.filter(t => t.status_id === 4).length,
    active_tasks: tasks.filter(t => t.status_id !== 4).length,
    overdue_tasks: tasks.filter(t => {
      if (!t.due_date || t.status_id === 4) return false;
      return new Date(t.due_date) < new Date();
    }).length,
    tasks_by_date: tasksByDate
  };
  
  res.json({
    success: true,
    data: stats
  });
}));

// Получить задачи без даты
router.get('/no-date', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;

  // Получаем все задачи команды без даты
  let tasks = await db.select('tasks');
  
  // Фильтруем по команде
  const teamUsers = await db.select('users', { team_id: teamId });
  const teamUserIds = teamUsers.map(u => u.id);
  
  tasks = tasks.filter(task => 
    (teamUserIds.includes(task.assigned_to) || 
     teamUserIds.includes(task.created_by) ||
     task.assigned_to === userId ||
     task.created_by === userId) &&
    !task.due_date
  );
  
  res.json({
    success: true,
    data: tasks
  });
}));

// Назначить дату задаче
router.patch('/tasks/:taskId/schedule', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const userId = req.user.userId;
  const { due_date } = req.body;
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Проверяем права
  if (task.created_by !== userId && task.assigned_to !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  await db.update('tasks', { id: taskId }, { due_date: due_date });
  
  res.json({
    success: true,
    message: 'Task scheduled successfully'
  });
}));

// Убрать задачу из календаря
router.delete('/tasks/:taskId/schedule', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  const userId = req.user.userId;
  
  const tasks = await db.select('tasks', { id: taskId });
  
  if (tasks.length === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }
  
  const task = tasks[0];
  
  // Проверяем права
  if (task.created_by !== userId && task.assigned_to !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  await db.update('tasks', { id: taskId }, { due_date: null });
  
  res.json({
    success: true,
    message: 'Task removed from calendar successfully'
  });
}));

module.exports = router; 