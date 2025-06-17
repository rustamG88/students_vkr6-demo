# 🚀 БЫСТРЫЙ ДЕПЛОЙ НА RAILWAY

## Подготовка завершена! ✅

Все hardcoded URLs убраны, проект готов к деплою.

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### **Вариант 1: Через GitHub + Railway UI (Рекомендуется)**

#### 1️⃣ Инициализация Git
```bash
cd C:\путь\к\папке\students_vkr6
git init
git add .
git commit -m "Initial commit - ready for Railway"
```

#### 2️⃣ Загрузка на GitHub
```bash
# Создайте репозиторий на GitHub: students-vkr6-railway
git remote add origin https://github.com/ваш-логин/students-vkr6-railway.git
git push -u origin main
```

#### 3️⃣ Деплой на Railway
1. Зайдите на [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Выберите репозиторий `students-vkr6-railway`
4. Railway автоматически начнет сборку

#### 4️⃣ Настройка переменных окружения
В Railway UI → **Settings** → **Variables**:

```env
NODE_ENV=production
JWT_SECRET=ваш_супер_секретный_ключ_минимум_32_символа
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
PORT=3000
```

Railway автоматически установит:
- `RAILWAY_STATIC_URL` → ваш URL домена
- `PORT` → порт для приложения

#### 5️⃣ Получение URL и настройка webhook
1. В Railway → **Overview** скопируйте URL (например: `https://students-vkr6-production.up.railway.app`)
2. Настройте Telegram webhook:

```bash
curl "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://students-vkr6-production.up.railway.app/webhook/telegram"
```

#### 6️⃣ Настройка бота в BotFather
1. Откройте @BotFather в Telegram
2. Выполните:
   ```
   /mybots
   → Выберите вашего бота
   → Bot Settings
   → Menu Button
   → Edit menu button URL
   → Введите: https://students-vkr6-production.up.railway.app
   ```

---

### **Вариант 2: Через Railway CLI**

#### 1️⃣ Установка CLI
```bash
npm install -g railway
railway login
```

#### 2️⃣ Инициализация проекта
```bash
cd C:\путь\к\папке\students_vkr6
railway init
# Выберите "Create a new project"
```

#### 3️⃣ Настройка переменных
```bash
railway variables set TELEGRAM_BOT_TOKEN=<ваш_токен>
railway variables set JWT_SECRET=<ваш_секретный_ключ>
railway variables set NODE_ENV=production
```

#### 4️⃣ Деплой
```bash
railway up
```

---

## ⚡ АВТОМАТИЧЕСКАЯ СБОРКА

Railway автоматически:
- ✅ Установит зависимости (`npm install`)
- ✅ Соберет фронтенд (`npm run build`)
- ✅ Запустит сервер (`npm start`)
- ✅ Присвоит HTTPS домен

## 🎯 ПРОВЕРКА РАБОТЫ

1. **Откройте бота в Telegram** → `/start`
2. **Нажмите "🚀 Открыть приложение"**
3. **Заполните профиль**
4. **Протестируйте все функции**

## 🔧 ОТЛАДКА

### Просмотр логов:
```bash
railway logs
```

### Подключение к консоли:
```bash
railway shell
```

### Проверка переменных:
```bash
railway variables
```

## 📱 РЕЗУЛЬТАТ

После деплоя ваш Telegram Mini App будет доступен:
- **Telegram Bot**: @ваш_бот_name  
- **Web App**: https://ваш-проект.up.railway.app
- **API**: https://ваш-проект.up.railway.app/api

---

## 🎉 ГОТОВО!

Ваш проект полностью готов к продакшену на Railway! 