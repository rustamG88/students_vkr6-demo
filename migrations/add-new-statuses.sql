-- Add new task statuses for enhanced calendar functionality
-- This migration adds "Under Review" and "Postponed" statuses

-- Insert new statuses if they don't exist
INSERT IGNORE INTO task_statuses (id, name, color, created_at, updated_at) VALUES
(5, 'На рассмотрении', '#FFC107', NOW(), NOW()),
(6, 'Отложено', '#FF9500', NOW(), NOW());

-- Update existing status colors for better visibility
UPDATE task_statuses SET color = '#8E8E93' WHERE id = 1 AND name = 'Без статуса';
UPDATE task_statuses SET color = '#007AFF' WHERE id = 2 AND name = 'В процессе';
UPDATE task_statuses SET color = '#FF3B30' WHERE id = 3 AND name = 'Отменено';
UPDATE task_statuses SET color = '#34C759' WHERE id = 4 AND name = 'Завершено';

-- Verify the statuses
SELECT id, name, color FROM task_statuses ORDER BY id; 