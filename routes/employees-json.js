const express = require('express');
const { db } = require('../database/json-db');
const { authenticateToken, requireAdmin } = require('./auth-middleware-json');
const { apiRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'JSON Employees API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get all employees
router.get('/', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  const { department, position, is_active = true } = req.query;
  
  let filter = { team_id: teamId };
  
  if (department) filter.department = department;
  if (position) filter.position = position;
  if (is_active !== undefined) filter.is_active = is_active === 'true';
  
  const employees = await db.select('employees', filter);
  
  res.json({
    success: true,
    data: employees
  });
}));

// Get employee by id
router.get('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const employees = await db.select('employees', { id: employeeId, team_id: teamId });
  
  if (employees.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  res.json({
    success: true,
    data: employees[0]
  });
}));

// Create employee
router.post('/', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  
  const employeeData = {
    ...req.body,
    team_id: teamId,
    created_by: userId,
    created_at: new Date().toISOString(),
    is_active: true
  };
  
  const employee = await db.insert('employees', employeeData);
  
  res.json({
    success: true,
    data: employee
  });
}));

// Update employee
router.put('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const employees = await db.select('employees', { id: employeeId, team_id: teamId });
  
  if (employees.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  const updateData = { ...req.body };
  updateData.updated_at = new Date().toISOString();
  
  await db.update('employees', { id: employeeId }, updateData);
  const updatedEmployees = await db.select('employees', { id: employeeId });
  
  res.json({
    success: true,
    data: updatedEmployees[0]
  });
}));

// Delete employee (soft delete)
router.delete('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const employees = await db.select('employees', { id: employeeId, team_id: teamId });
  
  if (employees.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  // Soft delete
  await db.update('employees', { id: employeeId }, { 
    is_active: false,
    updated_at: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Employee deactivated'
  });
}));

// Get employee notes
router.get('/:id/notes', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  // Проверяем доступ к сотруднику
  const employees = await db.select('employees', { id: employeeId, team_id: teamId });
  if (employees.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  const notes = await db.select('employee_notes', { employee_id: employeeId });
  
  res.json({
    success: true,
    data: notes
  });
}));

// Add employee note
router.post('/:id/notes', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  const userId = req.user.userId;
  const { content, note_type = 'general' } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Note content is required'
    });
  }
  
  // Проверяем доступ к сотруднику
  const employees = await db.select('employees', { id: employeeId, team_id: teamId });
  if (employees.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found'
    });
  }
  
  const note = await db.insert('employee_notes', {
    employee_id: employeeId,
    created_by: userId,
    content: content.trim(),
    note_type,
    created_at: new Date().toISOString()
  });
  
  res.json({
    success: true,
    data: note
  });
}));

// Get departments (уникальные из сотрудников)
router.get('/departments/list', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const employees = await db.select('employees', { team_id: teamId, is_active: true });
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  
  res.json({
    success: true,
    data: departments
  });
}));

// Get positions (уникальные из сотрудников)
router.get('/positions/list', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const employees = await db.select('employees', { team_id: teamId, is_active: true });
  const positions = [...new Set(employees.map(emp => emp.position).filter(Boolean))];
  
  res.json({
    success: true,
    data: positions
  });
}));

// Получить всех сотрудников команды
router.get('/', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const { 
    search, 
    department, 
    company,
    position,
    is_active = 1,
    page = 1,
    limit = 20
  } = req.query;

  // Получаем сотрудников только из команды текущего пользователя
  let employees = await db.select('users', { team_id: teamId });
  
  // Применяем фильтры
  if (search) {
    const searchLower = search.toLowerCase();
    employees = employees.filter(emp => 
      (emp.first_name && emp.first_name.toLowerCase().includes(searchLower)) ||
      (emp.last_name && emp.last_name.toLowerCase().includes(searchLower)) ||
      (emp.username && emp.username.toLowerCase().includes(searchLower)) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower))
    );
  }
  
  if (department) {
    employees = employees.filter(emp => emp.department === department);
  }
  
  if (company) {
    employees = employees.filter(emp => emp.company === company);
  }
  
  if (position) {
    employees = employees.filter(emp => emp.position && emp.position.toLowerCase().includes(position.toLowerCase()));
  }
  
  if (is_active !== undefined) {
    employees = employees.filter(emp => emp.is_active === Boolean(parseInt(is_active)));
  }
  
  // Сортировка по имени
  employees.sort((a, b) => {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
    return nameA.localeCompare(nameB);
  });
  
  // Добавляем статистику по задачам
  const allTasks = await db.select('tasks');
  const enrichedEmployees = employees.map(emp => {
    const empTasks = allTasks.filter(task => task.assigned_to === emp.id);
    const activeTasks = empTasks.filter(task => task.status_id !== 4);
    
    return {
      id: emp.id,
      telegram_id: emp.telegram_id,
      username: emp.username,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      company: emp.company,
      department: emp.department,
      avatar_url: emp.avatar_url,
      is_active: emp.is_active,
      is_admin: emp.is_admin,
      created_at: emp.created_at,
      active_tasks_count: activeTasks.length
    };
  });
  
  // Пагинация
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginatedEmployees = enrichedEmployees.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    data: {
      employees: paginatedEmployees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrichedEmployees.length,
        totalPages: Math.ceil(enrichedEmployees.length / parseInt(limit)),
        hasNext: offset + parseInt(limit) < enrichedEmployees.length,
        hasPrev: parseInt(page) > 1
      }
    }
  });
}));

// Получить сотрудника по ID
router.get('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  const employees = await db.select('users', { id: employeeId, team_id: teamId, is_active: true });
  
  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  
  const employee = employees[0];
  
  // Получаем статистику по задачам
  const allTasks = await db.select('tasks');
  const assignedTasks = allTasks.filter(task => task.assigned_to === employee.id);
  const createdTasks = allTasks.filter(task => task.created_by === employee.id);
  const completedTasks = assignedTasks.filter(task => task.status_id === 4);
  
  const enrichedEmployee = {
    ...employee,
    total_tasks: assignedTasks.length,
    completed_tasks: completedTasks.length,
    created_tasks: createdTasks.length
  };
  
  res.json({
    success: true,
    data: enrichedEmployee
  });
}));

// Создать нового сотрудника (только для админа)
router.post('/', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
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

  // Проверяем уникальность email
  if (email) {
    const existingEmployees = await db.select('users', { email: email });
    if (existingEmployees.length > 0) {
      throw new AppError('Employee with this email already exists', 409, 'EMPLOYEE_ALREADY_EXISTS');
    }
  }

  // Создаем нового сотрудника
  const newEmployee = await db.insert('users', {
    first_name, 
    last_name, 
    email, 
    phone, 
    position, 
    company, 
    department,
    is_admin: Boolean(is_admin), 
    telegram_id, 
    username,
    team_id: teamId,
    is_active: true
  });

  res.json({
    success: true,
    data: newEmployee,
    message: 'Employee created successfully'
  });
}));

// Обновить сотрудника
router.put('/:id', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  const isAdmin = req.user.isAdmin;
  
  // Только админ или сам пользователь может редактировать профиль
  if (!isAdmin && employeeId !== userId) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  const employees = await db.select('users', { id: employeeId, team_id: teamId });
  
  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  
  const {
    first_name,
    last_name,
    email,
    phone,
    position,
    company,
    department,
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
  if (company !== undefined) updateData.company = company;
  if (department !== undefined) updateData.department = department;
  if (bio !== undefined) updateData.bio = bio;
  if (birthday !== undefined) updateData.birthday = birthday;
  
  // Только админы могут изменять права администратора
  if (is_admin !== undefined && isAdmin) {
    updateData.is_admin = Boolean(is_admin);
  }
  
  // Проверяем уникальность email
  if (email) {
    const existingUsers = await db.select('users', { email: email });
    const emailExists = existingUsers.some(user => user.id !== employeeId);
    if (emailExists) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }
  }
  
  await db.update('users', { id: employeeId }, updateData);
  
  // Получаем обновленного сотрудника
  const updatedEmployees = await db.select('users', { id: employeeId });
  
  res.json({
    success: true,
    data: updatedEmployees[0],
    message: 'Employee updated successfully'
  });
}));

// Удалить сотрудника (только для админа)
router.delete('/:id', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  if (employeeId === userId) {
    throw new AppError('Cannot delete yourself', 400, 'CANNOT_DELETE_SELF');
  }
  
  const employees = await db.select('users', { id: employeeId, team_id: teamId });
  
  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  
  // Деактивируем вместо удаления
  await db.update('users', { id: employeeId }, { is_active: false });
  
  res.json({
    success: true,
    message: 'Employee deleted successfully'
  });
}));

// Получить отделы
router.get('/meta/departments', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  
  const employees = await db.select('users', { team_id: teamId });
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();
  
  res.json({
    success: true,
    data: departments
  });
}));

// Получить сотрудников по отделу
router.get('/department/:department', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const department = req.params.department;
  const teamId = req.user.teamId;
  
  const employees = await db.select('users', { team_id: teamId, department: department, is_active: true });
  
  res.json({
    success: true,
    data: employees
  });
}));

// Заметки о сотрудниках - получить
router.get('/:id/notes', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const teamId = req.user.teamId;
  
  // Проверяем, что сотрудник из той же команды
  const employees = await db.select('users', { id: employeeId, team_id: teamId });
  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  
  const notes = await db.select('employee_notes', { employee_id: employeeId });
  
  // Получаем информацию об авторах заметок
  const users = await db.select('users');
  const enrichedNotes = notes.map(note => {
    const author = users.find(u => u.id === note.created_by) || {};
    return {
      ...note,
      author_first_name: author.first_name || 'Unknown',
      author_last_name: author.last_name || '',
      author_username: author.username || ''
    };
  });
  
  res.json({
    success: true,
    data: enrichedNotes
  });
}));

// Заметки о сотрудниках - добавить
router.post('/:id/notes', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const employeeId = parseInt(req.params.id);
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  const { text } = req.body;
  
  if (!text || text.trim().length === 0) {
    throw new AppError('Note text is required', 400, 'TEXT_REQUIRED');
  }
  
  // Проверяем, что сотрудник из той же команды
  const employees = await db.select('users', { id: employeeId, team_id: teamId });
  if (employees.length === 0) {
    throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  
  const newNote = await db.insert('employee_notes', {
    employee_id: employeeId,
    text: text.trim(),
    created_by: userId
  });
  
  res.json({
    success: true,
    data: newNote,
    message: 'Note added successfully'
  });
}));

// Заметки о сотрудниках - удалить
router.delete('/:id/notes/:noteId', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const noteId = parseInt(req.params.noteId);
  const userId = req.user.userId;
  const isAdmin = req.user.isAdmin;
  
  const notes = await db.select('employee_notes', { id: noteId });
  
  if (notes.length === 0) {
    throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
  }
  
  const note = notes[0];
  
  // Только автор заметки или админ может удалить
  if (note.created_by !== userId && !isAdmin) {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }
  
  await db.delete('employee_notes', { id: noteId });
  
  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

module.exports = router; 