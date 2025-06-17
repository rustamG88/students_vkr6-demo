const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Функция для записи логов в файл
const writeLogToFile = (logData) => {
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `frontend-${date}.log`);
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${JSON.stringify(logData)}\n`;
  
  fs.appendFileSync(logFile, logEntry);
};

// Эндпоинт для записи логов с фронтенда
router.post('/frontend', (req, res) => {
  try {
    const { level, message, data, url, action, user_agent } = req.body;
    
    const logData = {
      level: level || 'info',
      message,
      data,
      url,
      action,
      user_agent,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    // Записываем в файл
    writeLogToFile(logData);
    
    // Выводим в консоль сервера
    console.log(`[FRONTEND LOG] ${message}`, data || '');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Log write error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Эндпоинт для получения логов (для отладки)
router.get('/frontend/:date?', (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    const logFile = path.join(__dirname, '../logs', `frontend-${date}.log`);
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      res.json({ 
        success: true, 
        logs: logs.split('\n').filter(line => line.trim()),
        date 
      });
    } else {
      res.json({ 
        success: true, 
        logs: [], 
        message: `No logs found for ${date}` 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 