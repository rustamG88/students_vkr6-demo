# 🔧 ПОЛНАЯ ИНСТРУКЦИЯ ПО НАСТРОЙКЕ NGROK

## 📋 ВСЕ ФАЙЛЫ, КОТОРЫЕ НУЖНО ИЗМЕНИТЬ

После получения нового ngrok URL (например: `https://abc123def456.ngrok-free.app`) нужно обновить **5 файлов**:

---

## 📁 **1. frontend/src/services/api.js** (строка 17)

**НАЙТИ:**
```javascript
const ngrokUrl = 'https://25d0fec53155.ngrok.app/api';
```

**ЗАМЕНИТЬ НА:**
```javascript
const ngrokUrl = 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app/api';
```

---

## 📁 **2. middleware/security.js** (строки 48-49)

**НАЙТИ:**
```javascript
'https://25d0fec53155.ngrok.app',
'https://25d0fec53155.ngrok-free.app',
```

**ЗАМЕНИТЬ НА:**
```javascript
'https://ВАШ_НОВЫЙ_URL.ngrok-free.app',
'https://ВАШ_НОВЫЙ_URL.ngrok-free.app',
```

---

## 📁 **3. frontend/vite.config.js** (строки 20 и 43)

**НАЙТИ:**
```javascript
target: env.VITE_API_URL || 'https://25d0fec53155.ngrok.app',
```
И:
```javascript
__NGROK_URL__: JSON.stringify('https://25d0fec53155.ngrok.app')
```

**ЗАМЕНИТЬ НА:**
```javascript
target: env.VITE_API_URL || 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app',
```
И:
```javascript
__NGROK_URL__: JSON.stringify('https://ВАШ_НОВЫЙ_URL.ngrok-free.app')
```

---

## 📁 **4. frontend/src/utils/logger.js** (строки 21 и 23)

**НАЙТИ:**
```javascript
return 'https://25d0fec53155.ngrok.app/api';
```
И:
```javascript
return 'https://25d0fec53155.ngrok.app/api';
```

**ЗАМЕНИТЬ НА:**
```javascript
return 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app/api';
```
И:
```javascript
return 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app/api';
```

---

## 📁 **5. app.js** (строка 129)

**НАЙТИ:**
```javascript
ngrokUrl: 'https://25d0fec53155.ngrok.app'
```

**ЗАМЕНИТЬ НА:**
```javascript
ngrokUrl: 'https://ВАШ_НОВЫЙ_URL.ngrok-free.app'
```

---

## 🚀 **ПОШАГОВАЯ ИНСТРУКЦИЯ**

### 1️⃣ Установите и настройте ngrok
```bash
# Скачайте с https://ngrok.com/download
# Получите токен на https://dashboard.ngrok.com/
C:\ngrok\ngrok.exe config add-authtoken ВАШ_ТОКЕН
```

### 2️⃣ Запустите проект
```bash
start-all.bat
```

### 3️⃣ Запустите ngrok (в новом окне)
```bash
C:\ngrok\ngrok.exe http 3000
```

### 4️⃣ Скопируйте URL из ngrok
Найдите строку вида:
```
Forwarding    https://abc123def456.ngrok-free.app -> http://localhost:3000
```

### 5️⃣ Замените URL во ВСЕХ 5 файлах
- `frontend/src/services/api.js` (строка 17)
- `middleware/security.js` (строки 48-49)  
- `frontend/vite.config.js` (строки 20 и 43)
- `frontend/src/utils/logger.js` (строки 21 и 23)
- `app.js` (строка 129)

### 6️⃣ Пересоберите фронтенд
```bash
cd frontend
npm run build
cd ..
```

### 7️⃣ Перезапустите сервер
```bash
# Остановите сервер (Ctrl+C)
node app.js
```

### 8️⃣ Обновите Telegram бота
1. Найдите @BotFather в Telegram
2. `/mybots` → выберите бота → Bot Settings → Menu Button
3. Введите: `https://ВАШ_НОВЫЙ_URL.ngrok-free.app`

---

## ⚠️ **ВАЖНО!**

**При каждом перезапуске ngrok URL меняется!** Нужно повторить шаги 4-8.

---

## 🔍 **БЫСТРАЯ ПРОВЕРКА**

Поиск по проекту старого URL:
```bash
# В Windows PowerShell:
Select-String -Path "*.js" -Pattern "25d0fec53155.ngrok" -Recurse
```

Должно найти 0 результатов после замены.

---

## 📱 **ГОТОВО!**

После выполнения всех шагов ваш Telegram Mini App будет работать через ngrok! 