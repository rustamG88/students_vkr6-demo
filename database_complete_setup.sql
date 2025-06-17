-- Полная настройка базы данных согласно ТЗ
-- Система управления корпоративными задачами

-- Добавляем новые статусы задач
INSERT IGNORE INTO task_statuses (id, name, color, description) VALUES 
(0, 'Без статуса', '#8E8E93', 'Статус не назначен'),
(1, 'Ожидает', '#FF9500', 'Задача ожидает выполнения'),
(2, 'В работе', '#007AFF', 'Задача в процессе выполнения'),
(3, 'На проверке', '#5856D6', 'Задача на проверке'),
(4, 'Выполнено', '#34C759', 'Задача выполнена'),
(5, 'Отменено', '#FF3B30', 'Выполнение задачи отменено');

-- Добавляем новые приоритеты задач
INSERT IGNORE INTO task_priorities (id, name, color, level, description) VALUES 
(0, 'Без приоритета', '#8E8E93', 0, 'Приоритет не назначен'),
(1, 'Низкий приоритет', '#34C759', 1, 'Может быть выполнена в свободное время'),
(2, 'Средний приоритет', '#FF9500', 2, 'Требует выполнения в обычном порядке'),
(3, 'Высокий приоритет', '#FF3B30', 3, 'Требует первоочередного внимания');

-- Создаем таблицу заметок о сотрудниках (если не существует)
CREATE TABLE IF NOT EXISTS employee_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    text TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Добавляем поле для заметок о себе в таблицу пользователей (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS about_me TEXT DEFAULT NULL COMMENT 'Описание о себе';

-- Добавляем поле для даты рождения (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthday DATE DEFAULT NULL COMMENT 'Дата рождения';

-- Добавляем поле для скрытия задач для исполнителя (если не существует)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS hidden_for_assignee BOOLEAN DEFAULT FALSE COMMENT 'Скрыта ли задача для исполнителя';

-- Обновляем задачи без статуса
UPDATE tasks SET status_id = 1 WHERE status_id IS NULL OR status_id = 0;

-- Обновляем задачи без приоритета
UPDATE tasks SET priority_id = 2 WHERE priority_id IS NULL OR priority_id = 0;

-- Добавляем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_tasks_hidden_for_assignee ON tasks(hidden_for_assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status_id, priority_id);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Создаем таблицу приглашений (если не существует)
CREATE TABLE IF NOT EXISTS invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    used_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_by (created_by)
);

-- Добавляем триггер для автоматического обновления updated_at
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS tr_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER IF NOT EXISTS tr_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Проверяем структуру данных
SELECT 'Database setup completed successfully' as status; 