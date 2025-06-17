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
    message: 'JSON Teams API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get all teams (для совместимости с frontend)
router.get('/', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = req.user.teamId;
  if (!teamId) {
    return res.json({ success: true, data: [] });
  }
  
  const teams = await db.select('teams', { id: teamId });
  res.json({
    success: true,
    data: teams
  });
}));

// Get team by id
router.get('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const teams = await db.select('teams', { id: teamId });
  
  if (teams.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  res.json({
    success: true,
    data: teams[0]
  });
}));

// Update team
router.put('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.userId;
  
  // Проверяем права
  const teams = await db.select('teams', { id: teamId });
  if (teams.length === 0 || teams[0].owner_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  await db.update('teams', { id: teamId }, req.body);
  const updatedTeams = await db.select('teams', { id: teamId });
  
  res.json({
    success: true,
    data: updatedTeams[0]
  });
}));

// Delete team
router.delete('/:id', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.userId;
  
  // Проверяем права
  const teams = await db.select('teams', { id: teamId });
  if (teams.length === 0 || teams[0].owner_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  await db.delete('teams', { id: teamId });
  
  res.json({
    success: true,
    message: 'Team deleted'
  });
}));

// Get team members
router.get('/:id/members', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const members = await db.select('users', { team_id: teamId, is_active: true });
  
  res.json({
    success: true,
    data: members
  });
}));

// Add team member
router.post('/:id/members', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  // Заглушка - пока не реализовано
  res.json({
    success: true,
    message: 'Member addition not implemented yet'
  });
}));

// Remove team member
router.delete('/:id/members/:userId', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);
  const currentUserId = req.user.userId;
  
  // Проверяем права
  const teams = await db.select('teams', { id: teamId });
  if (teams.length === 0 || teams[0].owner_id !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Удаляем пользователя из команды
  await db.update('users', { id: targetUserId }, { team_id: null });
  
  res.json({
    success: true,
    message: 'Member removed from team'
  });
}));

// Generate invite
router.post('/:id/invite', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const teamId = parseInt(req.params.id);
  const teams = await db.select('teams', { id: teamId });
  
  if (teams.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      invite_code: teams[0].invite_code
    }
  });
}));

// Accept invite
router.post('/invite/accept', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const { code } = req.body;
  const userId = req.user.userId;
  
  const teams = await db.select('teams', { invite_code: code });
  if (teams.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Invalid invite code'
    });
  }
  
  await db.update('users', { id: userId }, { team_id: teams[0].id });
  
  res.json({
    success: true,
    message: 'Successfully joined team'
  });
}));

// Получить информацию о команде пользователя
router.get('/my-team', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;

  if (!teamId) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }

  // Получаем информацию о команде
  const teams = await db.select('teams', { id: teamId });
  
  if (teams.length === 0) {
    throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
  }
  
  const team = teams[0];

  // Получаем участников команды
  const members = await db.select('users', { team_id: teamId, is_active: true });
  
  // Получаем владельца команды
  const owners = await db.select('users', { id: team.owner_id });
  const owner = owners.length > 0 ? owners[0] : null;

  const teamData = {
    ...team,
    owner_first_name: owner ? owner.first_name : 'Unknown',
    owner_last_name: owner ? owner.last_name : '',
    owner_username: owner ? owner.username : '',
    members_count: members.length
  };

  const membersData = members.map(member => ({
    id: member.id,
    first_name: member.first_name,
    last_name: member.last_name,
    username: member.username,
    email: member.email,
    position: member.position,
    department: member.department,
    avatar_url: member.avatar_url,
    created_at: member.created_at
  }));

  res.json({
    success: true,
    data: {
      team: teamData,
      members: membersData
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
  const currentUsers = await db.select('users', { id: userId });
  const currentUser = currentUsers[0];
  
  if (currentUser.team_id) {
    throw new AppError('User already in a team', 400, 'ALREADY_IN_TEAM');
  }

  // Ищем команду по коду приглашения
  const teams = await db.select('teams', { invite_code: invite_code.toUpperCase() });
  
  if (teams.length === 0) {
    throw new AppError('Invalid invite code', 400, 'INVALID_INVITE_CODE');
  }

  const team = teams[0];

  // Добавляем пользователя в команду
  await db.update('users', { id: userId }, { team_id: team.id });

  res.json({
    success: true,
    message: `Successfully joined team: ${team.name}`,
    data: {
      team_id: team.id,
      team_name: team.name
    }
  });
}));

// Создать новую команду
router.post('/create', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  // Проверяем, что у пользователя нет команды
  const users = await db.select('users', { id: userId });
  if (users.length > 0 && users[0].team_id) {
    return res.status(400).json({
      success: false,
      message: 'User already has a team'
    });
  }
  
  const { name } = req.body;
  
  // Создаем команду
  const team = await db.insert('teams', {
    name: name || `Team ${userId}`,
    owner_id: userId,
    invite_code: Math.random().toString(36).substring(2, 8).toUpperCase()
  });
  
  // Присваиваем пользователю команду
  await db.update('users', { id: userId }, { team_id: team.id });
  
  res.json({
    success: true,
    data: team
  });
}));

// Сгенерировать новый код приглашения
router.post('/regenerate-invite', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;

  if (!teamId) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }

  // Проверяем, что пользователь - владелец команды
  const teams = await db.select('teams', { id: teamId });
  
  if (teams.length === 0 || teams[0].owner_id !== userId) {
    throw new AppError('Only team owner can regenerate invite code', 403, 'NOT_TEAM_OWNER');
  }

  // Генерируем новый уникальный код
  let inviteCode;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await db.select('teams', { invite_code: inviteCode });
    const existsInOtherTeam = existing.some(team => team.id !== teamId);
    if (!existsInOtherTeam) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError('Failed to generate unique invite code', 500, 'INVITE_CODE_ERROR');
  }

  // Обновляем код приглашения
  await db.update('teams', { id: teamId }, { invite_code: inviteCode });

  res.json({
    success: true,
    data: {
      invite_code: inviteCode
    },
    message: 'Invite code regenerated successfully'
  });
}));

// Удалить участника из команды
router.delete('/remove-member/:memberId', apiRateLimit, sanitizeInput, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  const memberId = parseInt(req.params.memberId);

  if (!teamId) {
    throw new AppError('User team not found', 400, 'TEAM_NOT_FOUND');
  }

  // Проверяем, что пользователь - владелец команды
  const teams = await db.select('teams', { id: teamId });
  
  if (teams.length === 0 || teams[0].owner_id !== userId) {
    throw new AppError('Only team owner can remove members', 403, 'NOT_TEAM_OWNER');
  }

  // Нельзя удалить самого себя
  if (memberId === userId) {
    throw new AppError('Cannot remove yourself from team', 400, 'CANNOT_REMOVE_SELF');
  }

  // Проверяем, что участник принадлежит команде
  const members = await db.select('users', { id: memberId, team_id: teamId });
  
  if (members.length === 0) {
    throw new AppError('Member not found in team', 404, 'MEMBER_NOT_FOUND');
  }

  // Удаляем участника из команды
  await db.update('users', { id: memberId }, { team_id: null });

  res.json({
    success: true,
    message: 'Member removed from team successfully'
  });
}));

// Generate secure invite link
router.post('/generate-invite', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const teamId = req.user.teamId;
  
  if (!teamId) {
    return res.status(400).json({
      success: false,
      message: 'User has no team'
    });
  }
  
  // Проверяем права (только владелец команды)
  const teams = await db.select('teams', { id: teamId });
  if (teams.length === 0 || teams[0].owner_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Only team owner can generate invites'
    });
  }
  
  // Генерируем JWT токен приглашения (действует 7 дней)
  const jwt = require('jsonwebtoken');
  const inviteToken = jwt.sign(
    { 
      teamId: teamId,
      inviterId: userId,
      type: 'team_invite'
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '7d' }
  );
  
  // Создаем ссылку приглашения
  const baseUrl = process.env.BACKEND_URL || 'https://your-app.ngrok-free.app';
  const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;
  
  res.json({
    success: true,
    data: {
      invite_token: inviteToken,
      invite_link: inviteLink,
      expires_in: '7 days'
    }
  });
}));

// Accept invite by token
router.post('/accept-invite', apiRateLimit, authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { invite_token } = req.body;
  
  if (!invite_token) {
    return res.status(400).json({
      success: false,
      message: 'Invite token is required'
    });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(invite_token, process.env.JWT_SECRET || 'test_secret_key');
    
    if (decoded.type !== 'team_invite') {
      throw new Error('Invalid token type');
    }
    
    const teamId = decoded.teamId;
    
    // Проверяем, что команда существует
    const teams = await db.select('teams', { id: teamId });
    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or invite expired'
      });
    }
    
    // Проверяем, что пользователь не в команде
    const users = await db.select('users', { id: userId });
    if (users.length > 0 && users[0].team_id) {
      return res.status(400).json({
        success: false,
        message: 'User already has a team'
      });
    }
    
    // Добавляем пользователя в команду
    await db.update('users', { id: userId }, { team_id: teamId });
    
    res.json({
      success: true,
      message: 'Successfully joined team',
      data: {
        team: teams[0]
      }
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired invite token',
      error: error.message
    });
  }
}));

module.exports = router; 