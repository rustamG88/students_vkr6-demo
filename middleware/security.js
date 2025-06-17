const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting для API endpoints
const createRateLimit = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Пропускаем rate limiting для локальных запросов в development
      return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
    }
  });
};

// Различные лимиты для разных типов запросов
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 минут
  process.env.NODE_ENV === 'development' ? 50 : 5, // 50 попыток в dev, 5 в prod
  'Too many authentication attempts, please try again later'
);

const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 минут
  100, // 100 запросов
  'API rate limit exceeded'
);

const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 минут
  10, // 10 запросов для критических операций
  'Rate limit exceeded for this operation'
);

// CORS настройки - специально для Telegram Mini App
const corsOptions = {
  origin: [
    'https://miniapp.tg.dev', // Основной домен Telegram Mini App
    'https://web.telegram.org',
    'https://k.tg',
    // Добавляем URL из переменных окружения
    ...(process.env.BACKEND_URL ? [process.env.BACKEND_URL] : []),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()) : []),
    'http://localhost:5173',
    'http://localhost:3000',
    // Разрешаем все telegram домены
    /^https:\/\/.*\.telegram\.org$/,
    /^https:\/\/.*\.tg$/,
    /^https:\/\/.*\.ngrok\.app$/,
    /^https:\/\/.*\.ngrok-free\.app$/,
    /^https:\/\/.*\.up\.railway\.app$/  // Railway домены
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Telegram-Init-Data',
    'X-Telegram-Bot-Api-Secret-Token'
  ],
  maxAge: 86400 // 24 часа для preflight кэширования
};

// Middleware для явной установки CORS заголовков для Telegram
const telegramCorsMiddleware = (req, res, next) => {
  // Явно устанавливаем заголовки для мобильных приложений Telegram
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Access-Token, X-Key, X-Auth-Token, X-Telegram-Init-Data, X-Telegram-Bot-Api-Secret-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 часа
  
  // Обработка OPTIONS запросов
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

// Helmet настройки - ОТКЛЮЧАЕМ CSP полностью!
const helmetConfig = helmet({
  contentSecurityPolicy: false, // ПОЛНОСТЬЮ ОТКЛЮЧАЕМ CSP
  crossOriginEmbedderPolicy: false, // Для совместимости с Telegram WebApp
  crossOriginResourcePolicy: false, // Отключаем для загрузки аватаров
  crossOriginOpenerPolicy: false
});

// Middleware для проверки IP-адресов (базовая защита)
const ipWhitelist = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const clientIP = req.ip || req.connection.remoteAddress;
    const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
    
    if (blockedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from your IP address'
      });
    }
  }
  next();
};

// Middleware для логирования подозрительных запросов
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /eval\(/,
    /javascript:/,
    /<script/i,
    /union.*select/i,
    /drop.*table/i,
    /exec\(/i
  ];
  
  const checkSuspicious = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const checkObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) return true;
        } else if (checkSuspicious(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  let suspicious = false;
  if (req.body && checkObject(req.body)) suspicious = true;
  if (req.query && checkObject(req.query)) suspicious = true;
  if (req.params && checkObject(req.params)) suspicious = true;
  
  if (suspicious) {
    console.warn(`[SECURITY] Suspicious request from ${req.ip}:`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  corsOptions,
  helmetConfig,
  ipWhitelist,
  securityLogger,
  telegramCorsMiddleware
}; 