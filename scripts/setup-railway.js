#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up project for Railway deployment...\n');

// 1. Проверяем наличие необходимых файлов
const requiredFiles = [
  'package.json',
  'server.js',
  'app.js',
  'database/db.js'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    process.exit(1);
  }
}

// 2. Создаем .railwayignore если не существует
const railwayIgnore = `# Railway ignore file
node_modules/
.env*
.git/
*.log
coverage/
test-results/
playwright-report/
uploads/
mysql_data/
docker-compose.yml
Dockerfile
.dockerignore
ngrok*
tunnels.json
*.tmp
*.temp
.DS_Store
Thumbs.db
`;

if (!fs.existsSync('.railwayignore')) {
  fs.writeFileSync('.railwayignore', railwayIgnore);
  console.log('✅ Created .railwayignore');
} else {
  console.log('✅ .railwayignore already exists');
}

// 3. Проверяем package.json scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (!packageJson.scripts.start) {
  console.log('❌ Missing "start" script in package.json');
  process.exit(1);
}

if (!packageJson.scripts['db:init']) {
  console.log('⚠️ Missing "db:init" script - adding it...');
  packageJson.scripts['db:init'] = 'node database/init-db.js';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

console.log('✅ Package.json scripts are ready');

// 4. Создаем инструкцию по переменным окружения
const envInstructions = `
🔧 RAILWAY ENVIRONMENT VARIABLES SETUP
=====================================

После создания проекта на Railway, добавьте эти переменные в разделе "Variables":

📊 DATABASE (скопируйте из Railway MySQL service):
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_NAME=railway
DB_USER=root
DB_PASSWORD=<generated_password>

🔐 SECURITY:
JWT_SECRET=<generate_random_32_char_string>
NODE_ENV=production

🤖 TELEGRAM:
TELEGRAM_BOT_TOKEN=<your_bot_token_from_botfather>

🌐 FRONTEND:
FRONTEND_URL=https://<your-app-name>.up.railway.app

⚡ OPTIONAL:
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880

📝 STEPS AFTER DEPLOYMENT:
1. Go to Railway Dashboard
2. Find your app URL (e.g., https://your-app.up.railway.app)
3. Open @BotFather in Telegram
4. Run: /setdomain
5. Select your bot
6. Enter: your-app.up.railway.app (without https://)
7. Test your bot!

🔧 DATABASE INITIALIZATION:
After first deployment, run in Railway console:
npm run db:init
`;

fs.writeFileSync('RAILWAY_ENV_SETUP.txt', envInstructions);
console.log('✅ Created RAILWAY_ENV_SETUP.txt with instructions');

// 5. Проверяем конфигурацию базы данных
const dbConfig = fs.readFileSync('database/db.js', 'utf8');
if (!dbConfig.includes('ssl:') || !dbConfig.includes('NODE_ENV')) {
  console.log('⚠️ Database config might need SSL settings for Railway');
  console.log('   Check database/db.js for SSL configuration');
}

console.log('\n🎉 Railway setup completed!');
console.log('\n📋 NEXT STEPS:');
console.log('1. Commit all changes to Git');
console.log('2. Push to GitHub');
console.log('3. Go to railway.app');
console.log('4. Create new project from GitHub repo');
console.log('5. Add MySQL database service');
console.log('6. Configure environment variables (see RAILWAY_ENV_SETUP.txt)');
console.log('7. Deploy and test!');
console.log('\n📖 Full instructions: see RAILWAY_DEPLOY.md'); 