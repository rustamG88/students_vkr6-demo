const TelegramBot = require('node-telegram-bot-api');
const { pool } = require('../database/db');

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Функция для отправки уведомления конкретному пользователю
const sendNotificationToUser = async (telegramId, message, options = {}) => {
  try {
    await bot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    });
    console.log(`✅ Notification sent to user ${telegramId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send notification to user ${telegramId}:`, error);
    return false;
  }
};

// Уведомление о новой задаче
const notifyNewTask = async (taskId, assignedToTelegramId, createdByName, taskTitle, taskDescription = '', priority = '', dueDate = null) => {
  let priorityIcon = '';
  switch (priority.toLowerCase()) {
    case 'высокий приоритет':
    case 'high':
      priorityIcon = '🔴';
      break;
    case 'средний приоритет':
    case 'medium':
      priorityIcon = '🟡';
      break;
    case 'низкий приоритет':
    case 'low':
      priorityIcon = '🟢';
      break;
    default:
      priorityIcon = '⚪';
  }

  const dueDateText = dueDate ? `\n📅 Срок: ${new Date(dueDate).toLocaleDateString('ru-RU')}` : '';
  const descriptionText = taskDescription && taskDescription.length > 100 
    ? taskDescription.substring(0, 100) + '...'
    : taskDescription;

  const message = `
🎯 *Новая задача назначена!*

📋 **${taskTitle}**
${descriptionText ? `\n📝 ${descriptionText}` : ''}
👤 От: ${createdByName}${dueDateText}
${priorityIcon} Приоритет: ${priority || 'Не указан'}

Откройте приложение для просмотра деталей:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📱 Открыть задачу',
        web_app: {
          url: `${process.env.WEBAPP_URL}/tasks/${taskId}`
        }
      }
    ]]
  };

  return await sendNotificationToUser(assignedToTelegramId, message, {
    reply_markup: keyboard
  });
};

// Уведомление о выполнении задачи
const notifyTaskCompleted = async (taskId, createdByTelegramId, assignedByName, taskTitle, completionComment = '') => {
  const commentText = completionComment ? `\n💬 Комментарий: ${completionComment}` : '';
  
  const message = `
✅ *Задача выполнена!*

📋 **${taskTitle}**
👤 Исполнитель: ${assignedByName}${commentText}
📅 Завершено: ${new Date().toLocaleDateString('ru-RU')}

Нажмите кнопку для просмотра результата:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📱 Открыть задачу',
        web_app: {
          url: `${process.env.WEBAPP_URL}/tasks/outgoing/${taskId}`
        }
      }
    ]]
  };

  return await sendNotificationToUser(createdByTelegramId, message, {
    reply_markup: keyboard
  });
};

// Уведомление об изменении статуса задачи
const notifyTaskStatusChanged = async (taskId, telegramId, taskTitle, oldStatus, newStatus, changedByName) => {
  let statusIcon = '';
  switch (newStatus.toLowerCase()) {
    case 'выполнено':
    case 'completed':
      statusIcon = '✅';
      break;
    case 'в работе':
    case 'in_progress':
      statusIcon = '🔄';
      break;
    case 'на проверке':
    case 'review':
      statusIcon = '👁️';
      break;
    case 'отменено':
    case 'cancelled':
      statusIcon = '❌';
      break;
    default:
      statusIcon = '📋';
  }

  const message = `
${statusIcon} *Статус задачи изменен*

📋 **${taskTitle}**
📊 ${oldStatus} → ${newStatus}
👤 Изменил: ${changedByName}
📅 ${new Date().toLocaleDateString('ru-RU')}

Откройте приложение для просмотра:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📱 Открыть задачу',
        web_app: {
          url: `${process.env.WEBAPP_URL}/tasks/${taskId}`
        }
      }
    ]]
  };

  return await sendNotificationToUser(telegramId, message, {
    reply_markup: keyboard
  });
};

// Уведомление о новом сотруднике
const notifyNewEmployee = async (adminTelegramIds, employeeName, position, department, invitedByName = '') => {
  const inviterText = invitedByName ? `\n👤 Пригласил: ${invitedByName}` : '';
  
  const message = `
👋 *Новый сотрудник присоединился!*

👤 **${employeeName}**
💼 Должность: ${position}
🏢 Отдел: ${department}${inviterText}
📅 Дата присоединения: ${new Date().toLocaleDateString('ru-RU')}

Добро пожаловать в команду! 🎉
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '👥 Открыть список сотрудников',
        web_app: {
          url: `${process.env.WEBAPP_URL}/employees`
        }
      }
    ]]
  };

  // Отправляем всем администраторам
  const results = [];
  for (const adminId of adminTelegramIds) {
    const result = await sendNotificationToUser(adminId, message, {
      reply_markup: keyboard
    });
    results.push(result);
  }
  
  return results;
};

// Напоминание о просроченных задачах
const notifyOverdueTasks = async (userTelegramId, overdueTasks) => {
  if (overdueTasks.length === 0) return;

  const tasksList = overdueTasks.slice(0, 5).map((task, index) => 
    `${index + 1}. ${task.title} (просрочена на ${task.daysPastDue} дн.)`
  ).join('\n');

  const moreTasksText = overdueTasks.length > 5 ? `\n\n...и еще ${overdueTasks.length - 5} задач` : '';

  const message = `
⏰ *Напоминание о просроченных задачах*

У вас ${overdueTasks.length} просроченных задач:

${tasksList}${moreTasksText}

Откройте приложение для управления задачами:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📱 Открыть задачи',
        web_app: {
          url: `${process.env.WEBAPP_URL}/tasks`
        }
      }
    ]]
  };

  return await sendNotificationToUser(userTelegramId, message, {
    reply_markup: keyboard
  });
};

// Получить админов для уведомлений
const getAdminTelegramIds = async () => {
  try {
    const [admins] = await pool.query(
      'SELECT telegram_id FROM users WHERE is_admin = TRUE AND is_active = TRUE'
    );
    return admins.map(admin => admin.telegram_id);
  } catch (error) {
    console.error('Error getting admin telegram IDs:', error);
    return [];
  }
};

module.exports = {
  sendNotificationToUser,
  notifyNewTask,
  notifyTaskCompleted,
  notifyTaskStatusChanged,
  notifyNewEmployee,
  notifyOverdueTasks,
  getAdminTelegramIds
}; 