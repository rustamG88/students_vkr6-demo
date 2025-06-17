const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Автоматически найдет .env в корне проекта

// Import security and error handling middleware
const { corsOptions, helmetConfig, ipWhitelist, securityLogger, telegramCorsMiddleware } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');
const { globalErrorHandler, handleNotFound } = require('./middleware/errorHandler');

const app = express();

// Trust proxy для работы с Railway и reverse proxy
app.set('trust proxy', 1);

// Security Middleware (order matters!)
app.use(helmetConfig);
app.use(cors(corsOptions));

// Telegram CORS middleware - явные заголовки для мобильных приложений
app.use(telegramCorsMiddleware);

app.use(ipWhitelist);
app.use(securityLogger);

// Глобальная обработка OPTIONS запросов для мобильных клиентов Telegram
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Access-Token, X-Key, X-Auth-Token, X-Telegram-Init-Data, X-Telegram-Bot-Api-Secret-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Global input sanitization
app.use(sanitizeInput);

// Serve static files (uploaded avatars)
app.use('/uploads', express.static('uploads'));

// Serve debug page
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-page.html'));
});

// Serve Telegram debug page
app.get('/telegram-debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'telegram-debug.html'));
});

// Serve frontend static files
app.use(express.static('frontend/dist'));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

// Логирование всех API запросов
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('[API] Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[API] Body:', req.body);
  }
  next();
});

// API Routes - используем JSON версии
app.use('/api/auth-json', require('./routes/auth-json'));
app.use('/api/users-json', require('./routes/users-json'));
app.use('/api/employees-json', require('./routes/employees-json'));
app.use('/api/tasks-json', require('./routes/tasks-json'));
app.use('/api/teams-json', require('./routes/teams-json'));
app.use('/api/calendar-json', require('./routes/calendar-json'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/notifications', require('./routes/notifications-api'));

// Telegram webhook
app.use('/webhook', require('./routes/telegram'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Telegram MiniApp Backend',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Quick API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    telegram: 'Mini App Backend Ready',
    cors: 'Enabled for Telegram',
    origin: req.get('Origin') || 'No origin header',
    userAgent: req.get('User-Agent') || 'No user agent'
  });
});

// Telegram Mini App specific test
app.get('/telegram-test', (req, res) => {
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    message: 'Telegram Mini App Backend Ready!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      userAgent: req.get('User-Agent')
    },
    telegram: {
      supportedDomains: [
        'https://miniapp.tg.dev',
        'https://web.telegram.org',
        'https://k.tg'
      ],
      baseUrl: baseUrl
    }
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Telegram MiniApp API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/start': 'Start authentication with Telegram WebApp',
        'POST /api/auth/complete-profile': 'Complete user profile after registration',
        'GET /api/auth/validate': 'Validate JWT token'
      },
      users: {
        'GET /api/users': 'Get all users with pagination and filters',
        'GET /api/users/:id': 'Get user profile by ID',
        'GET /api/users/profile/me': 'Get current user profile',
        'PUT /api/users/:id': 'Update user profile (owner or admin only)',
        'PUT /api/users/profile/me': 'Update current user profile',
        'POST /api/users': 'Create new user (admin only)',
        'DELETE /api/users/:id': 'Deactivate user (admin only)',
        'PATCH /api/users/:id/activate': 'Reactivate user (admin only)',
        'GET /api/users/meta/departments': 'Get departments list',
        'GET /api/users/meta/positions': 'Get positions list',
        'GET /api/users/meta/stats': 'Get user statistics (admin only)'
      },
      employees: {
        'GET /api/employees': 'Get all employees with pagination and filters',
        'GET /api/employees/:id': 'Get employee profile by ID',
        'POST /api/employees': 'Create new employee (admin only)',
        'PUT /api/employees/:id': 'Update employee profile (owner or admin only)',
        'DELETE /api/employees/:id': 'Delete employee (admin only)',
        'GET /api/employees/meta/departments': 'Get departments list',
        'GET /api/employees/department/:department': 'Get employees by department',
        'POST /api/employees/invite': 'Generate invitation link (admin only)'
      },
      tasks: {
        'GET /api/tasks': 'Get tasks with pagination and filters',
        'POST /api/tasks': 'Create new task',
        'GET /api/tasks/:id': 'Get single task',
        'PUT /api/tasks/:id': 'Update task (owner or admin only)',
        'PATCH /api/tasks/:id/status': 'Update task status',
        'DELETE /api/tasks/:id': 'Delete task (owner or admin only)',
        'GET /api/tasks/meta/types': 'Get task types',
        'GET /api/tasks/meta/statuses': 'Get task statuses',
        'GET /api/tasks/meta/priorities': 'Get task priorities'
      },
      teams: {
        'GET /api/teams/my-team': 'Get current user team info and members',
        'POST /api/teams/create': 'Create new team (if user not in team)',
        'POST /api/teams/join': 'Join team by invite code',
        'POST /api/teams/regenerate-invite': 'Regenerate invite code (owner only)',
        'DELETE /api/teams/remove-member/:memberId': 'Remove member from team (owner only)'
      },
      calendar: {
        'GET /api/calendar/tasks': 'Get calendar tasks by date/month',
        'GET /api/calendar/events': 'Get calendar events'
      }
    },
    authentication: {
      method: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'All endpoints except /auth/start require authentication'
    }
  });
});

// Invite handler endpoint
app.get('/invite', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect('/?error=invalid_invite');
  }
  
  // Перенаправляем на фронтенд с токеном приглашения
  res.redirect(`/?invite_token=${encodeURIComponent(token)}`);
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Handle 404 routes for API
app.use(handleNotFound);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

module.exports = app; 