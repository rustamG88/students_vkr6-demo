const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  try {
    // Создаем подключение к базе данных
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('✅ Connected to database');

    // Читаем SQL файл для создания таблиц
    const sqlPath = path.join(__dirname, 'database_complete_setup.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Разделяем SQL на отдельные команды
      const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
      
      console.log(`📝 Executing ${commands.length} SQL commands...`);
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i].trim();
        if (command) {
          try {
            await connection.execute(command);
            console.log(`✅ Command ${i + 1}/${commands.length} executed`);
          } catch (error) {
            console.warn(`⚠️ Command ${i + 1} failed (might be expected):`, error.message);
          }
        }
      }
    } else {
      console.log('⚠️ SQL setup file not found, creating basic tables...');
      
      // Создаем основные таблицы если файл не найден
      await createBasicTables(connection);
    }

    await connection.end();
    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createBasicTables(connection) {
  const tables = [
    // Teams table
    `CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id INT,
      invite_code VARCHAR(10) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      username VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      position VARCHAR(255),
      company VARCHAR(255),
      department VARCHAR(255),
      bio TEXT,
      birthday DATE,
      avatar_url TEXT,
      team_id INT,
      is_active BOOLEAN DEFAULT TRUE,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )`,
    
    // Task statuses
    `CREATE TABLE IF NOT EXISTS task_statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(7) DEFAULT '#007AFF',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0
    )`,
    
    // Task priorities
    `CREATE TABLE IF NOT EXISTS task_priorities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      color VARCHAR(7) DEFAULT '#007AFF',
      level INT DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE
    )`,
    
    // Tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INT,
      created_by INT NOT NULL,
      status_id INT DEFAULT 1,
      priority_id INT DEFAULT 2,
      due_date DATETIME,
      is_personal BOOLEAN DEFAULT FALSE,
      hidden_for_assignee BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (status_id) REFERENCES task_statuses(id),
      FOREIGN KEY (priority_id) REFERENCES task_priorities(id)
    )`,
    
    // Employee notes
    `CREATE TABLE IF NOT EXISTS employee_notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      text TEXT NOT NULL,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const table of tables) {
    await connection.execute(table);
  }

  // Insert default data
  await connection.execute(`
    INSERT IGNORE INTO task_statuses (id, name, color) VALUES 
    (1, 'Новая', '#FF9500'),
    (2, 'В работе', '#007AFF'),
    (3, 'На проверке', '#FF3B30'),
    (4, 'Выполнена', '#34C759')
  `);

  await connection.execute(`
    INSERT IGNORE INTO task_priorities (id, name, color, level) VALUES 
    (1, 'Низкий', '#8E8E93', 1),
    (2, 'Средний', '#007AFF', 2),
    (3, 'Высокий', '#FF9500', 3),
    (4, 'Критический', '#FF3B30', 4)
  `);
}

// Запускаем инициализацию если файл вызван напрямую
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 