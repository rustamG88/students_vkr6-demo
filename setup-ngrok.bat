@echo off
echo ========================================
echo    НАСТРОЙКА NGROK ДЛЯ TELEGRAM MINI APP
echo ========================================
echo.

echo 📋 Этот скрипт поможет настроить ngrok для вашего проекта
echo.

:input_url
echo 🔗 Введите ваш ngrok URL (например: https://abc123def456.ngrok-free.app)
set /p NGROK_URL="URL: "

if "%NGROK_URL%"=="" (
    echo ❌ URL не может быть пустым!
    goto input_url
)

echo.
echo 🔧 Обновляю конфигурационные файлы...

REM Обновляем .env файл
echo # Существующие настройки > .env.new
echo JWT_SECRET=test_secret_key >> .env.new
echo. >> .env.new
echo # ngrok настройки >> .env.new
echo NGROK_URL=%NGROK_URL% >> .env.new
echo BASE_URL=%NGROK_URL% >> .env.new
echo TELEGRAM_WEBHOOK_URL=%NGROK_URL%/api/telegram/webhook >> .env.new

move .env.new .env

echo ✅ Файл .env обновлен

echo.
echo 📝 ВАЖНО! Теперь вам нужно вручную обновить:
echo.
echo 1️⃣ Файл app.js - добавьте в CORS настройки:
echo    '%NGROK_URL%'
echo.
echo 2️⃣ Файл frontend/src/config/api.js - замените URL на:
echo    '%NGROK_URL%/api'
echo.
echo 3️⃣ Настройки Telegram бота - установите URL:
echo    '%NGROK_URL%'
echo.
echo 4️⃣ Пересоберите фронтенд:
echo    cd frontend ^&^& npm run build ^&^& cd ..
echo.
echo 5️⃣ Перезапустите сервер:
echo    node app.js
echo.

pause 