const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { apiRateLimit, strictRateLimit } = require('../middleware/security');
const { validateEmployee, validateId, validateSearchQuery, sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Get all employees with filters and pagination
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, validateSearchQuery, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { 
    search, 
    department, 
    company,
    position,
    is_active = 1,
    page = 1,
    limit = 20
  } = req.query;

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Calculate offset for pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build WHERE conditions with team isolation
  let whereConditions = ['u.is_active = ?', 'u.team_id = ?'];
  let queryParams = [is_active, teamId];

  if (search) {
    whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (department) {
    whereConditions.push('u.department = ?');
    queryParams.push(department);
  }

  if (company) {
    whereConditions.push('u.company = ?');
    queryParams.push(company);
  }

  if (position) {
    whereConditions.push('u.position LIKE ?');
    queryParams.push(`%${position}%`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users u
    WHERE ${whereClause}
  `;
  const [countResult] = await pool.query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get employees with pagination
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
      u.is_admin,
      u.created_at,
      (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status_id != 4) as active_tasks_count
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.first_name, u.last_name
    LIMIT ? OFFSET ?
  `;

  queryParams.push(parseInt(limit), parseInt(offset));
  const [employees] = await pool.query(query, queryParams);

  res.json({
    success: true,
    data: {
      employees,
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

// Get employee by ID
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const employeeId = req.params.id;

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  const [employees] = await pool.query(`
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
  `, [employeeId, teamId]);

  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: employees[0]
  });
}));

// Create new employee
router.post('/', strictRateLimit, sanitizeInput, authenticateToken, requireAdmin, validateEmployee, catchAsync(async (req, res) => {
  const { 
    first_name,
    last_name,
    email, 
    phone, 
    position, 
    company,
    department,
    is_admin = false,
    telegram_id = null,
    username = null
  } = req.body;

  // Check if employee with this email already exists
  if (email) {
    const [existingEmployees] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmployees.length > 0) {
      throw new AppError('Employee with this email already exists', 409, 'EMPLOYEE_ALREADY_EXISTS');
    }
  }

  // Create new employee
  const [result] = await pool.query(`
    INSERT INTO users (
      first_name, last_name, email, phone, position, company, department, 
      is_admin, telegram_id, username
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    first_name, last_name, email, phone, position, company, department,
    is_admin, telegram_id, username
  ]);

  // Get created employee
  const [newEmployee] = await pool.query(`
    SELECT 
      id, first_name, last_name, email, phone, position, company, department, 
      avatar_url, is_active, is_admin, created_at
    FROM users 
    WHERE id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    data: newEmployee[0],
    message: 'Employee created successfully'
  });
}));

// Update employee
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, validateId, requireOwnerOrAdmin, validateEmployee, catchAsync(async (req, res) => {
  const employeeId = req.params.id;
  const { first_name, last_name, email, phone, position, company, department } = req.body;

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];

  if (first_name !== undefined) {
    updateFields.push('first_name = ?');
    updateValues.push(first_name);
  }
  if (last_name !== undefined) {
    updateFields.push('last_name = ?');
    updateValues.push(last_name);
  }
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

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(employeeId);

  const [result] = await pool.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  if (result.affectedRows === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }

  // Get updated employee
  const [employees] = await pool.query(`
    SELECT 
      id, first_name, last_name, email, phone, position, company, department, 
      avatar_url, is_active, is_admin, created_at, updated_at
    FROM users
    WHERE id = ?
  `, [employeeId]);

  res.json({
    success: true,
    data: employees[0],
    message: 'Employee updated successfully'
  });
}));

// Delete employee (soft delete)
router.delete('/:id', strictRateLimit, sanitizeInput, authenticateToken, validateId, requireAdmin, catchAsync(async (req, res) => {
  const employeeId = req.params.id;
  const currentUserId = req.user.userId;

  // Prevent self-deletion
  if (parseInt(employeeId) === currentUserId) {
    throw new AppError('Cannot delete your own account', 400, 'SELF_DELETION_FORBIDDEN');
  }

  // Soft delete employee
  const [result] = await pool.query(
    'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
    [employeeId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Employee deleted successfully'
  });
}));

// Get departments list
router.get('/meta/departments', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [departments] = await pool.query(`
    SELECT DISTINCT department as name, COUNT(*) as count
    FROM users 
    WHERE department IS NOT NULL AND department != '' AND is_active = 1
    GROUP BY department
    ORDER BY department
  `);

  res.json({
    success: true,
    data: departments
  });
}));

// Get companies list
router.get('/meta/companies', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const [companies] = await pool.query(`
    SELECT DISTINCT company as name, COUNT(*) as count
    FROM users 
    WHERE company IS NOT NULL AND company != '' AND is_active = 1
    GROUP BY company
    ORDER BY company
  `);

  res.json({
    success: true,
    data: companies
  });
}));

// Get employees by department
router.get('/department/:department', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const department = req.params.department;

  const [employees] = await pool.query(`
    SELECT 
      id, first_name, last_name, position, email, phone, avatar_url
    FROM users
    WHERE department = ? AND is_active = 1
    ORDER BY first_name, last_name
  `, [department]);

  res.json({
    success: true,
    data: employees
  });
}));

// Get employees by company
router.get('/company/:company', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const company = req.params.company;

  const [employees] = await pool.query(`
    SELECT 
      id, first_name, last_name, position, company, department, email, phone, avatar_url
    FROM users
    WHERE company = ? AND is_active = 1
    ORDER BY first_name, last_name
  `, [company]);

  res.json({
    success: true,
    data: employees
  });
}));

// Generate invitation link
router.post('/invite', strictRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { is_admin = false } = req.body;
  const createdBy = req.user.userId;
  
  // Generate invitation token
  const inviteToken = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Store invitation in database (create invitations table if not exists)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) UNIQUE NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_by INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        used_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      )
    `);

    await pool.query(`
      INSERT INTO invitations (token, is_admin, created_by, expires_at)
      VALUES (?, ?, ?, ?)
    `, [inviteToken, is_admin, createdBy, expiresAt]);

  } catch (error) {
    console.error('Error storing invitation:', error);
    // Continue anyway for demo purposes
  }
  
  // Generate bot URL (replace with your actual bot username)
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot_name';
  const inviteLink = `https://t.me/${botUsername}?start=invite_${inviteToken}`;
  
  res.json({
    success: true,
    data: {
      inviteLink,
      inviteToken,
      expiresAt: expiresAt.toISOString(),
      isAdmin: is_admin
    },
    message: 'Invitation link generated successfully'
  });
}));

// Employee Notes API

// Get employee notes
router.get('/:id/notes', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const employeeId = req.params.id;
  const userId = req.user.userId;
  
  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Проверяем, что сотрудник из той же команды
  const [employee] = await pool.query('SELECT team_id FROM users WHERE id = ?', [employeeId]);
  
  if (!employee.length || employee[0].team_id !== teamId) {
    throw new AppError('Employee not found or access denied', 404, 'EMPLOYEE_NOT_FOUND');
  }

  // Получаем заметки о сотруднике
  const [notes] = await pool.query(`
    SELECT 
      en.id,
      en.text,
      en.created_at,
      u.first_name as author_first_name,
      u.last_name as author_last_name
    FROM employee_notes en
    LEFT JOIN users u ON en.created_by = u.id
    WHERE en.employee_id = ?
    ORDER BY en.created_at DESC
  `, [employeeId]);

  res.json({
    success: true,
    data: notes
  });
}));

// Add employee note
router.post('/:id/notes', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const employeeId = req.params.id;
  const userId = req.user.userId;
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    throw new AppError('Note text is required', 400, 'MISSING_TEXT');
  }

  if (text.length > 1000) {
    throw new AppError('Note text too long (max 1000 characters)', 400, 'TEXT_TOO_LONG');
  }

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Проверяем, что сотрудник из той же команды
  const [employee] = await pool.query('SELECT team_id FROM users WHERE id = ?', [employeeId]);
  
  if (!employee.length || employee[0].team_id !== teamId) {
    throw new AppError('Employee not found or access denied', 404, 'EMPLOYEE_NOT_FOUND');
  }

  // Создаем заметку
  const [result] = await pool.query(`
    INSERT INTO employee_notes (employee_id, text, created_by) 
    VALUES (?, ?, ?)
  `, [employeeId, text.trim(), userId]);

  // Получаем созданную заметку с данными автора
  const [newNote] = await pool.query(`
    SELECT 
      en.id,
      en.text,
      en.created_at,
      u.first_name as author_first_name,
      u.last_name as author_last_name
    FROM employee_notes en
    LEFT JOIN users u ON en.created_by = u.id
    WHERE en.id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    data: newNote[0],
    message: 'Note added successfully'
  });
}));

// Delete employee note
router.delete('/:id/notes/:noteId', apiRateLimit, sanitizeInput, authenticateToken, validateId, catchAsync(async (req, res) => {
  const employeeId = req.params.id;
  const noteId = req.params.noteId;
  const userId = req.user.userId;

  // Получаем team_id текущего пользователя для изоляции данных
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Проверяем права на удаление заметки (только автор или админ может удалить)
  const [note] = await pool.query(`
    SELECT en.created_by, u.team_id as employee_team_id
    FROM employee_notes en
    LEFT JOIN users u ON en.employee_id = u.id
    WHERE en.id = ? AND en.employee_id = ?
  `, [noteId, employeeId]);

  if (!note.length) {
    throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
  }

  if (note[0].employee_team_id !== teamId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  if (note[0].created_by !== userId) {
    // Проверяем, является ли пользователь админом
    const [adminCheck] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
    if (!adminCheck.length || !adminCheck[0].is_admin) {
      throw new AppError('Only note author or admin can delete this note', 403, 'ACCESS_DENIED');
    }
  }

  // Удаляем заметку
  const [result] = await pool.query('DELETE FROM employee_notes WHERE id = ?', [noteId]);

  if (result.affectedRows === 0) {
    throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

module.exports = router; 
