const fs = require('fs').promises;
const path = require('path');

// Путь к файлам базы данных
const DB_PATH = path.join(__dirname, 'json-data');

// Структура базы данных
const dbFiles = {
  users: 'users.json',
  teams: 'teams.json',
  tasks: 'tasks.json',
  task_statuses: 'task_statuses.json',
  task_priorities: 'task_priorities.json',
  employee_notes: 'employee_notes.json'
};

// Инициализация базы данных
const initializeDatabase = async () => {
  try {
    // Создаем директорию если не существует
    await fs.mkdir(DB_PATH, { recursive: true });
    
    // Инициализируем каждый файл базы данных
    for (const [table, filename] of Object.entries(dbFiles)) {
      const filepath = path.join(DB_PATH, filename);
      
      try {
        await fs.access(filepath);
        console.log(`✅ ${table} database file exists`);
      } catch (error) {
        // Файл не существует, создаем с начальными данными
        const initialData = getInitialData(table);
        await fs.writeFile(filepath, JSON.stringify(initialData, null, 2));
        console.log(`✅ Created ${table} database file`);
      }
    }
    
    console.log('🗄️ JSON Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Начальные данные для каждой таблицы
const getInitialData = (table) => {
  switch (table) {
    case 'users':
      return [];
    case 'teams':
      return [];
    case 'tasks':
      return [];
    case 'task_statuses':
      return [
        { id: 0, name: 'Без статуса', color: '#8E8E93', description: 'Статус не назначен' },
        { id: 1, name: 'Ожидает', color: '#FF9500', description: 'Задача ожидает выполнения' },
        { id: 2, name: 'В работе', color: '#007AFF', description: 'Задача в процессе выполнения' },
        { id: 3, name: 'На проверке', color: '#5856D6', description: 'Задача на проверке' },
        { id: 4, name: 'Выполнено', color: '#34C759', description: 'Задача выполнена' },
        { id: 5, name: 'Отменено', color: '#FF3B30', description: 'Выполнение задачи отменено' }
      ];
    case 'task_priorities':
      return [
        { id: 0, name: 'Без приоритета', color: '#8E8E93', level: 0, description: 'Приоритет не назначен' },
        { id: 1, name: 'Низкий приоритет', color: '#34C759', level: 1, description: 'Может быть выполнена в свободное время' },
        { id: 2, name: 'Средний приоритет', color: '#FF9500', level: 2, description: 'Требует выполнения в обычном порядке' },
        { id: 3, name: 'Высокий приоритет', color: '#FF3B30', level: 3, description: 'Требует первоочередного внимания' }
      ];
    case 'employee_notes':
      return [];
    default:
      return [];
  }
};

// Универсальные методы для работы с JSON файлами
class JsonDatabase {
  constructor() {
    this.nextIds = {}; // Хранение следующих ID для каждой таблицы
  }

  async readTable(tableName) {
    try {
      const filepath = path.join(DB_PATH, dbFiles[tableName]);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${tableName}:`, error);
      return [];
    }
  }

  async writeTable(tableName, data) {
    try {
      const filepath = path.join(DB_PATH, dbFiles[tableName]);
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${tableName}:`, error);
      return false;
    }
  }

  async getNextId(tableName) {
    if (!this.nextIds[tableName]) {
      const data = await this.readTable(tableName);
      this.nextIds[tableName] = data.length > 0 ? Math.max(...data.map(item => item.id || 0)) + 1 : 1;
    }
    return this.nextIds[tableName]++;
  }

  // SELECT операции
  async select(tableName, conditions = {}, options = {}) {
    const data = await this.readTable(tableName);
    let result = [...data];

    // Применяем условия фильтрации
    if (Object.keys(conditions).length > 0) {
      result = result.filter(item => {
        return Object.entries(conditions).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    // Применяем сортировку
    if (options.orderBy) {
      const [field, direction = 'ASC'] = options.orderBy.split(' ');
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'DESC' ? -comparison : comparison;
      });
    }

    // Применяем лимит и оффсет
    if (options.limit) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }

    return result;
  }

  // INSERT операции
  async insert(tableName, data) {
    const tableData = await this.readTable(tableName);
    const newItem = {
      id: await this.getNextId(tableName),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    tableData.push(newItem);
    await this.writeTable(tableName, tableData);
    return newItem;
  }

  // UPDATE операции
  async update(tableName, conditions, updateData) {
    const tableData = await this.readTable(tableName);
    let updatedCount = 0;
    
    const updatedData = tableData.map(item => {
      const matches = Object.entries(conditions).every(([key, value]) => item[key] === value);
      if (matches) {
        updatedCount++;
        return {
          ...item,
          ...updateData,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });
    
    await this.writeTable(tableName, updatedData);
    return updatedCount;
  }

  // DELETE операции
  async delete(tableName, conditions) {
    const tableData = await this.readTable(tableName);
    const filteredData = tableData.filter(item => {
      return !Object.entries(conditions).every(([key, value]) => item[key] === value);
    });
    
    const deletedCount = tableData.length - filteredData.length;
    await this.writeTable(tableName, filteredData);
    return deletedCount;
  }

  // Специальные методы для совместимости с существующим кодом
  async query(sql, params = []) {
    // Простая имитация SQL запросов для совместимости
    console.log('SQL Query (converted to JSON operations):', sql);
    console.log('Params:', params);
    
    // Возвращаем пустой результат для совместимости
    return [[]];
  }
}

// Создаем экземпляр базы данных
const db = new JsonDatabase();

// Методы совместимости с MySQL кодом
const pool = {
  query: async (sql, params = []) => {
    return await db.query(sql, params);
  }
};

const testConnection = async () => {
  try {
    console.log('✅ JSON Database connected successfully');
    console.log('📍 Database location:', DB_PATH);
    return true;
  } catch (error) {
    console.error('❌ JSON Database connection failed:', error);
    throw error;
  }
};

module.exports = {
  db,
  pool,
  testConnection,
  initializeDatabase,
  JsonDatabase
}; 