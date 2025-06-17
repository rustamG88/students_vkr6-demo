<template>
  <div class="task-detail-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="handleBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
        </svg>
      </button>
      <div class="title-container">
        <h1 class="title">{{ task?.title || 'Задача' }}</h1>
        <span class="subtitle">{{ getTaskTypeTitle() }}</span>
      </div>
      <button class="delete-btn" @click="confirmDeleteTask">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#FF3B30"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="content" v-if="task">
      <!-- Task Description -->
      <div class="task-description-section">
        <h3 class="section-title">Описание задачи</h3>
        <p class="task-description">{{ task.description || task.title || 'Описание отсутствует' }}</p>
      </div>

      <!-- Employee Info Section -->
      <div class="employee-section" v-if="getEmployeeInfo()">
        <h3 class="section-title">Информация о сотруднике</h3>
        <div class="employee-info">
          <div class="employee-avatar">
            <img v-if="getEmployeeInfo().avatar" :src="getEmployeeInfo().avatar" :alt="getEmployeeInfo().name" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              {{ getInitials(getEmployeeInfo().name || 'N') }}
            </div>
          </div>
          <div class="employee-details">
            <div class="employee-name">{{ getEmployeeInfo().name || 'Неизвестно' }}</div>
            <div class="employee-position">{{ getEmployeeInfo().position || 'Должность' }}</div>
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
          <h3>{{ getCalendarModalTitle() }}</h3>
          <button class="close-btn" @click="closeCalendarModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="task?.scheduledDate" class="scheduled-info">
            <div class="scheduled-date-info">
              <div class="date-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#007AFF"/>
                </svg>
              </div>
              <div class="date-details">
                <p class="date-label">{{ getScheduledDateLabel() }}</p>
                <p class="date-value">{{ formatScheduledDate() }}</p>
              </div>
            </div>
            <div class="modal-actions">
              <button class="calendar-btn" @click="goToCalendar">Перейти в календарь</button>
              <button v-if="task.scheduledBy !== 'sender'" class="change-date-btn" @click="showDatePicker">Изменить дату</button>
            </div>
          </div>
          <div v-else class="date-picker-section">
            <p class="picker-title">Выберите дату для задачи:</p>
            <div class="calendar-container">
              <div class="calendar-header">
                <button class="nav-btn" @click="previousMonth">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
                  </svg>
                </button>
                <span class="month-year">{{ formatMonthYear(currentCalendarDate) }}</span>
                <button class="nav-btn" @click="nextMonth">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="#007AFF"/>
                  </svg>
                </button>
              </div>
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
                </div>
                <div class="calendar-days">
                  <div 
                    v-for="date in calendarDays" 
                    :key="date.key"
                    class="calendar-day"
                    :class="{ 
                      'other-month': !date.isCurrentMonth,
                      'selected': isDateSelected(date.date),
                      'today': isToday(date.date)
                    }"
                    @click="selectDate(date.date)"
                  >
                    {{ date.day }}
                  </div>
                </div>
              </div>
              <div class="calendar-actions">
                <button class="apply-btn" @click="applyDate" :disabled="!tempSelectedDate">
                  Применить
                </button>
              </div>
            </div>
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
            <p class="current-status-label">Текущий статус:</p>
            <div class="current-status-display">
              <div class="status-indicator" :class="getStatusClass(task?.status)"></div>
              <span class="status-name">{{ getStatusText(task?.status) }}</span>
            </div>
          </div>
          <div class="status-options">
            <div 
              v-for="status in statusOptions" 
              :key="status.value"
              class="status-option"
              :class="{ 'selected': task?.status === status.value }"
              @click="changeStatus(status.value)"
            >
              <div class="status-indicator" :class="getStatusClass(status.value)"></div>
              <div class="status-info">
                <span class="status-name">{{ status.name }}</span>
                <span class="status-description">{{ status.description }}</span>
              </div>
              <div class="option-check" :class="{ 'selected': task?.status === status.value }">
                <svg v-if="task?.status === status.value" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
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
            <p class="current-priority-label">Текущий приоритет:</p>
            <div class="current-priority-display">
              <div class="priority-indicator" :class="getPriorityClass(task?.priority)"></div>
              <span class="priority-name">{{ getPriorityText(task?.priority) }}</span>
            </div>
          </div>
          <div class="priority-options">
            <div 
              v-for="priority in priorityOptions" 
              :key="priority.value"
              class="priority-option"
              :class="{ 'selected': task?.priority === priority.value, 'disabled': !canChangePriority() }"
              @click="changePriority(priority.value)"
            >
              <div class="priority-indicator" :class="getPriorityClass(priority.value)"></div>
              <div class="priority-info">
                <span class="priority-name">{{ priority.name }}</span>
                <span class="priority-description">{{ priority.description }}</span>
              </div>
              <div class="option-check" :class="{ 'selected': task?.priority === priority.value }">
                <svg v-if="task?.priority === priority.value" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
          </div>
          <div v-if="!canChangePriority()" class="priority-note">
            <p>💡 Приоритет может изменить только отправитель задачи</p>
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
import { calendarAPI, tasksAPI } from '@/services/api'

export default {
  name: 'TaskDetail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { showAlert, showConfirm } = useWebApp()
    
    // State
    const task = ref(null)
    const showCalendarModal = ref(false)
    const showStatusModal = ref(false)
    const showPriorityModal = ref(false)
    const showDeleteModal = ref(false)
    const currentCalendarDate = ref(new Date())
    const tempSelectedDate = ref(null)
    
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    
    // Mock task data
    const mockTask = {
      id: 1,
      title: 'Подготовить отчет по продажам',
      description: 'Необходимо подготовить ежемесячный отчет по продажам за январь. Включить анализ трендов и рекомендации по улучшению показателей. Отчет должен содержать детальную статистику по каждому менеджеру и общие показатели отдела.',
      status: 'pending',
      priority: 'medium',
      type: 'incoming', // incoming, outgoing, personal
      sender: {
        id: 1,
        name: 'Анна Иванова',
        position: 'Менеджер по продажам',
        avatar: null
      },
      assignee: null,
      scheduledDate: null,
      scheduledBy: null, // 'sender' or 'receiver'
      createdAt: new Date().toISOString()
    }
    
    const statusOptions = ref([
      { value: 'pending', name: 'Ожидает', description: 'Задача ожидает выполнения' },
      { value: 'in_progress', name: 'В работе', description: 'Задача выполняется' },
      { value: 'completed', name: 'Выполнено', description: 'Задача завершена' },
      { value: 'cancelled', name: 'Отменено', description: 'Задача отменена' }
    ])
    
    const priorityOptions = ref([
      { value: 'low', name: 'Низкий приоритет', description: 'Может быть выполнена в свободное время' },
      { value: 'medium', name: 'Средний приоритет', description: 'Требует выполнения в обычном порядке' },
      { value: 'high', name: 'Высокий приоритет', description: 'Требует первоочередного внимания' }
    ])
    
    // Computed
    const calendarDays = computed(() => {
      const year = currentCalendarDate.value.getFullYear()
      const month = currentCalendarDate.value.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const days = []
      const current = new Date(startDate)
      
      for (let i = 0; i < 42; i++) {
        days.push({
          date: new Date(current),
          day: current.getDate(),
          isCurrentMonth: current.getMonth() === month,
          key: current.toISOString()
        })
        current.setDate(current.getDate() + 1)
      }
      
      return days
    })
    
    // Methods
    const getInitials = (name) => {
      if (!name) return 'N'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    
    const getTaskTypeTitle = () => {
      if (!task.value) return ''
      switch (task.value.type) {
        case 'incoming': return 'ВХОДЯЩИЕ'
        case 'outgoing': return 'ИСХОДЯЩИЕ'
        case 'personal': return 'ЛИЧНЫЕ'
        default: return 'ЗАДАЧИ'
      }
    }
    
    const getEmployeeInfo = () => {
      if (!task.value) return null
      return task.value.type === 'incoming' ? task.value.sender : task.value.assignee
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
    
    const getPriorityClass = (priority) => {
      const classes = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high'
      }
      return classes[priority] || 'priority-medium'
    }
    
    const formatMonthYear = (date) => {
      return date.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric'
      })
    }
    
    const isToday = (date) => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }
    
    const isDateSelected = (date) => {
      return tempSelectedDate.value && date.toDateString() === tempSelectedDate.value.toDateString()
    }
    
    const getCalendarModalTitle = () => {
      if (task.value?.scheduledDate) {
        return 'Дата задачи'
      }
      return 'Выберите дату'
    }
    
    const getScheduledDateInfo = () => {
      if (!task.value?.scheduledDate) return ''
      const date = new Date(task.value.scheduledDate).toLocaleDateString('ru-RU')
      if (task.value.scheduledBy === 'sender') {
        return `Отправитель назначил задачу на ${date}`
      }
      return `Вы назначили задачу на ${date}`
    }
    
    const canChangePriority = () => {
      return task.value?.type === 'personal' || task.value?.type === 'outgoing'
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
    
    const getPriorityText = (priority) => {
      const texts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
      }
      return texts[priority] || 'Средний'
    }
    
    const getCalendarText = () => {
      if (!task.value?.scheduledDate) {
        return 'Дата не назначена'
      }
      const date = new Date(task.value.scheduledDate).toLocaleDateString('ru-RU')
      return `Назначено на ${date}`
    }
    
    const getScheduledDateLabel = () => {
      if (!task.value?.scheduledDate) return ''
      if (task.value.scheduledBy === 'sender') {
        return 'Отправитель назначил задачу на:'
      }
      return 'Вы назначили задачу на:'
    }
    
    const formatScheduledDate = () => {
      if (!task.value?.scheduledDate) return ''
      return new Date(task.value.scheduledDate).toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // Actions
    const handleCancel = () => {
      router.push('/tasks')
    }
    
    const handleBack = () => {
      // Определяем правильный экран для возврата на основе типа задачи
      if (task.value?.type === 'personal') {
        router.push('/tasks?tab=personal')
      } else if (task.value?.type === 'outgoing') {
        router.push('/tasks?tab=outgoing')
      } else {
        router.push('/tasks?tab=incoming')
      }
    }
    
    const handleEditTask = () => {
      // Navigate to edit task screen
      router.push(`/tasks/${task.value.id}/edit`)
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
    
    const confirmDeleteTask = () => {
      // Проверяем статус задачи перед удалением
      if (task.value?.status !== 'completed') {
        showAlert('Задачу можно удалить только после перемещения в статус "Выполнено". Переместите задачу в статус "Выполнено" и попробуйте снова.')
        return
      }
      
      showDeleteModal.value = true
    }
    
    // Calendar methods
    const closeCalendarModal = () => {
      showCalendarModal.value = false
      tempSelectedDate.value = null
    }
    
    const previousMonth = () => {
      currentCalendarDate.value = new Date(currentCalendarDate.value.getFullYear(), currentCalendarDate.value.getMonth() - 1, 1)
    }
    
    const nextMonth = () => {
      currentCalendarDate.value = new Date(currentCalendarDate.value.getFullYear(), currentCalendarDate.value.getMonth() + 1, 1)
    }
    
    const selectDate = (date) => {
      tempSelectedDate.value = new Date(date)
    }
    
    const applyDate = async () => {
      if (tempSelectedDate.value && task.value) {
        try {
          const dateToSchedule = tempSelectedDate.value.toISOString()
          
          console.log('Setting task date:', { taskId: task.value.id, date: dateToSchedule })
          
          // Call API to update task with due date
          const response = await tasksAPI.update(task.value.id, {
            due_date: dateToSchedule
          })
          
          if (response.data.success) {
            // Update local state
            task.value.scheduledDate = dateToSchedule
            task.value.scheduledBy = 'receiver'
            
            closeCalendarModal()
            showAlert('Дата задачи установлена!')
          } else {
            throw new Error(response.data.message || 'API returned unsuccessful response')
          }
        } catch (error) {
          console.error('Error scheduling task:', error)
          showAlert('Ошибка при установке даты задачи: ' + (error.response?.data?.message || error.message))
        }
      }
    }
    
    const showDatePicker = () => {
      task.value.scheduledDate = null
      task.value.scheduledBy = null
    }
    
    const goToCalendar = () => {
      closeCalendarModal()
      router.push('/calendar')
    }
    
    // Status methods
    const closeStatusModal = () => {
      showStatusModal.value = false
    }
    
    const changeStatus = async (newStatus) => {
      if (!task.value) return
      
      try {
        // Map status names to IDs - добавляем "без статуса"
        const statusMap = {
          'no_status': 0,
          'pending': 1,
          'in_progress': 2,
          'on_review': 3,
          'completed': 4,
          'cancelled': 5
        }
        
        const statusId = statusMap[newStatus]
        if (statusId === undefined) {
          throw new Error('Invalid status: ' + newStatus)
        }
        
        console.log('Updating task status:', { taskId: task.value.id, newStatus, statusId })
        
        // Call API to update status using the correct endpoint
        const response = await tasksAPI.updateStatus(task.value.id, {
          status_id: statusId
        })
        
        if (response.data.success) {
          // Update local state
          task.value.status = newStatus
          
          closeStatusModal()
          showAlert('Статус задачи изменен!')
        } else {
          throw new Error(response.data.message || 'API returned unsuccessful response')
        }
      } catch (error) {
        console.error('Error updating task status:', error)
        showAlert('Ошибка при изменении статуса задачи: ' + (error.response?.data?.message || error.message))
      }
    }
    
    // Priority methods
    const closePriorityModal = () => {
      showPriorityModal.value = false
    }
    
    const changePriority = async (newPriority) => {
      if (!canChangePriority()) {
        showAlert('У вас нет прав изменять приоритет этой задачи')
        return
      }
      
      try {
        // Map priority names to IDs
        const priorityMap = {
          'low': 1,
          'medium': 2,
          'high': 3
        }
        
        const priorityId = priorityMap[newPriority]
        if (!priorityId) {
          throw new Error('Invalid priority')
        }
        
        // Call API to update priority
        await tasksAPI.update(task.value.id, {
          priority_id: priorityId
        })
        
        // Update local state
        task.value.priority = newPriority
        
        closePriorityModal()
        showAlert('Приоритет задачи изменен!')
      } catch (error) {
        console.error('Error updating task priority:', error)
        showAlert('Ошибка при изменении приоритета задачи')
      }
    }
    
    // Delete methods
    const closeDeleteModal = () => {
      showDeleteModal.value = false
    }
    
    const deleteTask = async () => {
      try {
        // Call API to delete task
        await tasksAPI.delete(task.value.id)
        
        closeDeleteModal()
        showAlert('Задача удалена!')
        router.push('/tasks')
      } catch (error) {
        console.error('Error deleting task:', error)
        showAlert('Ошибка при удалении задачи')
        closeDeleteModal()
      }
    }
    
    // Load task from API
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
            description: apiTask.description || 'Описание отсутствует',
            status: apiTask.status_name?.toLowerCase().replace(/\s+/g, '_') || 'pending',
            priority: apiTask.priority_name?.toLowerCase() || 'medium',
            type: apiTask.is_personal ? 'personal' : (apiTask.assigned_to === apiTask.created_by ? 'outgoing' : 'incoming'),
            sender: {
              id: apiTask.created_by,
              name: `${apiTask.creator_first_name || ''} ${apiTask.creator_last_name || ''}`.trim() || 'Отправитель',
              position: 'Сотрудник',
              avatar: null
            },
            assignee: {
              id: apiTask.assigned_to,
              name: `${apiTask.assigned_first_name || ''} ${apiTask.assigned_last_name || ''}`.trim() || 'Получатель',
              position: 'Сотрудник',
              avatar: null
            },
            scheduledDate: apiTask.due_date,
            scheduledBy: apiTask.due_date ? 'sender' : null,
            createdAt: apiTask.created_at
          }
        } else {
          // Use mock data as fallback
          task.value = { ...mockTask, id: taskId }
          showAlert('Ошибка при загрузке задачи. Используются демо-данные.')
        }
      } catch (error) {
        console.error('Error loading task:', error)
        // Use mock data as fallback
        const taskId = route.params.id
        task.value = { ...mockTask, id: taskId }
        showAlert('Ошибка при загрузке задачи. Используются демо-данные.')
      }
    }

    // Initialize
    onMounted(() => {
      loadTask()
    })
    
    return {
      task,
      showCalendarModal,
      showStatusModal,
      showPriorityModal,
      showDeleteModal,
      currentCalendarDate,
      tempSelectedDate,
      weekdays,
      statusOptions,
      priorityOptions,
      calendarDays,
      getInitials,
      getTaskTypeTitle,
      getEmployeeInfo,
      getStatusClass,
      getPriorityClass,
      getStatusText,
      getPriorityText,
      getCalendarText,
      getScheduledDateLabel,
      formatScheduledDate,
      formatMonthYear,
      isToday,
      isDateSelected,
      getCalendarModalTitle,
      getScheduledDateInfo,
      canChangePriority,
      handleCancel,
      handleBack,
      handleEditTask,
      handleCalendarAction,
      handleStatusAction,
      handlePriorityAction,
      confirmDeleteTask,
      closeCalendarModal,
      previousMonth,
      nextMonth,
      selectDate,
      applyDate,
      showDatePicker,
      goToCalendar,
      closeStatusModal,
      changeStatus,
      closePriorityModal,
      changePriority,
      closeDeleteModal,
      deleteTask
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

.back-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.back-btn:active {
  opacity: 0.6;
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
}

.subtitle {
  color: #8E8E93;
  font-size: 13px;
  margin: 0;
  line-height: 1;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
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
  margin: 0;
}

.task-description {
  color: #FFFFFF;
  font-size: 16px;
  line-height: 1.4;
}

.employee-section {
  margin-bottom: 32px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #1C1C1E;
  border-radius: 12px;
}

.employee-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.employee-avatar img {
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

.employee-details {
  flex: 1;
}

.employee-name {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.employee-position {
  color: #8E8E93;
  font-size: 16px;
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
  margin-bottom: 24px;
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

.picker-title {
  color: #FFFFFF;
  font-size: 16px;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.calendar-btn,
.change-date-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-btn {
  background: #007AFF;
  color: #FFFFFF;
}

.change-date-btn {
  background: #2C2C2E;
  color: #FFFFFF;
}

.calendar-btn:active {
  background: #0056B3;
}

.change-date-btn:active {
  background: #3A3A3C;
}

/* Status Modal Styles */
.current-status-info,
.current-priority-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #2C2C2E;
  border-radius: 12px;
}

.current-status-label,
.current-priority-label {
  color: #8E8E93;
  font-size: 14px;
  margin: 0 0 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.current-status-display,
.current-priority-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-status-display .status-name,
.current-priority-display .priority-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-options,
.priority-options {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
}

.status-option,
.priority-option {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #1C1C1E;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-option:active,
.priority-option:active {
  background: #2C2C2E;
}

.status-option.disabled,
.priority-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-info,
.priority-info {
  flex: 1;
  margin-left: 12px;
}

.status-name,
.priority-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-description,
.priority-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.option-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.priority-note {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 149, 0, 0.1);
  border-radius: 8px;
}

.priority-note p {
  color: #FF9500;
  font-size: 14px;
  margin: 0;
  text-align: center;
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

/* Calendar Picker Styles */
.calendar-container {
  background: #2C2C2E;
  border-radius: 12px;
  padding: 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.nav-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.month-year {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-grid {
  margin-bottom: 16px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 8px 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  color: #FFFFFF;
  font-size: 14px;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.1);
}

.calendar-day.other-month {
  color: #8E8E93;
}

.calendar-day.today {
  background: rgba(0, 122, 255, 0.3);
  color: #007AFF;
  font-weight: 600;
}

.calendar-day.selected {
  background: #007AFF;
  color: #FFFFFF;
  font-weight: 600;
}

.calendar-actions {
  display: flex;
  justify-content: center;
}

.apply-btn {
  padding: 12px 24px;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.apply-btn:disabled {
  background: #2C2C2E;
  color: #8E8E93;
  cursor: not-allowed;
}

.apply-btn:active:not(:disabled) {
  background: #0056B3;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }
  
  .employee-info {
    padding: 12px;
  }
  
  .employee-avatar {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
  
  .employee-name {
    font-size: 16px;
  }
  
  .employee-position {
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