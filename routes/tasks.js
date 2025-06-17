const express = require('express');
const { pool } = require('../database/db');
const { validateTelegramWebApp, extractTelegramUser } = require('../middleware/telegram');
const { authenticateToken, requireOwnerOrAdmin } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/security');
const { validateTask, validateId, validateSearchQuery, validateTaskStatusUpdate, sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { notifyNewTask, notifyTaskCompleted, notifyTaskStatusChanged } = require('./notifications');
const router = express.Router();

// Test endpoint для проверки работы роутера
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Tasks router is working!',
    timestamp: new Date().toISOString(),
    user: req.user || 'No user'
  });
});

// Test endpoint для проверки SQL без аутентификации
router.get('/test-sql', catchAsync(async (req, res) => {
  try {
    // Простой SQL запрос для проверки
    const [result] = await pool.query('SELECT COUNT(*) as count FROM tasks');
    
    res.json({
      success: true,
      message: 'SQL test successful!',
      data: {
        totalTasks: result[0].count
      }
    });
  } catch (error) {
    console.error('SQL Test error:', error);
    res.status(500).json({
      success: false,
      message: 'SQL test failed',
      error: error.message
    });
  }
}));

// Get tasks with filters and pagination
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, validateSearchQuery, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { 
    type = 'all',
    status, 
    priority, 
    assigned_to,
    created_by,
    due_date_from,
    due_date_to,
    search,
    page = 1,
    limit = 20
  } = req.query;

  // Получаем team_id текущего пользователя
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // МАКСИМАЛЬНО ПРОСТОЙ ТЕСТ
  try {
    console.log('=== TESTING SIMPLE QUERY ===');
    const [simpleTest] = await pool.query('SELECT COUNT(*) as count FROM tasks');
    console.log('Simple count result:', simpleTest[0]);
    
    const [simpleSelect] = await pool.query('SELECT * FROM tasks LIMIT 5');
    console.log('Simple select result:', simpleSelect);
    console.log('=== SIMPLE TEST COMPLETE ===');
  } catch (error) {
    console.log('=== SIMPLE TEST ERROR ===');
    console.log('Error:', error.message);
    console.log('=== SIMPLE TEST ERROR END ===');
  }

  // Calculate offset for pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build WHERE conditions - добавляем фильтрацию по команде
  let whereConditions = ['(ua.team_id = ? OR uc.team_id = ?)'];
  let queryParams = [teamId, teamId];

  // Filter by task type
  if (type === 'personal') {
    whereConditions.push('(t.is_personal = 1 OR (t.assigned_to = ? AND t.created_by = ?))');
    queryParams.push(userId, userId);
  } else if (type === 'work') {
    whereConditions.push('t.is_personal = 0');
  }

  // Show only tasks user is involved in
  whereConditions.push('(t.assigned_to = ? OR t.created_by = ?)');
  queryParams.push(userId, userId);

  if (status) {
    whereConditions.push('t.status_id = ?');
    queryParams.push(parseInt(status));
  }

  if (priority) {
    whereConditions.push('t.priority_id = ?');
    queryParams.push(parseInt(priority));
  }

  if (assigned_to) {
    whereConditions.push('t.assigned_to = ?');
    queryParams.push(parseInt(assigned_to));
  }

  if (created_by) {
    whereConditions.push('t.created_by = ?');
    queryParams.push(parseInt(created_by));
  }

  if (due_date_from) {
    whereConditions.push('DATE(t.due_date) >= ?');
    queryParams.push(due_date_from);
  }

  if (due_date_to) {
    whereConditions.push('DATE(t.due_date) <= ?');
    queryParams.push(due_date_to);
  }

  if (search) {
    whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM tasks t
    WHERE ${whereClause}
  `;
  const [countResult] = await pool.query(countQuery, [...queryParams]);
  const total = countResult[0].total;

  // Get tasks with pagination - ПОЛНЫЙ ЗАПРОС С JOIN
  const query = `
    SELECT 
      t.*,
      COALESCE(ts.name, 'Unknown') as status_name,
      COALESCE(ts.color, '#999999') as status_color,
      COALESCE(tp.name, 'Medium') as priority_name,
      COALESCE(tp.color, '#F39C12') as priority_color,
      COALESCE(tp.level, 2) as priority_level,
      COALESCE(ua.first_name, 'Unknown') as assigned_first_name,
      COALESCE(ua.last_name, '') as assigned_last_name,
      COALESCE(ua.username, '') as assigned_username,
      COALESCE(uc.first_name, 'Unknown') as creator_first_name,
      COALESCE(uc.last_name, '') as creator_last_name,
      COALESCE(uc.username, '') as creator_username
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    WHERE ${whereClause}
    ORDER BY 
      CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
      t.due_date ASC,
      COALESCE(tp.level, 2) DESC,
      t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const mainQueryParams = [...queryParams, parseInt(limit), parseInt(offset)];
  
  // Debug information
  console.log('=== TASKS SQL DEBUG ===');
  console.log('userId:', userId);
  console.log('teamId:', teamId);
  console.log('page:', page, 'limit:', limit, 'offset:', offset);
  console.log('whereConditions:', whereConditions);
  console.log('whereClause:', whereClause);
  console.log('queryParams:', queryParams);
  console.log('mainQueryParams:', mainQueryParams);
  console.log('mainQueryParams types:', mainQueryParams.map(p => typeof p));
  console.log('Final SQL query:');
  console.log(query);
  console.log('========================');
  
  // Правильный параметризованный запрос
  const [tasks] = await pool.query(query, mainQueryParams);

  res.json({
    success: true,
    data: {
      tasks,
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

// Create new task
router.post('/', apiRateLimit, sanitizeInput, authenticateToken, validateTask, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { 
    title, 
    description, 
    assigned_to, 
    priority_id = 2,
    status_id = 1,
    due_date,
    is_personal = false
  } = req.body;

  // Create task
  // Преобразуем ISO дату в формат YYYY-MM-DD HH:MM:SS для MySQL
  let formattedDueDate = null;
  if (due_date) {
    if (due_date.includes('T')) {
      // ISO формат - конвертируем в MySQL DATETIME
      const date = new Date(due_date);
      formattedDueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      formattedDueDate = due_date;
    }
  }

  const [result] = await pool.query(`
    INSERT INTO tasks (
      title, 
      description, 
      assigned_to, 
      created_by, 
      priority_id, 
      status_id,
      due_date, 
      is_personal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    description || null,
    is_personal ? userId : (assigned_to || userId),
    userId,
    priority_id,
    status_id,
    formattedDueDate,
    is_personal
  ]);

  // Get created task with all details
  const [newTask] = await pool.query(`
    SELECT 
      t.*,
      ts.name as status_name,
      ts.color as status_color,
      tp.name as priority_name,
      tp.color as priority_color,
      tp.level as priority_level,
      ua.first_name as assigned_first_name,
      ua.last_name as assigned_last_name,
      ua.username as assigned_username,
      ua.telegram_id as assigned_telegram_id,
      uc.first_name as creator_first_name,
      uc.last_name as creator_last_name,
      uc.username as creator_username
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    WHERE t.id = ?
  `, [result.insertId]);

  const task = newTask[0];

  // Отправляем уведомление назначенному пользователю (если задача не личная и назначена не создателю)
  if (!is_personal && assigned_to && assigned_to !== userId && task.assigned_telegram_id) {
    const creatorName = `${task.creator_first_name} ${task.creator_last_name}`.trim() || task.creator_username || 'Неизвестный пользователь';
    
    // Отправляем уведомление асинхронно, не блокируя ответ
    notifyNewTask(
      result.insertId,
      task.assigned_telegram_id,
      creatorName,
      title
    ).catch(error => {
      console.error('Failed to send new task notification:', error);
    });
  }

  res.status(201).json({
    success: true,
    data: task
  });
}));

// Get single task
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;

  const [tasks] = await pool.query(`
    SELECT 
      t.*,
      ts.name as status_name,
      ts.color as status_color,
      tp.name as priority_name,
      tp.color as priority_color,
      tp.level as priority_level,
      ua.first_name as assigned_first_name,
      ua.last_name as assigned_last_name,
      ua.username as assigned_username,
      uc.first_name as creator_first_name,
      uc.last_name as creator_last_name,
      uc.username as creator_username
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    WHERE t.id = ? AND (t.assigned_to = ? OR t.created_by = ?)
  `, [taskId, userId, userId]);

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  res.json({
    success: true,
    data: tasks[0]
  });
}));

// Update task
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, requireOwnerOrAdmin, validateTask, catchAsync(async (req, res) => {
  const taskId = req.params.id;
  const { 
    title, 
    description, 
    assigned_to, 
    priority_id, 
    due_date, 
    is_personal 
  } = req.body;

  // Update task
  // Преобразуем ISO дату в формат YYYY-MM-DD HH:MM:SS для MySQL
  let formattedDueDate = null;
  if (due_date) {
    if (due_date.includes('T')) {
      // ISO формат - конвертируем в MySQL DATETIME
      const date = new Date(due_date);
      formattedDueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      formattedDueDate = due_date;
    }
  }

  const [result] = await pool.query(`
    UPDATE tasks 
    SET title = ?, description = ?, assigned_to = ?, priority_id = ?, due_date = ?, is_personal = ?, updated_at = NOW()
    WHERE id = ?
  `, [title, description, assigned_to, priority_id, formattedDueDate, is_personal, taskId]);

  if (result.affectedRows === 0) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Get updated task
  const [updatedTask] = await pool.query(`
    SELECT 
      t.*,
      ts.name as status_name,
      ts.color as status_color,
      tp.name as priority_name,
      tp.color as priority_color,
      tp.level as priority_level,
      ua.first_name as assigned_first_name,
      ua.last_name as assigned_last_name,
      ua.username as assigned_username,
      uc.first_name as creator_first_name,
      uc.last_name as creator_last_name,
      uc.username as creator_username
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    WHERE t.id = ?
  `, [taskId]);

  res.json({
    success: true,
    data: updatedTask[0]
  });
}));

// Update task status
router.patch('/:id/status', apiRateLimit, sanitizeInput, authenticateToken, validateId, validateTaskStatusUpdate, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;
  const { status_id, comment } = req.body;

  // Check if user has access to this task and get task details with status names
  const [tasks] = await pool.query(`
    SELECT 
      t.*,
      ua.first_name as assigned_first_name,
      ua.last_name as assigned_last_name,
      ua.username as assigned_username,
      ua.telegram_id as assigned_telegram_id,
      uc.first_name as creator_first_name,
      uc.last_name as creator_last_name,
      uc.username as creator_username,
      uc.telegram_id as creator_telegram_id,
      ts_old.name as old_status_name,
      ts_new.name as new_status_name
    FROM tasks t
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    LEFT JOIN task_statuses ts_old ON t.status_id = ts_old.id
    LEFT JOIN task_statuses ts_new ON ? = ts_new.id
    WHERE t.id = ? AND (t.assigned_to = ? OR t.created_by = ?)
  `, [status_id, taskId, userId, userId]);

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  const task = tasks[0];
  const oldStatusName = task.old_status_name;
  const newStatusName = task.new_status_name;

  // Update task status
  const [result] = await pool.query(
    'UPDATE tasks SET status_id = ?, updated_at = NOW() WHERE id = ?',
    [status_id, taskId]
  );

  // Получаем имя пользователя, который изменил статус
  const changedByName = userId === task.assigned_to 
    ? `${task.assigned_first_name} ${task.assigned_last_name}`.trim() || task.assigned_username || 'Исполнитель'
    : `${task.creator_first_name} ${task.creator_last_name}`.trim() || task.creator_username || 'Создатель';

  // Отправляем уведомления об изменении статуса
  try {
    // Если статус изменил исполнитель - уведомляем создателя
    if (userId === task.assigned_to && task.creator_telegram_id && task.created_by !== userId) {
      await notifyTaskStatusChanged(
        taskId,
        task.creator_telegram_id,
        task.title,
        oldStatusName,
        newStatusName,
        changedByName
      );
    }
    
    // Если статус изменил создатель - уведомляем исполнителя
    if (userId === task.created_by && task.assigned_telegram_id && task.assigned_to !== userId) {
      await notifyTaskStatusChanged(
        taskId,
        task.assigned_telegram_id,
        task.title,
        oldStatusName,
        newStatusName,
        changedByName
      );
    }

    // Отправляем специальное уведомление о завершении задачи (статус 4 = Done)
    if (status_id == 4 && task.created_by !== userId && task.creator_telegram_id) {
      const assignedName = `${task.assigned_first_name} ${task.assigned_last_name}`.trim() || task.assigned_username || 'Неизвестный пользователь';
      
      await notifyTaskCompleted(
        taskId,
        task.creator_telegram_id,
        assignedName,
        task.title,
        comment
      );
    }
  } catch (error) {
    console.error('Failed to send status change notifications:', error);
  }

  // Add status history record if comment provided
  if (comment) {
    await pool.query(
      'INSERT INTO task_history (task_id, user_id, action, comment) VALUES (?, ?, ?, ?)',
      [taskId, userId, 'status_change', comment]
    );
  }

  res.json({
    success: true,
    message: 'Task status updated successfully'
  });
}));

// Delete task
router.delete('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, requireOwnerOrAdmin, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;

  // Проверяем доступ к задаче
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  const task = tasks[0];

  // Если пользователь - получатель задачи, проверяем статус
  if (task.assigned_to === userId && task.created_by !== userId) {
    // По ТЗ: получатель может удалить задачу ТОЛЬКО если она уже выполнена (статус 4)
    if (task.status_id !== 4) {
      throw new AppError('Можно удалить только выполненные задачи', 400, 'TASK_NOT_COMPLETED');
    }
    
    // Помечаем как скрытую для получателя (мягкое удаление)
    await pool.query(
      'UPDATE tasks SET hidden_for_assignee = 1, updated_at = NOW() WHERE id = ?',
      [taskId]
    );
    
    res.json({
      success: true,
      message: 'Task hidden for assignee'
    });
  } else {
    // Если пользователь - создатель, полное удаление
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (result.affectedRows === 0) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  }
}));

// Get task types for filters
router.get('/meta/types', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const types = [
    { id: 'all', name: 'Все задачи' },
    { id: 'personal', name: 'Личные' },
    { id: 'work', name: 'Рабочие' },
    { id: 'incoming', name: 'Входящие' },
    { id: 'outgoing', name: 'Исходящие' }
  ];

  res.json({
    success: true,
    data: types
  });
}));

// Get task statuses
router.get('/meta/statuses', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [statuses] = await pool.query('SELECT * FROM task_statuses ORDER BY id');
  
  res.json({
    success: true,
    data: statuses
  });
}));

// Get task priorities
router.get('/meta/priorities', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [priorities] = await pool.query('SELECT * FROM task_priorities ORDER BY level DESC');
  
  res.json({
    success: true,
    data: priorities
  });
}));

module.exports = router; 