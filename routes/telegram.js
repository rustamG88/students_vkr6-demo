const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { catchAsync } = require('../middleware/errorHandler');
const router = express.Router();

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Webhook endpoint
router.post('/', (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      handleMessage(update.message);
    } else if (update.callback_query) {
      handleCallbackQuery(update.callback_query);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Handle text messages
const handleMessage = async (message) => {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id;

  // Получаем динамический URL приложения
  const getAppUrl = () => {
    return process.env.WEBAPP_URL || 
           process.env.BACKEND_URL || 
           'https://your-project.up.railway.app';
  };

  if (text === '/start') {
    const welcomeMessage = `
🎯 Добро пожаловать в корпоративную систему управления задачами!

Это приложение поможет вам:
✅ Управлять личными и рабочими задачами
👥 Взаимодействовать с коллегами  
📅 Планировать задачи в календаре
📊 Отслеживать прогресс работы

Нажмите кнопку ниже, чтобы открыть приложение:
    `;

    const keyboard = {
      inline_keyboard: [[
        {
          text: '🚀 Открыть приложение',
          web_app: {
            url: getAppUrl()
          }
        }
      ]]
    };

    try {
      await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  // Handle other commands
  if (text === '/help') {
    const helpMessage = `
📋 *Команды бота:*

/start - Начать работу с приложением
/help - Показать эту справку
/app - Открыть мини-приложение
/tasks - Получить список задач
/profile - Просмотр профиля

💡 *Основные функции:*
• Создание и управление задачами
• Календарь задач
• Профили сотрудников
• Фильтрация по статусам и приоритетам
    `;

    try {
      await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Send help error:', error);
    }
  }

  if (text === '/app') {
    const keyboard = {
      inline_keyboard: [[
        {
          text: '📱 Открыть приложение',
          web_app: {
            url: getAppUrl()
          }
        }
      ]]
    };

    try {
      await bot.sendMessage(chatId, '👆 Нажмите кнопку для открытия приложения:', {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Send app error:', error);
    }
  }
};

// Handle callback queries (inline keyboard buttons)
const handleCallbackQuery = async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  // Получаем динамический URL приложения
  const getAppUrl = () => {
    return process.env.WEBAPP_URL || 
           process.env.BACKEND_URL || 
           'https://your-project.up.railway.app';
  };

  try {
    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);

    // Handle different callback data
    if (data === 'open_app') {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🚀 Открыть приложение',
            web_app: {
              url: getAppUrl()
            }
          }
        ]]
      };

      await bot.editMessageText(
        '👆 Нажмите кнопку для открытия приложения:',
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: keyboard
        }
      );
    }
  } catch (error) {
    console.error('Callback query error:', error);
  }
};

// Set webhook (call this function to set up webhook)
const setWebhook = async () => {
  try {
    const baseUrl = process.env.BACKEND_URL || process.env.TELEGRAM_WEBHOOK_URL;
    const webhookUrl = `${baseUrl}/webhook/telegram`;
    await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    return webhookUrl;
  } catch (error) {
    console.error('❌ Set webhook error:', error);
    throw error;
  }
};

// Auto-setup webhook endpoint
router.post('/setup-webhook', catchAsync(async (req, res) => {
  try {
    const webhookUrl = await setWebhook();
    res.json({
      success: true,
      message: 'Webhook configured successfully',
      webhook_url: webhookUrl
    });
  } catch (error) {
    console.error('Auto webhook setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup webhook',
      error: error.message
    });
  }
}));

// Export router as default
module.exports = router;

// Export additional functions for manual setup
module.exports.bot = bot;
module.exports.setWebhook = setWebhook; 