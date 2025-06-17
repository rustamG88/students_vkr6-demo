const jwt = require('jsonwebtoken');
const { db } = require('../database/json-db');

// Middleware для проверки JWT токена с поддержкой JSON БД
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
    
    // Проверяем, существует ли пользователь в JSON БД
    const users = await db.select('users', { id: decoded.userId });
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Проверяем, что пользователь активен
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }
    
    req.user = {
      userId: user.id,
      telegramId: user.telegram_id,
      teamId: user.team_id,
      isAdmin: user.is_admin,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name
    };
    
    // ВСЕГДА логируем информацию о токене для отладки
    console.log('🔐 JSON Token decoded:', { 
      userId: decoded.userId, 
      telegramId: decoded.telegramId,
      teamId: user.team_id,
      userFound: !!user,
      isActive: user.is_active
    });
    
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    console.error('❌ Error details:', error);
    console.error('❌ Token received:', token ? token.substring(0, 50) + '...' : 'null');
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token'
    });
  }
};

// Middleware для проверки прав администратора
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Administrator privileges required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed'
    });
  }
};

// Middleware для проверки владельца ресурса или админа
const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    const resourceId = parseInt(req.params.id);
    const userId = req.user.userId;
    
    // Админ может все
    if (req.user.isAdmin) {
      return next();
    }
    
    // Проверяем владение ресурсом (зависит от типа ресурса)
    const resourceType = req.route.path.includes('/tasks') ? 'task' : 'user';
    
    if (resourceType === 'task') {
      const tasks = await db.select('tasks', { id: resourceId });
      
      if (tasks.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      const task = tasks[0];
      if (task.created_by === userId || task.assigned_to === userId) {
        return next();
      }
    } else if (resourceType === 'user') {
      // Пользователь может редактировать только свой профиль
      if (resourceId === userId) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied: insufficient permissions'
    });
    
  } catch (error) {
    console.error('Owner/Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission check failed'
    });
  }
};

// Middleware для логирования запросов
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userId = req.user ? req.user.userId : 'anonymous';
  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${userId}`);
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
  logRequest
}; 