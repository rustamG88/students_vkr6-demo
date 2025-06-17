# 🚀 Инструкция по запуску проекта через ngrok

## 📋 Что такое ngrok?
ngrok - это инструмент, который создает безопасный туннель от интернета к вашему локальному серверу. Это позволяет Telegram получить доступ к вашему Mini App, работающему на локальном компьютере.

## 🔧 Шаг 1: Установка ngrok

### Вариант 1: Скачать с официального сайта
1. Перейдите на https://ngrok.com/
2. Зарегистрируйтесь (бесплатно)
3. Скачайте ngrok для Windows
4. Распакуйте в любую папку (например, `C:\ngrok\`)

### Вариант 2: Через Chocolatey (если установлен)
```bash
choco install ngrok
```

## 🔑 Шаг 2: Получение токена авторизации
1. Войдите в свой аккаунт на https://dashboard.ngrok.com/
2. Перейдите в раздел "Your Authtoken"
3. Скопируйте токен (выглядит как: `2abc123def456ghi789jkl`)

## ⚙️ Шаг 3: Настройка ngrok
Откройте командную строку и выполните:
```bash
ngrok config add-authtoken ВАШ_ТОКЕН_ЗДЕСЬ
```

Пример:
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl
```

## 🚀 Шаг 4: Запуск проекта

### 4.1 Запуск сервера
1. Откройте командную строку в папке проекта
2. Запустите сервер:
```bash
start-all.bat
```
Или:
```bash
node app.js
```

Сервер запустится на порту 3000. Вы увидите сообщение:
```
🚀 Server running on port 3000
📱 Telegram Mini App available at: http://localhost:3000
```

### 4.2 Запуск ngrok (в новом окне командной строки)
Откройте **НОВОЕ** окно командной строки и выполните:
```bash
ngrok http 3000
```

Вы увидите что-то вроде:
```
ngrok                                                                                                                               
                                                                                                                                    
Session Status                online                                                                                                
Account                       your-email@example.com (Plan: Free)                                                                 
Version                       3.3.0                                                                                               
Region                        United States (us)                                                                                  
Latency                       45ms                                                                                                
Web Interface                 http://127.0.0.1:4040                                                                              
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000                                       
                                                                                                                                    
Connections                   ttl     opn     rt1     rt5     p50     p90                                                         
                              0       0       0.00    0.00    0.00    0.00
```

**ВАЖНО:** Скопируйте URL из строки "Forwarding" (например: `https://abc123def456.ngrok-free.app`)

## 📝 Шаг 5: Обновление конфигурации проекта

### 5.1 Обновите файл `.env`
Откройте файл `.env` в корне проекта и добавьте/обновите:
```env
# Существующие настройки
JWT_SECRET=test_secret_key

# Добавьте эти строки с ВАШИМ ngrok URL
NGROK_URL=https://abc123def456.ngrok-free.app
BASE_URL=https://abc123def456.ngrok-free.app
TELEGRAM_WEBHOOK_URL=https://abc123def456.ngrok-free.app/api/telegram/webhook
```

### 5.2 Обновите файл `app.js`
Найдите в файле `app.js` строки с CORS настройками (около строки 20-30):
```javascript
// CORS настройки
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-domain.com',
    'https://abc123def456.ngrok-free.app'  // ← ДОБАВЬТЕ ЭТУ СТРОКУ
  ],
  credentials: true
}));
```

### 5.3 Обновите фронтенд конфигурацию
Откройте файл `frontend/src/config/api.js` и обновите:
```javascript
// Определяем базовый URL API
const getBaseURL = () => {
  // В продакшене используем ngrok URL
  if (window.location.hostname !== 'localhost') {
    return 'https://abc123def456.ngrok-free.app/api';  // ← ЗАМЕНИТЕ НА ВАШ URL
  }
  
  // Локально
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getBaseURL();
```

## 🔄 Шаг 6: Пересборка и перезапуск

### 6.1 Остановите сервер
Нажмите `Ctrl+C` в окне с сервером

### 6.2 Пересоберите фронтенд
```bash
cd frontend
npm run build
cd ..
```

### 6.3 Запустите сервер заново
```bash
node app.js
```

## 🤖 Шаг 7: Настройка Telegram Bot

### 7.1 Найдите своего бота
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте команду `/mybots`
4. Выберите своего бота

### 7.2 Обновите URL Mini App
1. Выберите "Bot Settings" → "Menu Button"
2. Или "Web App" → "Edit Web App URL"
3. Введите ваш ngrok URL: `https://abc123def456.ngrok-free.app`

### 7.3 Альтернативный способ через BotFather
```
/setmenubutton
@ваш_бот_username
Открыть приложение
https://abc123def456.ngrok-free.app
```

## ✅ Шаг 8: Тестирование

1. Откройте Telegram
2. Найдите своего бота
3. Нажмите кнопку "Menu" или отправьте команду `/start`
4. Должно открыться ваше Mini App через ngrok

## 🔧 Возможные проблемы и решения

### Проблема: "This site can't be reached"
**Решение:** Убедитесь, что:
- Сервер запущен (`node app.js`)
- ngrok запущен (`ngrok http 3000`)
- URL в настройках бота правильный

### Проблема: "ngrok command not found"
**Решение:** 
- Убедитесь, что ngrok установлен
- Добавьте путь к ngrok в PATH
- Или запускайте из папки с ngrok: `C:\ngrok\ngrok.exe http 3000`

### Проблема: CORS ошибки
**Решение:** Убедитесь, что добавили ngrok URL в CORS настройки в `app.js`

### Проблема: "Visit Site" предупреждение в ngrok
**Решение:** Это нормально для бесплатной версии. Просто нажмите "Visit Site"

## 📱 Шаг 9: Каждый раз при запуске

**ВАЖНО:** При каждом перезапуске ngrok URL меняется!

1. Запустите сервер: `node app.js`
2. Запустите ngrok: `ngrok http 3000`
3. Скопируйте новый URL из ngrok
4. Обновите:
   - `.env` файл
   - `app.js` (CORS)
   - `frontend/src/config/api.js`
   - URL в настройках Telegram бота
5. Пересоберите фронтенд: `cd frontend && npm run build && cd ..`
6. Перезапустите сервер

## 💡 Полезные команды

```bash
# Запуск проекта
node app.js

# Запуск ngrok
ngrok http 3000

# Пересборка фронтенда
cd frontend && npm run build && cd ..

# Просмотр логов ngrok
# Откройте в браузере: http://localhost:4040
```

## 🎯 Быстрый чеклист

- [ ] ngrok установлен и настроен
- [ ] Сервер запущен на порту 3000
- [ ] ngrok запущен и показывает URL
- [ ] URL добавлен в `.env`
- [ ] URL добавлен в CORS настройки `app.js`
- [ ] URL добавлен в `frontend/src/config/api.js`
- [ ] Фронтенд пересобран
- [ ] URL обновлен в настройках Telegram бота
- [ ] Сервер перезапущен

После выполнения всех шагов ваш Telegram Mini App будет доступен через интернет! 