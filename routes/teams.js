const express = require('express');
const { pool } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const router = express.Router();

// Получить информацию о команде пользователя
router.get('/my-team', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Получаем информацию о команде
  const [teams] = await pool.query(`
    SELECT 
      t.id,
      t.name,
      t.invite_code,
      t.owner_id,
      t.created_at,
      u.first_name as owner_first_name,
      u.last_name as owner_last_name,
      u.username as owner_username,
      (SELECT COUNT(*) FROM users WHERE team_id = t.id AND is_active = 1) as members_count
    FROM teams t
    LEFT JOIN users u ON t.owner_id = u.id
    WHERE t.id = ?
  `, [teamId]);

  if (!teams.length) {
    throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
  }

  // Получаем участников команды
  const [members] = await pool.query(`
    SELECT 
      id,
      first_name,
      last_name,
      username,
      email,
      position,
      department,
      avatar_url,
      created_at
    FROM users 
    WHERE team_id = ? AND is_active = 1
    ORDER BY first_name, last_name
  `, [teamId]);

  res.json({
    success: true,
    data: {
      team: teams[0],
      members: members
    }
  });
}));

// Присоединиться к команде по коду приглашения
router.post('/join', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { invite_code } = req.body;

  if (!invite_code) {
    throw new AppError('Invite code is required', 400, 'INVITE_CODE_REQUIRED');
  }

  // Проверяем, что пользователь еще не в команде
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (currentUser.length && currentUser[0].team_id) {
    throw new AppError('User already in a team', 400, 'ALREADY_IN_TEAM');
  }

  // Ищем команду по коду приглашения
  const [teams] = await pool.query('SELECT id, name FROM teams WHERE invite_code = ?', [invite_code.toUpperCase()]);
  
  if (!teams.length) {
    throw new AppError('Invalid invite code', 400, 'INVALID_INVITE_CODE');
  }

  const teamId = teams[0].id;

  // Добавляем пользователя в команду
  await pool.query('UPDATE users SET team_id = ? WHERE id = ?', [teamId, userId]);

  res.json({
    success: true,
    message: `Successfully joined team: ${teams[0].name}`,
    data: {
      team_id: teamId,
      team_name: teams[0].name
    }
  });
}));

// Создать новую команду (если пользователь не в команде)
router.post('/create', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { team_name } = req.body;

  if (!team_name || team_name.trim().length < 2) {
    throw new AppError('Team name must be at least 2 characters', 400, 'INVALID_TEAM_NAME');
  }

  // Проверяем, что пользователь еще не в команде
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (currentUser.length && currentUser[0].team_id) {
    throw new AppError('User already in a team', 400, 'ALREADY_IN_TEAM');
  }

  // Генерируем уникальный код приглашения
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [existing] = await pool.query('SELECT id FROM teams WHERE invite_code = ?', [inviteCode]);
    if (!existing.length) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError('Failed to generate unique invite code', 500, 'INVITE_CODE_ERROR');
  }

  // Создаем команду
  const [result] = await pool.query(
    'INSERT INTO teams (name, owner_id, invite_code) VALUES (?, ?, ?)',
    [team_name.trim(), userId, inviteCode]
  );

  const teamId = result.insertId;

  // Добавляем создателя в команду
  await pool.query('UPDATE users SET team_id = ? WHERE id = ?', [teamId, userId]);

  res.json({
    success: true,
    message: 'Team created successfully',
    data: {
      team_id: teamId,
      team_name: team_name.trim(),
      invite_code: inviteCode
    }
  });
}));

// Сгенерировать новый код приглашения (только для владельца команды)
router.post('/regenerate-invite', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  // Получаем команду пользователя
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Проверяем, что пользователь - владелец команды
  const [teams] = await pool.query('SELECT owner_id FROM teams WHERE id = ?', [teamId]);
  
  if (!teams.length || teams[0].owner_id !== userId) {
    throw new AppError('Only team owner can regenerate invite code', 403, 'NOT_TEAM_OWNER');
  }

  // Генерируем новый уникальный код
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [existing] = await pool.query('SELECT id FROM teams WHERE invite_code = ? AND id != ?', [inviteCode, teamId]);
    if (!existing.length) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError('Failed to generate unique invite code', 500, 'INVITE_CODE_ERROR');
  }

  // Обновляем код приглашения
  await pool.query('UPDATE teams SET invite_code = ? WHERE id = ?', [inviteCode, teamId]);

  res.json({
    success: true,
    message: 'Invite code regenerated successfully',
    data: {
      invite_code: inviteCode
    }
  });
}));

// Удалить пользователя из команды (только для владельца)
router.delete('/remove-member/:memberId', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const memberId = parseInt(req.params.memberId);

  if (!memberId) {
    throw new AppError('Invalid member ID', 400, 'INVALID_MEMBER_ID');
  }

  // Получаем команду пользователя
  const [currentUser] = await pool.query('SELECT team_id FROM users WHERE id = ?', [userId]);
  
  if (!currentUser.length || !currentUser[0].team_id) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }
  
  const teamId = currentUser[0].team_id;

  // Проверяем, что пользователь - владелец команды
  const [teams] = await pool.query('SELECT owner_id FROM teams WHERE id = ?', [teamId]);
  
  if (!teams.length || teams[0].owner_id !== userId) {
    throw new AppError('Only team owner can remove members', 403, 'NOT_TEAM_OWNER');
  }

  // Проверяем, что удаляемый пользователь в той же команде
  const [member] = await pool.query('SELECT id, first_name, last_name FROM users WHERE id = ? AND team_id = ?', [memberId, teamId]);
  
  if (!member.length) {
    throw new AppError('Member not found in team', 404, 'MEMBER_NOT_FOUND');
  }

  // Нельзя удалить самого себя
  if (memberId === userId) {
    throw new AppError('Team owner cannot remove themselves', 400, 'CANNOT_REMOVE_OWNER');
  }

  // Удаляем пользователя из команды
  await pool.query('UPDATE users SET team_id = NULL WHERE id = ?', [memberId]);

  res.json({
    success: true,
    message: `Member ${member[0].first_name} ${member[0].last_name} removed from team`
  });
}));

module.exports = router; 