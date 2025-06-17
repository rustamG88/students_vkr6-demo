@echo off
echo ========================================
echo    ЗАПУСК TELEGRAM MINI APP
echo ========================================
echo.

echo 🔧 Проверка зависимостей...
if not exist node_modules (
    echo 📦 Установка зависимостей бэкенда...
    call npm install
)

if not exist frontend\node_modules (
    echo 📦 Установка зависимостей фронтенда...
    cd frontend
    call npm install
    cd ..
)

echo.
echo 🏗️ Сборка фронтенда...
cd frontend
call npm run build
cd ..

echo.
echo 🚀 Запуск сервера...
echo 📍 Сервер будет доступен по адресу: http://localhost:3000
echo 📱 Telegram Mini App: http://localhost:3000
echo.
echo ⚠️  Для остановки нажмите Ctrl+C
echo.

node app.js 