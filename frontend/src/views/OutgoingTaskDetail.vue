<template>
  <div class="task-detail-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
        </svg>
      </button>
      <div class="title-container">
        <h1 class="title">{{ task?.title || 'Задача' }}</h1>
        <span class="subtitle">ИСХОДЯЩИЕ</span>
      </div>
      <button class="delete-btn" @click="showDeleteConfirmation">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#FF3B30"/>
        </svg>
      </button>
    </div>

    <!-- Task Content -->
    <div class="content" v-if="task">
      <!-- Task Description -->
      <div class="task-description-section">
        <h3 class="section-title">Описание задачи</h3>
        <p class="task-description">{{ task.text || task.title || 'Описание отсутствует' }}</p>
      </div>

      <!-- Recipients Info -->
      <div class="recipients-section">
        <h3 class="section-title">{{ getRecipientsTitle() }}</h3>
        
        <!-- Single Employee -->
        <div v-if="task.recipientType === 'employee'" class="recipient-info">
          <div class="recipient-avatar">
            <img v-if="task.recipient.avatar" :src="task.recipient.avatar" :alt="task.recipient.name" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              {{ getInitials(task.recipient.name) }}
            </div>
          </div>
          <div class="recipient-details">
            <h4 class="recipient-name">{{ task.recipient.name }}</h4>
            <p class="recipient-position">{{ task.recipient.position || 'Должность не указана' }}</p>
          </div>
        </div>

        <!-- Multiple Employees -->
        <div v-else-if="task.recipientType === 'employees'" class="recipients-list">
          <div v-for="employee in task.recipients" :key="employee.id" class="recipient-item">
            <div class="recipient-avatar">
              <img v-if="employee.avatar" :src="employee.avatar" :alt="employee.name" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                {{ getInitials(employee.name) }}
              </div>
            </div>
            <div class="recipient-details">
              <h4 class="recipient-name">{{ employee.name }}</h4>
              <p class="recipient-position">{{ employee.position || 'Должность не указана' }}</p>
            </div>
          </div>
        </div>

        <!-- Department -->
        <div v-else-if="task.recipientType === 'department'" class="department-info">
          <div class="department-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H20V19ZM20 15H12V13H20V15ZM20 11H12V9H20V11Z" fill="#007AFF"/>
            </svg>
          </div>
          <div class="department-details">
            <h4 class="department-name">{{ task.department.name }}</h4>
            <p class="department-description">{{ task.department.description || 'Отдел' }}</p>
          </div>
        </div>
      </div>

      <!-- Action Icons Section -->
      <div class="actions-section">
        <!-- Calendar Action -->
        <div class="action-item" @click="handleCalendarAction">
          <div class="action-icon calendar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#007AFF"/>
            </svg>
          </div>
          <div class="action-info">
            <div class="action-title">Календарь</div>
            <div class="action-subtitle">{{ getCalendarText() }}</div>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>

        <!-- Status Action -->
        <div class="action-item" @click="handleStatusAction">
          <div class="action-icon status-icon">
            <div class="status-indicator" :class="getStatusClass(task.status)"></div>
          </div>
          <div class="action-info">
            <div class="action-title">Статус</div>
            <div class="action-subtitle">{{ getStatusText(task.status) }}</div>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>

        <!-- Priority Action -->
        <div class="action-item" @click="handlePriorityAction">
          <div class="action-icon priority-icon">
            <div class="priority-indicator" :class="getPriorityClass(task.priority)"></div>
          </div>
          <div class="action-info">
            <div class="action-title">Приоритет</div>
            <div class="action-subtitle">{{ getPriorityText(task.priority) }}</div>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <p>Загрузка задачи...</p>
    </div>

    <!-- Calendar Modal -->
    <div class="modal-overlay" v-if="showCalendarModal" @click="closeCalendarModal">
      <div class="modal-content calendar-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ calendarModalTitle }}</h3>
          <button class="close-btn" @click="closeCalendarModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="task.assignedDate && task.assignedBy" class="scheduled-date-info">
            <div class="date-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#007AFF"/>
              </svg>
            </div>
            <div class="date-details">
              <p class="date-label">{{ getCalendarModalText() }}</p>
              <p class="date-value">{{ formatDate(task.assignedDate) }}</p>
            </div>
          </div>
          <div v-else class="no-date-info">
            <div class="no-date-icon">📅</div>
            <p class="no-date-text">Дата не назначена</p>
            <p class="no-date-description">Для этой задачи не была установлена дата выполнения.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Modal -->
    <div class="modal-overlay" v-if="showStatusModal" @click="closeStatusModal">
      <div class="modal-content status-modal" @click.stop>
        <div class="modal-header">
          <h3>Статус задачи</h3>
          <button class="close-btn" @click="closeStatusModal">×</button>
        </div>
        <div class="modal-body">
          <div class="current-status-info">
            <p class="current-status-label">Текущий статус задачи:</p>
            <div class="current-status-display">
              <div class="status-indicator" :class="getStatusClass(task.status)"></div>
              <span class="status-name">{{ getStatusText(task.status) }}</span>
            </div>
            <p class="status-description">{{ getStatusDescription(task.status) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Modal -->
    <div class="modal-overlay" v-if="showPriorityModal" @click="closePriorityModal">
      <div class="modal-content priority-modal" @click.stop>
        <div class="modal-header">
          <h3>Приоритет задачи</h3>
          <button class="close-btn" @click="closePriorityModal">×</button>
        </div>
        <div class="modal-body">
          <div class="current-priority-info">
            <p class="current-priority-label">Приоритет задачи:</p>
            <div class="current-priority-display">
              <div class="priority-indicator" :class="getPriorityClass(task.priority)"></div>
              <span class="priority-name">{{ getPriorityText(task.priority) }}</span>
            </div>
            <p class="priority-description">{{ getPriorityDescription(task.priority) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3>Удалить задачу</h3>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <p>Вы уверены, что хотите удалить эту задачу?</p>
            <p class="warning-text">Это действие нельзя отменить.</p>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn-modal" @click="closeDeleteModal">Отмена</button>
            <button class="delete-btn-modal" @click="deleteTask">Удалить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { tasksAPI } from '@/services/api'

export default {
  name: 'OutgoingTaskDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { showAlert, showConfirm } = useWebApp()
    
    // State
    const task = ref(null)
    const loading = ref(true)
    const showCalendarModal = ref(false)
    const showStatusModal = ref(false)
    const showPriorityModal = ref(false)
    const showDeleteModal = ref(false)

    // Mock outgoing task data
    const mockOutgoingTasks = {
      3: {
        id: 3,
        title: 'Проверить документы',
        text: 'Проверить и утвердить документы по новому проекту до конца недели. Особое внимание уделить разделам с финансовыми показателями.',
        status: 'completed',
        priority: 'low',
        createdAt: '2024-01-15T09:00:00Z',
        assignedDate: '2024-01-18',
        assignedBy: 'sender',
        recipientType: 'employee', // 'employee', 'employees', 'department'
        recipient: {
          id: 1,
          name: 'Анна Иванова',
          position: 'Менеджер по продажам',
          avatar: null
        }
      },
      6: {
        id: 6,
        title: 'Подготовить презентацию',
        text: 'Создать презентацию для клиента по новому продукту. Включить технические характеристики, преимущества и ценовую политику.',
        status: 'in_progress',
        priority: 'high',
        createdAt: '2024-01-14T14:30:00Z',
        assignedDate: null,
        assignedBy: null,
        recipientType: 'employees',
        recipients: [
          {
            id: 2,
            name: 'Михаил Петров',
            position: 'IT-специалист',
            avatar: null
          },
          {
            id: 3,
            name: 'Елена Сидорова',
            position: 'HR-менеджер',
            avatar: null
          }
        ]
      },
      7: {
        id: 7,
        title: 'Обновить процедуры',
        text: 'Пересмотреть и обновить внутренние процедуры отдела в соответствии с новыми требованиями компании.',
        status: 'pending',
        priority: 'medium',
        createdAt: '2024-01-13T10:15:00Z',
        assignedDate: '2024-01-25',
        assignedBy: 'recipient',
        recipientType: 'department',
        department: {
          id: 1,
          name: 'ИТ отдел',
          description: 'Отдел информационных технологий'
        }
      }
    }

    // Computed
    const calendarModalTitle = computed(() => {
      if (task.value?.assignedDate) {
        return task.value.assignedBy === 'sender' ? 'Дата назначена' : 'Дата установлена получателем'
      }
      return 'Дата не назначена'
    })

    // Methods
    const loadTask = async () => {
      try {
        const taskId = route.params.id
        const response = await tasksAPI.getById(taskId)
        
        if (response.data.success) {
          const apiTask = response.data.data
          
          // Transform API data to match component structure
          task.value = {
            id: apiTask.id,
            title: apiTask.title,
            text: apiTask.description || apiTask.title,
            status: apiTask.status_name?.toLowerCase().replace(/\s+/g, '_') || 'pending',
            priority: apiTask.priority_name?.toLowerCase() || 'medium',
            createdAt: apiTask.created_at,
            assignedDate: apiTask.due_date,
            assignedBy: apiTask.due_date ? 'sender' : null,
            recipientType: 'employee', // For now, simplified to single employee
            recipient: {
              id: apiTask.assigned_to,
              name: `${apiTask.assigned_first_name || ''} ${apiTask.assigned_last_name || ''}`.trim() || 'Получатель',
              position: 'Сотрудник',
              avatar: null
            }
          }
        } else {
          // Use mock data as fallback
          const taskId = parseInt(route.params.id)
          const mockTask = mockOutgoingTasks[taskId]
          
          if (mockTask) {
            task.value = { ...mockTask }
          } else {
            showAlert('Задача не найдена')
            router.push('/tasks')
          }
        }
      } catch (error) {
        console.error('Error loading task:', error)
        // Use mock data as fallback
        const taskId = parseInt(route.params.id)
        const mockTask = mockOutgoingTasks[taskId]
        
        if (mockTask) {
          task.value = { ...mockTask }
          showAlert('Ошибка при загрузке задачи. Используются демо-данные.')
        } else {
          showAlert('Задача не найдена')
          router.push('/tasks')
        }
      } finally {
        loading.value = false
      }
    }

    const getInitials = (name) => {
      if (!name) return 'N/A'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const getRecipientsTitle = () => {
      if (!task.value) return 'Получатели'
      
      switch (task.value.recipientType) {
        case 'employee':
          return 'Получатель'
        case 'employees':
          return 'Получатели'
        case 'department':
          return 'Отдел'
        default:
          return 'Получатели'
      }
    }

    const getStatusClass = (status) => {
      const classes = {
        'pending': 'status-pending',
        'in_progress': 'status-progress',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
      }
      return classes[status] || 'status-pending'
    }

    const getStatusText = (status) => {
      const texts = {
        'pending': 'Ожидает',
        'in_progress': 'В работе',
        'completed': 'Выполнено',
        'cancelled': 'Отменено'
      }
      return texts[status] || 'Неизвестно'
    }

    const getStatusDescription = (status) => {
      const descriptions = {
        'pending': 'Задача ожидает выполнения получателем',
        'in_progress': 'Задача находится в процессе выполнения',
        'completed': 'Задача успешно выполнена',
        'cancelled': 'Выполнение задачи было отменено'
      }
      return descriptions[status] || 'Статус задачи'
    }

    const getPriorityClass = (priority) => {
      const classes = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high'
      }
      return classes[priority] || 'priority-medium'
    }

    const getPriorityText = (priority) => {
      const texts = {
        'low': 'Низкий приоритет',
        'medium': 'Средний приоритет',
        'high': 'Высокий приоритет'
      }
      return texts[priority] || 'Средний приоритет'
    }

    const getPriorityDescription = (priority) => {
      const descriptions = {
        'low': 'Задача может быть выполнена в свободное время',
        'medium': 'Задача требует выполнения в обычном порядке',
        'high': 'Задача требует первоочередного внимания'
      }
      return descriptions[priority] || 'Приоритет задачи'
    }

    const getCalendarText = () => {
      if (task.value?.assignedDate) {
        if (task.value.assignedBy === 'sender') {
          return `Вы назначили на ${formatDate(task.value.assignedDate)}`
        } else {
          return `Получатель назначил на ${formatDate(task.value.assignedDate)}`
        }
      }
      return 'Дата не назначена'
    }

    const getCalendarModalText = () => {
      if (task.value.assignedBy === 'sender') {
        return 'Вы назначили задачу на:'
      } else {
        return 'Получатель назначил задачу на:'
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const handleCalendarAction = () => {
      showCalendarModal.value = true
    }

    const handleStatusAction = () => {
      showStatusModal.value = true
    }

    const handlePriorityAction = () => {
      showPriorityModal.value = true
    }

    const closeCalendarModal = () => {
      showCalendarModal.value = false
    }

    const closeStatusModal = () => {
      showStatusModal.value = false
    }

    const closePriorityModal = () => {
      showPriorityModal.value = false
    }

    const showDeleteConfirmation = async () => {
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
    }

    const deleteTask = async () => {
      try {
        // Исходящие задачи удаляются полностью создателем
        const response = await tasksAPI.delete(task.value.id)
        
        if (response.data?.success || response.status === 200) {
          showAlert('Задача удалена!')
          // Возвращаемся к списку задач с активной вкладкой "ИСХОДЯЩИЕ"
          router.push('/tasks?tab=outgoing')
        } else {
          throw new Error(response.data?.message || 'Неизвестная ошибка')
        }
      } catch (error) {
        console.error('Error deleting outgoing task:', error)
        const errorMessage = error.response?.data?.message || 'Ошибка при удалении задачи'
        showAlert(errorMessage)
      } finally {
        showDeleteModal.value = false
      }
    }

    const goBack = () => {
      // Возвращаемся к списку задач с активной вкладкой "ИСХОДЯЩИЕ"
      router.push('/tasks?tab=outgoing')
    }

    // Lifecycle
    onMounted(() => {
      loadTask()
    })

    return {
      task,
      loading,
      showCalendarModal,
      showStatusModal,
      showPriorityModal,
      showDeleteModal,
      calendarModalTitle,
      loadTask,
      getInitials,
      getRecipientsTitle,
      getStatusClass,
      getStatusText,
      getStatusDescription,
      getPriorityClass,
      getPriorityText,
      getPriorityDescription,
      getCalendarText,
      getCalendarModalText,
      formatDate,
      handleCalendarAction,
      handleStatusAction,
      handlePriorityAction,
      closeCalendarModal,
      closeStatusModal,
      closePriorityModal,
      showDeleteConfirmation,
      closeDeleteModal,
      deleteTask,
      goBack
    }
  }
}
</script>

<style scoped>
.task-detail-screen {
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  padding-top: calc(8px + env(safe-area-inset-top));
  background: #000000;
  border-bottom: 1px solid #2C2C2E;
}

.back-btn, .delete-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.back-btn:hover, .delete-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.title {
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.subtitle {
  color: #8E8E93;
  font-size: 13px;
  margin: 0;
  line-height: 1;
}

.content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.task-description-section {
  margin-bottom: 24px;
}

.section-title {
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.task-description {
  color: #FFFFFF;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.recipients-section {
  margin-bottom: 32px;
}

.recipient-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
}

.recipient-details {
  flex: 1;
}

.recipient-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.recipient-position {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
}

.recipients-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recipient-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1C1C1E;
  border-radius: 12px;
}

.department-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.department-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(0, 122, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.department-details {
  flex: 1;
}

.department-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.department-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #1C1C1E;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:active {
  background: #2C2C2E;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.calendar-icon {
  background: rgba(0, 122, 255, 0.2);
}

.status-icon {
  background: rgba(52, 199, 89, 0.2);
}

.priority-icon {
  background: rgba(255, 149, 0, 0.2);
}

.action-info {
  flex: 1;
}

.action-title {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.action-subtitle {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.action-arrow {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-indicator,
.priority-indicator {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  flex-shrink: 0;
}

.status-pending {
  background: #FF9500;
}

.status-progress {
  background: #007AFF;
}

.status-completed {
  background: #34C759;
}

.status-cancelled {
  background: #FF3B30;
}

.priority-low {
  background: #8E8E93;
}

.priority-medium {
  background: #FF9500;
}

.priority-high {
  background: #FF3B30;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #2C2C2E;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #8E8E93;
  font-size: 16px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #1C1C1E;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid #2C2C2E;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.close-btn {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

/* Calendar Modal Styles */
.scheduled-date-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #2C2C2E;
  border-radius: 12px;
}

.date-icon {
  flex-shrink: 0;
}

.date-details {
  flex: 1;
}

.date-label {
  color: #8E8E93;
  font-size: 14px;
  margin: 0 0 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-value {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.no-date-info {
  text-align: center;
  padding: 20px;
}

.no-date-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-date-text {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.no-date-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Status Modal Styles */
.current-status-info {
  text-align: center;
  padding: 16px;
  background: #2C2C2E;
  border-radius: 12px;
}

.current-status-label {
  color: #8E8E93;
  font-size: 14px;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.current-status-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-name {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Priority Modal Styles */
.current-priority-info {
  text-align: center;
  padding: 16px;
  background: #2C2C2E;
  border-radius: 12px;
}

.current-priority-label {
  color: #8E8E93;
  font-size: 14px;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.current-priority-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.priority-name {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.priority-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Delete Modal Styles */
.delete-warning {
  text-align: center;
  margin-bottom: 24px;
}

.warning-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.delete-warning p {
  color: #FFFFFF;
  font-size: 16px;
  margin: 0 0 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.warning-text {
  color: #8E8E93;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn-modal,
.delete-btn-modal {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cancel-btn-modal {
  background: #2C2C2E;
  color: #FFFFFF;
}

.delete-btn-modal {
  background: #FF3B30;
  color: #FFFFFF;
}

.cancel-btn-modal:active {
  background: #3A3A3C;
}

.delete-btn-modal:active {
  background: #D70015;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }
  
  .recipient-info,
  .recipient-item {
    padding: 12px;
  }
  
  .recipient-avatar {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
  
  .recipient-name {
    font-size: 16px;
  }
  
  .recipient-position {
    font-size: 14px;
  }
  
  .action-item {
    padding: 12px;
  }
  
  .action-icon {
    width: 36px;
    height: 36px;
    border-radius: 18px;
  }
}
</style> 