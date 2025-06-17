const jwt = require('jsonwebtoken');
const { pool } = require('../database/db');

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
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
    req.user = decoded;
    
    // В режиме разработки логируем информацию о токене
    if (process.env.NODE_ENV === 'development') {
      console.log('Token decoded:', { userId: decoded.userId, telegramId: decoded.telegramId });
    }
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
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
    const [users] = await pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!users[0].is_admin) {
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
    const resourceId = req.params.id;
    const userId = req.user.userId;
    
    // Проверяем, является ли пользователь админом
    const [adminCheck] = await pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (adminCheck.length && adminCheck[0].is_admin) {
      return next(); // Админ может все
    }
    
    // Проверяем владение ресурсом (зависит от типа ресурса)
    const resourceType = req.route.path.includes('/tasks') ? 'task' : 'user';
    
    if (resourceType === 'task') {
      const [tasks] = await pool.query(
        'SELECT created_by, assigned_to FROM tasks WHERE id = ?',
        [resourceId]
      );
      
      if (!tasks.length) {
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
      if (parseInt(resourceId) === userId) {
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