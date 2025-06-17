# 🚀 Развертывание Telegram Mini App на Railway

## Шаг 1: Подготовка репозитория

1. Убедитесь, что все файлы закоммичены в Git
2. Загрузите проект на GitHub

## Шаг 2: Создание проекта на Railway

1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите "Deploy from GitHub repo"
5. Выберите ваш репозиторий

## Шаг 3: Добавление базы данных MySQL

1. В проекте нажмите "Add Service"
2. Выберите "Database" → "MySQL"
3. Railway автоматически создаст базу данных

## Шаг 4: Настройка переменных окружения

В разделе "Variables" добавьте:

```env
# Скопируйте данные подключения к БД из Railway MySQL
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_NAME=railway
DB_USER=root
DB_PASSWORD=сгенерированный_пароль

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=ваш_супер_секретный_ключ_минимум_32_символа

# Telegram Bot Token (получите у @BotFather)
TELEGRAM_BOT_TOKEN=ваш_токен_бота

# Настройки сервера
NODE_ENV=production
PORT=3000

# CORS (замените на ваш домен Railway)
FRONTEND_URL=https://ваше-приложение.up.railway.app
```

## Шаг 5: Настройка Telegram Bot

1. Найдите URL вашего приложения в Railway (например: `https://ваше-приложение.up.railway.app`)
2. Откройте @BotFather в Telegram
3. Выполните команды:
   ```
   /setdomain
   Выберите вашего бота
   Введите: ваше-приложение.up.railway.app
   ```

## Шаг 6: Инициализация базы данных

После первого деплоя выполните:

1. Откройте Railway Console для вашего приложения
2. Выполните команду для создания таблиц:
   ```bash
   node -e "require('./database/init-db.js')"
   ```

## Шаг 7: Тестирование

1. Откройте вашего Telegram бота
2. Нажмите "Start"
3. Приложение должно открыться и работать!

## 🔧 Полезные команды Railway CLI

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин
railway login

# Просмотр логов
railway logs

# Подключение к базе данных
railway connect mysql
```

## 🐛 Отладка

- Проверьте логи в Railway Dashboard
- Убедитесь, что все переменные окружения настроены
- Проверьте, что Telegram Bot Token корректный
- Убедитесь, что домен настроен в @BotFather 