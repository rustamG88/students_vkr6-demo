const fs = require('fs').promises;
const path = require('path');

// Кастомный класс ошибок приложения
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Логирование ошибок
const logError = async (error, req = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    code: error.code,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    userId: req?.user?.userId,
    body: req?.body,
    query: req?.query,
    params: req?.params
  };

  try {
    const logsDir = path.join(__dirname, '../logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  } catch (logError) {
    console.error('Failed to write to log file:', logError);
  }

  // Также выводим в консоль
  console.error(`[ERROR ${timestamp}] ${error.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
};

// Обработка различных типов ошибок
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 400, 'FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400, 'TOO_MANY_FILES');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected field', 400, 'UNEXPECTED_FIELD');
  }
  return new AppError('File upload error', 400, 'UPLOAD_ERROR');
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    code: err.code,
    details: err.details
  });
};

const sendErrorProd = (err, res) => {
  // Операционные, доверенные ошибки: отправляем сообщение клиенту
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details
    });
  } else {
    // Программные ошибки или неизвестные ошибки: не раскрываем детали
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Основной обработчик ошибок
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Логируем все ошибки
  logError(err, req);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Обрабатываем специфичные ошибки
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, res);
  }
};

// Обработчик необработанных маршрутов
const handleNotFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
  next(err);
};

// Асинхронный обработчик для избежания try-catch блоков
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Обработчик необработанных Promise rejection
process.on('unhandledRejection', (err, promise) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  logError(err);
  process.exit(1);
});

// Обработчик неперехваченных исключений
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  logError(err);
  process.exit(1);
});

module.exports = {
  AppError,
  globalErrorHandler,
  handleNotFound,
  catchAsync,
  logError
}; 