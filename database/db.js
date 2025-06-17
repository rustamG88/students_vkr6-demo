// Переключаемся на JSON базу данных ТОЛЬКО
const USE_JSON_DB = true; // ВСЕГДА используем JSON

const { db, pool: jsonPool, testConnection: jsonTest, initializeDatabase } = require('./json-db');

const pool = {
  query: async (sql, params = []) => {
    // Заглушка для совместимости - все SQL запросы должны использовать db.select/insert/update/delete
    console.warn('⚠️ SQL query detected in JSON mode:', sql);
    return [[]];
  }
};

const testConnection = jsonTest;
const initDatabase = initializeDatabase;

module.exports = {
  pool,
  testConnection,
  initDatabase,
  db // Экспортируем JSON DB для прямого использования
}; 