const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename: user_id_timestamp.extension
    const uniqueName = `user_${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for avatars
const avatarFileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allow common image formats
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат изображения. Разрешены: JPEG, PNG, GIF, WebP'), false);
    }
  } else {
    cb(new Error('Файл должен быть изображением'), false);
  }
};

// Configure multer for avatar uploads
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Error handling middleware for upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'Файл слишком большой. Максимальный размер: 5MB',
          error_code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Можно загрузить только один файл',
          error_code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Неожиданный файл',
          error_code: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Ошибка загрузки файла',
          error_code: 'UPLOAD_ERROR'
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Ошибка загрузки файла',
      error_code: 'UPLOAD_ERROR'
    });
  }
  next();
};

// Utility function to delete old avatar file
const deleteOldAvatar = (avatarUrl) => {
  if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
    const filePath = path.join(process.cwd(), avatarUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Old avatar deleted:', filePath);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }
  }
};

module.exports = {
  uploadAvatar,
  handleUploadError,
  deleteOldAvatar
}; 