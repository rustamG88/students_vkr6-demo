# ⚡ Быстрая настройка ngrok

## 🚀 Пошаговая инструкция (для чайников)

### 1️⃣ Установите ngrok
- Скачайте с https://ngrok.com/download
- Распакуйте в папку `C:\ngrok\`
- Зарегистрируйтесь на сайте и получите токен

### 2️⃣ Настройте ngrok
Откройте командную строку и выполните:
```bash
C:\ngrok\ngrok.exe config add-authtoken ВАШ_ТОКЕН
```

### 3️⃣ Запустите проект
```bash
start-all.bat
```

### 4️⃣ Запустите ngrok (в новом окне)
```bash
C:\ngrok\ngrok.exe http 3000
```

Скопируйте URL вида: `https://abc123def456.ngrok-free.app`

### 5️⃣ Обновите конфигурацию

#### В файле `frontend/src/services/api.js` (строка 14):
```javascript
const ngrokUrl = 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app/api';
```

#### В файле `app.js` (найдите CORS настройки):
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ВАШ_НОВЫЙ_URL.ngrok-free.app'  // ← ДОБАВЬТЕ
  ],
  credentials: true
}));
```

### 6️⃣ Пересоберите и перезапустите
```bash
# Остановите сервер (Ctrl+C)
cd frontend
npm run build
cd ..
node app.js
```

### 7️⃣ Обновите Telegram бота
1. Найдите @BotFather в Telegram
2. `/mybots` → выберите бота → Bot Settings → Menu Button
3. Введите: `https://ВАШ_НОВЫЙ_URL.ngrok-free.app`

## 🔄 При каждом перезапуске ngrok:
1. Получите новый URL из ngrok
2. Обновите `frontend/src/services/api.js` (строка 14)
3. Обновите `app.js` (CORS настройки)
4. Пересоберите: `cd frontend && npm run build && cd ..`
5. Перезапустите: `node app.js`
6. Обновите URL в настройках Telegram бота

## 📱 Готово!
Теперь ваш Mini App доступен в Telegram через ngrok! 