@echo off
color 0A
echo.
echo ========================================
echo 🚀 TELEGRAM MINI APP - RAILWAY DEPLOY
echo ========================================
echo.

REM Проверяем наличие git
git --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Git не установлен! Установите Git: https://git-scm.com/download/win
  pause
  exit /b 1
)

REM Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Node.js не установлен! Установите Node.js: https://nodejs.org/
  pause
  exit /b 1
)

echo ✅ Git и Node.js найдены
echo.

REM Инициализируем git если еще не инициализирован
if not exist ".git" (
  echo 📁 Инициализируем Git репозиторий...
  git init
  git add .
  git commit -m "Initial commit - ready for Railway deploy"
  echo ✅ Git репозиторий создан
) else (
  echo 📁 Git репозиторий уже существует
  echo 📤 Добавляем изменения...
  git add .
  git status
  echo.
  set /p commit_msg="💬 Введите сообщение коммита (или Enter для стандартного): "
  if "%commit_msg%"=="" set commit_msg=Update for Railway deploy
  git commit -m "%commit_msg%"
  echo ✅ Изменения зафиксированы
)

echo.
echo 🔧 НАСТРОЙКА ДЕПЛОЯ:
echo.
echo 1. GitHub + Railway UI (рекомендуется)
echo 2. Прямой деплой через Railway CLI
echo.
set /p deploy_choice="Выберите способ деплоя (1 или 2): "

if "%deploy_choice%"=="1" goto github_deploy
if "%deploy_choice%"=="2" goto cli_deploy

echo ❌ Неверный выбор!
pause
exit /b 1

:github_deploy
echo.
echo 📡 ДЕПЛОЙ ЧЕРЕЗ GITHUB
echo.
set /p github_repo="📝 Введите URL GitHub репозитория (например: https://github.com/username/repo.git): "
if "%github_repo%"=="" (
  echo ❌ URL репозитория не указан!
  pause
  exit /b 1
)

echo 📤 Отправляем код на GitHub...
git remote remove origin 2>nul
git remote add origin %github_repo%
git push -u origin main

echo.
echo ✅ КОД ЗАГРУЖЕН НА GITHUB!
echo.
echo 📋 ДАЛЬНЕЙШИЕ ШАГИ:
echo 1. Зайдите на https://railway.app
echo 2. New Project → Deploy from GitHub
echo 3. Выберите ваш репозиторий
echo 4. В Settings → Variables добавьте:
echo    - TELEGRAM_BOT_TOKEN=ваш_токен
echo    - JWT_SECRET=ваш_секретный_ключ
echo    - NODE_ENV=production
echo 5. Скопируйте URL проекта из Overview
echo 6. Настройте webhook:
echo    curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://ваш-проект.up.railway.app/webhook/telegram"
echo.
pause
goto end

:cli_deploy
echo.
echo 🚀 ДЕПЛОЙ ЧЕРЕЗ RAILWAY CLI
echo.

REM Проверяем наличие Railway CLI
railway --version >nul 2>&1
if %errorlevel% neq 0 (
  echo 📦 Устанавливаем Railway CLI...
  npm install -g railway
  if %errorlevel% neq 0 (
    echo ❌ Ошибка установки Railway CLI!
    pause
    exit /b 1
  )
)

echo 🔐 Авторизация в Railway...
railway login
if %errorlevel% neq 0 (
  echo ❌ Ошибка авторизации!
  pause
  exit /b 1
)

echo 🆕 Создаем новый проект...
railway init
if %errorlevel% neq 0 (
  echo ❌ Ошибка создания проекта!
  pause
  exit /b 1
)

echo.
echo 🔧 НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:
echo.
set /p telegram_token="🤖 Введите TELEGRAM_BOT_TOKEN: "
set /p jwt_secret="🔑 Введите JWT_SECRET (или Enter для автогенерации): "

if "%jwt_secret%"=="" (
  REM Генерируем случайный JWT secret
  set jwt_secret=jwt_%random%_%random%_%random%_miniapp_secret_key
)

echo 📝 Устанавливаем переменные...
railway variables set TELEGRAM_BOT_TOKEN=%telegram_token%
railway variables set JWT_SECRET=%jwt_secret%
railway variables set NODE_ENV=production
railway variables set PORT=3000

echo.
echo 🚀 ЗАПУСКАЕМ ДЕПЛОЙ...
railway up

echo.
echo ✅ ДЕПЛОЙ ЗАВЕРШЕН!
echo.
echo 📋 ДАЛЬНЕЙШИЕ ШАГИ:
echo 1. Скопируйте URL проекта: railway status
echo 2. Настройте webhook:
echo    curl "https://api.telegram.org/bot%telegram_token%/setWebhook?url=https://ваш-проект.up.railway.app/webhook/telegram"
echo 3. Протестируйте бота в Telegram
echo.

:end
echo 🎉 ГОТОВО! Ваш Telegram Mini App развернут на Railway!
echo.
pause 