const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/security');
const { sanitizeInput } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { sendNotificationToUser, getAdminTelegramIds } = require('./notifications');
const router = express.Router();

// Test notification endpoint (admin only)
router.post('/test', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { message, telegram_id } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  let targetId = telegram_id;
  
  // If no telegram_id provided, send to current user
  if (!targetId) {
    targetId = req.user.telegramId;
  }

  const result = await sendNotificationToUser(targetId, `🧪 *Тестовое уведомление*\n\n${message}`);
  
  res.json({
    success: result,
    message: result ? 'Test notification sent successfully' : 'Failed to send test notification'
  });
}));

// Get admin telegram IDs (admin only)
router.get('/admins', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const adminIds = await getAdminTelegramIds();
  
  res.json({
    success: true,
    data: {
      admin_telegram_ids: adminIds,
      count: adminIds.length
    }
  });
}));

// Send notification to all admins (admin only)
router.post('/broadcast/admins', apiRateLimit, sanitizeInput, authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  const adminIds = await getAdminTelegramIds();
  
  if (adminIds.length === 0) {
    return res.json({
      success: false,
      message: 'No admin users found'
    });
  }

  const results = [];
  for (const adminId of adminIds) {
    const result = await sendNotificationToUser(adminId, `📢 *Уведомление от администратора*\n\n${message}`);
    results.push({ telegram_id: adminId, success: result });
  }

  const successCount = results.filter(r => r.success).length;
  
  res.json({
    success: true,
    data: {
      total_admins: adminIds.length,
      successful_sends: successCount,
      failed_sends: adminIds.length - successCount,
      results: results
    },
    message: `Notification sent to ${successCount}/${adminIds.length} admins`
  });
}));

module.exports = router; 