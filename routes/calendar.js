const express = require('express');
const { pool } = require('../database/db');
const { validateTelegramWebApp, extractTelegramUser } = require('../middleware/telegram');
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/security');
const { validateId, validateDate, sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Get tasks for calendar view
router.get('/tasks', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { 
    year, 
    month,
    date_from,
    date_to
  } = req.query;

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Build date filters with team isolation
  let whereConditions = ['(t.assigned_to = ? OR t.created_by = ?)', '(ua.team_id = ? OR uc.team_id = ?)'];
  let queryParams = [userId, userId, teamId, teamId];

  if (year && month) {
    // Get tasks for specific month
    whereConditions.push('YEAR(t.due_date) = ? AND MONTH(t.due_date) = ?');
    queryParams.push(parseInt(year), parseInt(month));
  } else if (date_from && date_to) {
    // Get tasks for date range
    whereConditions.push('DATE(t.due_date) BETWEEN ? AND ?');
    queryParams.push(date_from, date_to);
  } else if (date_from) {
    // Get tasks from specific date
    whereConditions.push('DATE(t.due_date) >= ?');
    queryParams.push(date_from);
  } else if (date_to) {
    // Get tasks until specific date
    whereConditions.push('DATE(t.due_date) <= ?');
    queryParams.push(date_to);
  }

  // Only get tasks with due dates
  whereConditions.push('t.due_date IS NOT NULL');

  const query = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.due_date,
      t.is_personal,
      ts.name as status_name,
      ts.color as status_color,
      tp.name as priority_name,
      tp.color as priority_color,
      tp.level as priority_level,
      ua.first_name as assigned_first_name,
      ua.last_name as assigned_last_name,
      uc.first_name as creator_first_name,
      uc.last_name as creator_last_name,
      DATE(t.due_date) as due_date_only,
      TIME(t.due_date) as due_time_only
    FROM tasks t
    LEFT JOIN task_statuses ts ON t.status_id = ts.id
    LEFT JOIN task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN users ua ON t.assigned_to = ua.id
    LEFT JOIN users uc ON t.created_by = uc.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY t.due_date ASC
  `;

  const [tasks] = await pool.query(query, queryParams);

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(task => {
    const dateKey = task.due_date_only;
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  res.json({
    success: true,
    data: {
      tasks: tasks,
      tasksByDate: tasksByDate,
      totalTasks: tasks.length
    }
  });
}));

// Get tasks for specific date
router.get('/date/:date', apiRateLimit, sanitizeInput, authenticateToken, validateDate, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.params; // Format: YYYY-MM-DD

  const query = `
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
    WHERE DATE(t.due_date) = ? 
      AND (t.assigned_to = ? OR t.created_by = ?)
    ORDER BY 
      TIME(t.due_date) ASC,
      tp.level DESC,
      t.created_at DESC
  `;

  const [tasks] = await pool.query(query, [date, userId, userId]);

  res.json({
    success: true,
    data: tasks,
    date: date
  });
}));

// Get calendar overview (task counts by status for month)
router.get('/overview', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { 
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1
  } = req.query;

  // Get task counts by status for the month
  const [statusCounts] = await pool.query(`
    SELECT 
      ts.name as status_name,
      ts.color as status_color,
      COUNT(t.id) as task_count
    FROM task_statuses ts
    LEFT JOIN tasks t ON ts.id = t.status_id 
      AND YEAR(t.due_date) = ? 
      AND MONTH(t.due_date) = ?
      AND (t.assigned_to = ? OR t.created_by = ?)
    GROUP BY ts.id, ts.name, ts.color
    ORDER BY ts.id
  `, [year, month, userId, userId]);

  // Get overdue tasks count
  const [overdueTasks] = await pool.query(`
    SELECT COUNT(*) as overdue_count
    FROM tasks t
    WHERE t.due_date < NOW()
      AND t.status_id != 4  -- Not 'Done'
      AND (t.assigned_to = ? OR t.created_by = ?)
  `, [userId, userId]);

  // Get upcoming tasks (next 7 days)
  const [upcomingTasks] = await pool.query(`
    SELECT COUNT(*) as upcoming_count
    FROM tasks t
    WHERE t.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND t.status_id != 4  -- Not 'Done'
      AND (t.assigned_to = ? OR t.created_by = ?)
  `, [userId, userId]);

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      month: parseInt(month),
      statusCounts: statusCounts,
      overdueTasks: overdueTasks[0].overdue_count,
      upcomingTasks: upcomingTasks[0].upcoming_count
    }
  });
}));

// Get tasks with no due date
router.get('/no-date', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const query = `
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
    WHERE t.due_date IS NULL 
      AND (t.assigned_to = ? OR t.created_by = ?)
    ORDER BY 
      tp.level DESC,
      t.created_at DESC
  `;

  const [tasks] = await pool.query(query, [userId, userId]);

  res.json({
    success: true,
    data: tasks
  });
}));

// Add task to calendar (set due_date)
router.patch('/tasks/:id/schedule', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;
  const { due_date } = req.body;

  // Validate due_date format
  if (!due_date || !Date.parse(due_date)) {
    throw new AppError('Valid due_date is required', 400, 'INVALID_DATE');
  }

  // Check if user has access to this task
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  // Update task due_date
  // Преобразуем ISO дату в формат YYYY-MM-DD HH:MM:SS для MySQL
  let formattedDueDate = due_date;
  if (due_date && due_date.includes('T')) {
    const date = new Date(due_date);
    formattedDueDate = date.toISOString().slice(0, 19).replace('T', ' ');
  }

  const [result] = await pool.query(
    'UPDATE tasks SET due_date = ?, updated_at = NOW() WHERE id = ?',
    [formattedDueDate, taskId]
  );

  res.json({
    success: true,
    message: 'Task scheduled successfully',
    data: {
      task_id: taskId,
      due_date: due_date
    }
  });
}));

// Update task status from calendar
router.patch('/tasks/:id/status', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;
  const { status_id } = req.body;

  // Validate status_id
  if (!status_id || !Number.isInteger(status_id) || status_id < 1 || status_id > 5) {
    throw new AppError('Valid status_id (1-5) is required', 400, 'INVALID_STATUS');
  }

  // Check if user has access to this task
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  // Update task status
  const [result] = await pool.query(
    'UPDATE tasks SET status_id = ?, updated_at = NOW() WHERE id = ?',
    [status_id, taskId]
  );

  // If task is completed, set completed_at
  if (status_id === 4) { // Assuming 4 is "Done" status
    await pool.query(
      'UPDATE tasks SET completed_at = NOW() WHERE id = ?',
      [taskId]
    );
  }

  res.json({
    success: true,
    message: 'Task status updated successfully'
  });
}));

// Remove task from calendar (set due_date to NULL)
router.delete('/tasks/:id/schedule', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;

  // Check if user has access to this task
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  // Remove task from calendar (set due_date to NULL)
  const [result] = await pool.query(
    'UPDATE tasks SET due_date = NULL, updated_at = NOW() WHERE id = ?',
    [taskId]
  );

  res.json({
    success: true,
    message: 'Task removed from calendar successfully'
  });
}));

// Update task priority from calendar
router.patch('/tasks/:id/priority', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;
  const { priority_id } = req.body;

  // Validate priority_id
  if (!priority_id || !Number.isInteger(priority_id) || priority_id < 1 || priority_id > 3) {
    throw new AppError('Valid priority_id (1-3) is required', 400, 'INVALID_PRIORITY');
  }

  // Check if user has access to this task and if it's personal
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?) AND (is_personal = 1 OR assigned_to = ?)',
    [taskId, userId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found, access denied, or cannot change priority for non-personal task', 404, 'TASK_NOT_FOUND');
  }

  // Update task priority
  const [result] = await pool.query(
    'UPDATE tasks SET priority_id = ?, updated_at = NOW() WHERE id = ?',
    [priority_id, taskId]
  );

  res.json({
    success: true,
    message: 'Task priority updated successfully'
  });
}));

// Get employee notes for a task
router.get('/tasks/:id/notes', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const taskId = req.params.id;

  // Check if user has access to this task
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  // Get notes for this task
  const [notes] = await pool.query(`
    SELECT 
      tn.id,
      tn.note_text as text,
      tn.created_at as createdAt,
      tn.created_by as userId,
      u.first_name,
      u.last_name,
      u.username
    FROM task_notes tn
    LEFT JOIN users u ON tn.created_by = u.id
    WHERE tn.task_id = ?
    ORDER BY tn.created_at DESC
  `, [taskId]);

  res.json({
    success: true,
    data: notes
  });
}));

// Save employee note for a task
router.post('/tasks/notes', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { taskId, text, employeeId } = req.body;

  // Validate required fields
  if (!taskId || !text || !text.trim()) {
    throw new AppError('Task ID and note text are required', 400, 'MISSING_FIELDS');
  }

  // Check if user has access to this task
  const [tasks] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND (assigned_to = ? OR created_by = ?)',
    [taskId, userId, userId]
  );

  if (tasks.length === 0) {
    throw new AppError('Task not found or access denied', 404, 'TASK_NOT_FOUND');
  }

  // Create task_notes table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      note_text TEXT NOT NULL,
      employee_id INT,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert the note
  const [result] = await pool.query(
    'INSERT INTO task_notes (task_id, note_text, employee_id, created_by) VALUES (?, ?, ?, ?)',
    [taskId, text.trim(), employeeId || null, userId]
  );

  res.json({
    success: true,
    message: 'Note saved successfully',
    data: {
      id: result.insertId,
      userId: userId
    }
  });
}));

// Delete employee note
router.delete('/tasks/notes/:noteId', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const noteId = req.params.noteId;

  // Check if note exists and user has permission to delete it
  const [notes] = await pool.query(
    'SELECT * FROM task_notes WHERE id = ? AND created_by = ?',
    [noteId, userId]
  );

  if (notes.length === 0) {
    throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
  }

  // Delete the note
  await pool.query('DELETE FROM task_notes WHERE id = ?', [noteId]);

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

module.exports = router;
