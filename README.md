# 🚀 Telegram Mini App - Corporate Task Management

Корпоративная система управления задачами в виде Telegram Mini App.

## ✨ Возможности

- 🔐 **Аутентификация через Telegram**
- 👥 **Управление командами и сотрудниками**
- 📋 **Создание и назначение задач**
- 📅 **Календарь задач**
- 📝 **Заметки о сотрудниках**
- 🔒 **Мульти-тенантность (изоляция данных по командам)**

## 🏗️ Архитектура

- **Backend**: Node.js + Express + MySQL
- **Frontend**: Vue.js 3 + Vite + Pinia
- **Database**: MySQL с полной схемой
- **Authentication**: JWT + Telegram WebApp
- **Hosting**: Railway (рекомендуется)

## 🚀 Быстрый деплой на Railway

### 1. Подготовка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd telegram-miniapp

# Установите зависимости
npm install

# Запустите настройку для Railway
npm run setup:railway
```

### 2. Деплой на Railway

1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Создайте новый проект из GitHub репозитория
4. Добавьте MySQL базу данных
5. Настройте переменные окружения (см. `railway.env.example`)

### 3. Настройка переменных окружения

```env
# Database (скопируйте из Railway MySQL)
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_NAME=railway
DB_USER=root
DB_PASSWORD=generated_password

# Security
JWT_SECRET=your_super_secret_jwt_key_32_chars_min
NODE_ENV=production

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Frontend
FRONTEND_URL=https://your-app.up.railway.app
```

### 4. Инициализация базы данных

После первого деплоя выполните в Railway Console:

```bash
npm run db:init
```

### 5. Настройка Telegram Bot

1. Найдите URL вашего приложения в Railway
2. Откройте @BotFather в Telegram
3. Выполните:
   ```
   /setdomain
   Выберите вашего бота
   Введите: your-app.up.railway.app
   ```

## 🛠️ Локальная разработка

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp railway.env.example .env
# Отредактируйте .env файл

# Запуск в режиме разработки
npm run dev

# Инициализация базы данных
npm run db:init
```

## 📁 Структура проекта

```
├── app.js                 # Express приложение
├── server.js              # Точка входа
├── database/              # База данных
│   ├── db.js             # Подключение к БД
│   └── init-db.js        # Инициализация схемы
├── routes/               # API маршруты
│   ├── auth.js          # Аутентификация
│   ├── users.js         # Пользователи
│   ├── tasks.js         # Задачи
│   ├── employees.js     # Сотрудники
│   └── ...
├── middleware/           # Middleware
│   ├── auth.js          # JWT аутентификация
│   ├── security.js      # Безопасность
│   └── validation.js    # Валидация
├── frontend/            # Vue.js фронтенд
└── scripts/             # Утилиты
    └── setup-railway.js # Настройка Railway
```

## 🔧 API Endpoints

### Аутентификация
- `POST /api/auth/start` - Начало аутентификации
- `POST /api/auth/complete-profile` - Завершение профиля

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/users/profile/me` - Мой профиль
- `PUT /api/users/profile/me` - Обновление профиля

### Задачи
- `GET /api/tasks` - Список задач
- `POST /api/tasks` - Создание задачи
- `PUT /api/tasks/:id` - Обновление задачи
- `DELETE /api/tasks/:id` - Удаление задачи

### Команды
- `GET /api/teams/my-team` - Моя команда
- `POST /api/teams/join` - Присоединиться к команде

## 🔒 Безопасность

- JWT токены для аутентификации
- Rate limiting для API
- CORS настройки
- Валидация входных данных
- Мульти-тенантность (изоляция по командам)

## 📊 База данных

Полная схема включает:
- `users` - Пользователи
- `teams` - Команды
- `tasks` - Задачи
- `task_statuses` - Статусы задач
- `task_priorities` - Приоритеты задач
- `employee_notes` - Заметки о сотрудниках

## 🐛 Отладка

```bash
# Просмотр логов Railway
railway logs

# Подключение к базе данных
railway connect mysql

# Проверка здоровья приложения
curl https://your-app.up.railway.app/health
```

## 📖 Документация

- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Подробная инструкция по деплою
- [railway.env.example](./railway.env.example) - Пример переменных окружения

## 🤝 Поддержка

Если возникли проблемы:
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте настройки Telegram бота в @BotFather

## 📄 Лицензия

MIT License 