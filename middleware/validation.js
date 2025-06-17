const { body, param, query, validationResult } = require('express-validator');

// Обработчик результатов валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // В development режиме логируем для отладки, но все равно валидируем
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Validation errors (development):', errors.array());
    }
    
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Валидация пользователя
const validateUser = [
  body('email')
    .optional()
    .custom((value) => {
      // В development режиме - более мягкая валидация
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      // В production - строгая валидация
      return /\S+@\S+\.\S+/.test(value);
    })
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Телефон не обязателен
      
      // Убираем все символы кроме цифр и +
      const cleanPhone = value.replace(/[^\d+]/g, '');
      
      // Строгая валидация российских номеров: +7XXXXXXXXXX или 8XXXXXXXXXX
      const phoneRegex = /^(\+7|8)\d{10}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Номер должен начинаться с +7 или 8 и содержать 11 цифр');
      }
      
      return true;
    })
    .withMessage('Please provide a valid Russian phone number (+7XXXXXXXXXX or 8XXXXXXXXXX)'),
  body('position')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Position must be between 1 and 100 characters'),
  body('company')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Company must be between 1 and 100 characters'),
  body('department')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Department must be between 1 and 50 characters'),
  body('first_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be between 1 and 50 characters'),
  body('last_name')
    .optional()
    .isLength({ min: 0, max: 50 })
    .trim()
    .withMessage('Last name must be less than 50 characters'),
  body('username')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Username must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Bio must be less than 500 characters'),
  body('birthday')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('Birthday must be a valid date'),
  handleValidationErrors
];

// Валидация задачи
const validateTask = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Description must be less than 2000 characters'),
  body('assigned_to')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned user ID must be a positive integer'),
  body('status_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Status ID must be a positive integer'),
  body('priority_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Priority ID must be a positive integer'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('is_personal')
    .optional()
    .isBoolean()
    .withMessage('is_personal must be a boolean value'),
  handleValidationErrors
];

// Валидация ID параметра
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Валидация запросов поиска
const validateSearchQuery = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage('Search query must be less than 100 characters'),
  query('department')
    .optional()
    .isLength({ max: 50 })
    .trim()
    .withMessage('Department filter must be less than 50 characters'),
  query('company')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage('Company filter must be less than 100 characters'),
  query('status')
    .optional()
    .isLength({ max: 20 })
    .trim()
    .withMessage('Status filter must be less than 20 characters'),
  query('priority')
    .optional()
    .isLength({ max: 20 })
    .trim()
    .withMessage('Priority filter must be less than 20 characters'),
  query('type')
    .optional()
    .isIn(['incoming', 'outgoing', 'personal'])
    .withMessage('Task type must be: incoming, outgoing, or personal'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Валидация календарной даты
const validateDate = [
  query('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  handleValidationErrors
];

// Валидация обновления статуса задачи
const validateTaskStatusUpdate = [
  body('status_id')
    .isInt({ min: 1, max: 10 })
    .withMessage('Status ID must be between 1 and 10'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .withMessage('Comment must be less than 500 characters'),
  handleValidationErrors
];

// Валидация создания комментария
const validateComment = [
  body('comment')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage('Comment is required and must be less than 1000 characters'),
  handleValidationErrors
];

// Валидация сотрудника
const validateEmployee = [
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .trim()
    .withMessage('First name is required and must be between 2 and 50 characters'),
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .trim()
    .withMessage('Last name is required and must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('position')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('Position is required and must be between 2 and 100 characters'),
  body('company')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Company must be between 1 and 100 characters'),
  body('department')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Department must be between 1 and 50 characters'),
  body('is_admin')
    .optional()
    .isBoolean()
    .withMessage('is_admin must be a boolean value'),
  body('telegram_id')
    .optional()
    .isInt()
    .withMessage('Telegram ID must be an integer'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .trim()
    .withMessage('Username must be between 3 and 50 characters'),
  handleValidationErrors
];

// Санитизация данных для предотвращения XSS
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  validateUser,
  validateTask,
  validateEmployee,
  validateId,
  validateSearchQuery,
  validateDate,
  validateTaskStatusUpdate,
  validateComment,
  sanitizeInput,
  handleValidationErrors
}; 