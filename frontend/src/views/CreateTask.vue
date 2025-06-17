<template>
  <div class="create-task-screen">
    <!-- Header -->
    <div class="header">
      <button class="cancel-btn" @click="handleCancel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#007AFF"/>
        </svg>
      </button>
      <div class="title-container">
        <h1 class="title">Создание задачи</h1>
        <span class="subtitle">Новая задача</span>
      </div>
      <div class="placeholder"></div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Task Title Input -->
      <div class="input-section">
        <input
          v-model="taskTitle"
          type="text"
          placeholder="Заголовок задачи"
          class="title-input"
        />
      </div>

      <!-- Task Text Input -->
      <div class="input-section">
        <textarea
          v-model="taskText"
          placeholder="Описание задачи"
          class="text-input"
          rows="4"
        ></textarea>
      </div>

      <!-- Recipients Section -->
      <div class="recipients-section">
        <h3 class="section-title">Получатели</h3>
        
        <!-- Selected Recipients Display -->
        <div v-if="selectedRecipients.length > 0" class="selected-recipients">
          <div v-for="recipient in selectedRecipients" :key="recipient.id" class="selected-recipient">
            <div class="recipient-avatar">
              <img v-if="recipient.avatar" :src="recipient.avatar" :alt="recipient.name" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                {{ getInitials(recipient.name) }}
              </div>
            </div>
            <div class="recipient-info">
              <span class="recipient-name">{{ recipient.name }}</span>
              <span class="recipient-position">{{ recipient.position || recipient.type }}</span>
            </div>
            <button class="remove-recipient-btn" @click="removeRecipient(recipient.id)">×</button>
          </div>
        </div>

        <!-- Add Recipients Button -->
        <button class="add-recipients-btn" @click="showRecipientSelector">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#007AFF"/>
          </svg>
          <span>{{ selectedRecipients.length > 0 ? 'Изменить получателей' : 'Выбрать получателей' }}</span>
        </button>
      </div>

      <!-- Task Actions -->
      <div class="actions-section">
        <!-- Calendar Action -->
        <div class="action-item" @click="handleCalendarAction">
          <div class="action-icon calendar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#007AFF"/>
            </svg>
          </div>
          <div class="action-content">
            <h4 class="action-title">Календарь</h4>
            <p class="action-subtitle">
              {{ selectedDate ? formatDate(selectedDate) : 'Дата не назначена' }}
            </p>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>

        <!-- Status Action -->
        <div class="action-item" @click="handleStatusAction">
          <div class="action-icon status-icon" :class="getStatusClass(selectedStatus)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="action-content">
            <h4 class="action-title">Статус</h4>
            <p class="action-subtitle">{{ getStatusText(selectedStatus) }}</p>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>

        <!-- Priority Action -->
        <div class="action-item" @click="handlePriorityAction">
          <div class="action-icon priority-icon" :class="getPriorityClass(selectedPriority)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="action-content">
            <h4 class="action-title">Приоритет</h4>
            <p class="action-subtitle">{{ getPriorityText(selectedPriority) }}</p>
          </div>
          <div class="action-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Send Button -->
      <div class="send-button-container">
        <button 
          class="send-btn" 
          :disabled="!canSendTask || loading"
          @click="sendTask"
        >
          <span v-if="!loading">Отправить</span>
          <span v-else>Отправляется...</span>
        </button>
      </div>
    </div>

    <!-- Recipient Selector Modal -->
    <div class="modal-overlay" v-if="showRecipientModal" @click="closeRecipientModal">
      <div class="modal-content recipient-modal" @click.stop>
        <div class="modal-header">
          <h3>Кому</h3>
          <button class="close-btn" @click="closeRecipientModal">×</button>
        </div>
        <div class="modal-body">
          <!-- Step 1: Choose recipient type -->
          <div v-if="recipientStep === 1" class="recipient-type-selection">
            <div class="recipient-option" @click="selectRecipientType('self')">
              <div class="option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM6.023 15.416C7.491 17.606 9.695 19 12.16 19C14.625 19 16.829 17.606 18.297 15.416C16.755 13.249 14.615 11.954 12.16 11.954C9.705 11.954 7.565 13.249 6.023 15.416ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4Z" fill="#007AFF"/>
                </svg>
              </div>
              <span>Себе</span>
              <div class="option-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
                </svg>
              </div>
            </div>
            <div class="recipient-option" @click="selectRecipientType('departments')">
              <div class="option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="#007AFF"/>
                </svg>
              </div>
              <span>Отделы</span>
              <div class="option-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Step 2: Choose departments -->
          <div v-else-if="recipientStep === 2" class="department-selection">
            <div class="step-header">
              <button class="back-step-btn" @click="goBackStep">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
                </svg>
              </button>
              <h4>Отделы</h4>
            </div>
            <div class="departments-list">
              <div 
                v-for="department in departments" 
                :key="department.id" 
                class="department-option"
                @click="selectDepartment(department)"
              >
                <div class="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="#007AFF"/>
                  </svg>
                </div>
                <span>{{ department.name }}</span>
                <div class="option-check" :class="{ 'selected': isDepartmentSelected(department.id) }">
                  <svg v-if="isDepartmentSelected(department.id)" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                  </svg>
                </div>
                <div class="option-arrow" @click.stop="showDepartmentEmployees(department)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="#8E8E93"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="apply-button-container" v-if="hasSelectedRecipients">
              <button class="apply-btn" @click="applyRecipients">Применить</button>
            </div>
          </div>

          <!-- Step 3: Choose employees in department -->
          <div v-else-if="recipientStep === 3" class="employee-selection">
            <div class="step-header">
              <button class="back-step-btn" @click="goBackStep">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#007AFF"/>
                </svg>
              </button>
              <h4>{{ currentDepartment?.name }}</h4>
            </div>
            <div class="employees-list">
              <div 
                v-for="employee in currentDepartmentEmployees" 
                :key="employee.id" 
                class="employee-option"
                @click="toggleEmployee(employee)"
              >
                <div class="employee-avatar">
                  <img v-if="employee.avatar" :src="employee.avatar" :alt="employee.name" class="avatar-image" />
                  <div v-else class="avatar-placeholder">
                    {{ getInitials(employee.name) }}
                  </div>
                </div>
                <div class="employee-info">
                  <span class="employee-name">{{ employee.name }}</span>
                  <span class="employee-position">{{ employee.position }}</span>
                </div>
                <div class="option-check" :class="{ 'selected': isEmployeeSelected(employee.id) }">
                  <svg v-if="isEmployeeSelected(employee.id)" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="apply-button-container" v-if="hasSelectedRecipients">
              <button class="apply-btn" @click="applyRecipients">Применить</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Modal -->
    <div class="modal-overlay" v-if="showCalendarModal" @click="closeCalendarModal">
      <div class="modal-content calendar-modal" @click.stop>
        <div class="modal-header">
          <h3>Выберите дату</h3>
          <button class="close-btn" @click="closeCalendarModal">×</button>
        </div>
        <div class="modal-body">
          <div class="calendar-container">
            <div class="calendar-header">
              <button class="calendar-nav-btn" @click="previousMonth">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
                </svg>
              </button>
              <span class="calendar-month">{{ formatCalendarMonth(currentCalendarDate) }}</span>
              <button class="calendar-nav-btn" @click="nextMonth">
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
              <button v-if="selectedDate" class="cancel-date-btn" @click="cancelDate">
                Отменить дату
              </button>
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
          <div class="status-options">
            <div 
              v-for="status in statusOptions" 
              :key="status.value"
              class="status-option"
              :class="{ 'selected': selectedStatus === status.value }"
              @click="selectStatus(status.value)"
            >
              <div class="status-indicator" :class="getStatusClass(status.value)"></div>
              <div class="status-info">
                <span class="status-name">{{ status.name }}</span>
                <span class="status-description">{{ status.description }}</span>
              </div>
              <div class="option-check" :class="{ 'selected': selectedStatus === status.value }">
                <svg v-if="selectedStatus === status.value" width="16" height="16" viewBox="0 0 24 24" fill="none">
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
          <div class="priority-options">
            <div 
              v-for="priority in priorityOptions" 
              :key="priority.value"
              class="priority-option"
              :class="{ 'selected': selectedPriority === priority.value }"
              @click="selectPriority(priority.value)"
            >
              <div class="priority-indicator" :class="getPriorityClass(priority.value)"></div>
              <div class="priority-info">
                <span class="priority-name">{{ priority.name }}</span>
                <span class="priority-description">{{ priority.description }}</span>
              </div>
              <div class="option-check" :class="{ 'selected': selectedPriority === priority.value }">
                <svg v-if="selectedPriority === priority.value" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { tasksAPI, employeesAPI } from '@/services/api'

export default {
  name: 'CreateTask',
  setup() {
    const router = useRouter()
    const { showAlert } = useWebApp()
    
    // State
    const taskTitle = ref('')
    const taskText = ref('')
    const selectedRecipients = ref([])
    const selectedDate = ref(null)
    const selectedStatus = ref(0) // Без статуса
    const selectedPriority = ref(0) // Без приоритета
    const loading = ref(false)
    
    // Modal states
    const showRecipientModal = ref(false)
    const showCalendarModal = ref(false)
    const showStatusModal = ref(false)
    const showPriorityModal = ref(false)
    
    // Recipient selection state
    const recipientStep = ref(1) // 1: type, 2: departments, 3: employees
    const currentDepartment = ref(null)
    const tempSelectedRecipients = ref([])
    
    // Calendar state
    const currentCalendarDate = ref(new Date())
    const tempSelectedDate = ref(null)
    
    // Mock data
    const departments = ref([
      { id: 1, name: 'Менеджеры', description: 'Отдел менеджеров' },
      { id: 2, name: 'Программисты', description: 'Отдел разработки' },
      { id: 3, name: 'Дизайнеры', description: 'Отдел дизайна' },
      { id: 4, name: 'Аналитики', description: 'Отдел аналитики' },
      { id: 5, name: 'Руководители', description: 'Руководящий состав' },
      { id: 6, name: 'HR', description: 'Отдел кадров' }
    ])
    
    const employees = ref([])
    
    // Загрузка реальных сотрудников
    const loadEmployees = async () => {
      try {
        const response = await employeesAPI.getAll()
        console.log('CreateTask employees API response:', response.data)
        
        if (response.data.success && response.data.data && response.data.data.employees) {
          employees.value = response.data.data.employees.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`.trim(),
            position: emp.position || 'Сотрудник',
            departmentId: getDepartmentIdByPosition(emp.position),
            avatar: emp.avatar_url || null
          }))
          console.log('Loaded employees for CreateTask:', employees.value)
        }
      } catch (error) {
        console.error('Error loading employees:', error)
        // Fallback к mock данным только при ошибке
        employees.value = [
          { id: 1, name: 'Анна Иванова', position: 'Менеджер по продажам', departmentId: 1, avatar: null },
          { id: 2, name: 'Михаил Петров', position: 'IT-специалист', departmentId: 2, avatar: null },
          { id: 3, name: 'Елена Сидорова', position: 'HR-менеджер', departmentId: 6, avatar: null },
          { id: 4, name: 'Дмитрий Козлов', position: 'Дизайнер', departmentId: 3, avatar: null },
          { id: 5, name: 'Ольга Смирнова', position: 'Аналитик', departmentId: 4, avatar: null },
          { id: 6, name: 'Александр Волков', position: 'Руководитель отдела', departmentId: 5, avatar: null }
        ]
      }
    }
    
    // Функция для определения departmentId по должности (соответствует логике из Employees.vue)
    const getDepartmentIdByPosition = (position) => {
      if (!position) return 1
      
      const normalizedPosition = position.toLowerCase()
      
      // Менеджеры
      if (normalizedPosition.includes('менеджер') || normalizedPosition.includes('manager')) return 1
      // Программисты/ИТ
      if (normalizedPosition.includes('разработчик') || normalizedPosition.includes('программист') || 
          normalizedPosition.includes('it') || normalizedPosition.includes('ит')) return 2
      // Дизайнеры
      if (normalizedPosition.includes('дизайнер') || normalizedPosition.includes('design')) return 3
      // Аналитики
      if (normalizedPosition.includes('аналитик') || normalizedPosition.includes('analyst')) return 4
      // Руководители
      if (normalizedPosition.includes('директор') || normalizedPosition.includes('руководитель') || 
          normalizedPosition.includes('boss') || normalizedPosition.includes('head')) return 5
      // HR
      if (normalizedPosition.includes('hr') || normalizedPosition.includes('кадр')) return 6
      
      return 1 // По умолчанию - менеджеры
    }
    
    const statusOptions = ref([
      { value: 0, name: 'Без статуса', description: 'Статус не назначен' },
      { value: 1, name: 'Ожидает', description: 'Задача ожидает выполнения' }
    ])
    
    const priorityOptions = ref([
      { value: 0, name: 'Без приоритета', description: 'Приоритет не назначен' },
      { value: 1, name: 'Низкий приоритет', description: 'Может быть выполнена в свободное время' },
      { value: 2, name: 'Средний приоритет', description: 'Требует выполнения в обычном порядке' },
      { value: 3, name: 'Высокий приоритет', description: 'Требует первоочередного внимания' }
    ])
    
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    
    // Computed
    const canSendTask = computed(() => {
      return taskTitle.value.trim() && selectedRecipients.value.length > 0
    })
    
    const currentDepartmentEmployees = computed(() => {
      if (!currentDepartment.value) return []
      return employees.value.filter(emp => emp.departmentId === currentDepartment.value.id)
    })
    
    const hasSelectedRecipients = computed(() => {
      return tempSelectedRecipients.value.length > 0
    })
    
    const calendarDays = computed(() => {
      const year = currentCalendarDate.value.getFullYear()
      const month = currentCalendarDate.value.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
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
      if (!name) return 'N/A'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
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
      const option = statusOptions.value.find(opt => opt.value === status)
      return option ? option.name : 'Неизвестно'
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
      const option = priorityOptions.value.find(opt => opt.value === priority)
      return option ? option.name : 'Средний приоритет'
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    const formatCalendarMonth = (date) => {
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

    // Helper functions for API mapping
    const getPriorityId = (priority) => {
      const priorityMap = {
        'no_priority': 0,
        'low': 1,
        'medium': 2,
        'high': 3
      }
      return priorityMap[priority] || 2
    }

    const getStatusId = (status) => {
      const statusMap = {
        'no_status': 0,
        'pending': 1,
        'in_progress': 2,
        'cancelled': 3,
        'completed': 4
      }
      return statusMap[status] || 1
    }

    const isPersonalTask = () => {
      return selectedRecipients.value.length === 1 && selectedRecipients.value[0].id === 'self'
    }
    
    // Recipient methods
    const showRecipientSelector = () => {
      tempSelectedRecipients.value = [...selectedRecipients.value]
      recipientStep.value = 1
      showRecipientModal.value = true
    }
    
    const closeRecipientModal = () => {
      showRecipientModal.value = false
      tempSelectedRecipients.value = []
      recipientStep.value = 1
      currentDepartment.value = null
    }
    
    const selectRecipientType = (type) => {
      if (type === 'self') {
        tempSelectedRecipients.value = [{
          id: 'self',
          name: 'Мне',
          type: 'Личная задача',
          avatar: null
        }]
        applyRecipients()
      } else if (type === 'departments') {
        recipientStep.value = 2
      }
    }
    
    const selectDepartment = (department) => {
      const existingIndex = tempSelectedRecipients.value.findIndex(r => r.id === `dept_${department.id}`)
      if (existingIndex >= 0) {
        tempSelectedRecipients.value.splice(existingIndex, 1)
      } else {
        tempSelectedRecipients.value.push({
          id: `dept_${department.id}`,
          name: department.name,
          type: 'Отдел',
          avatar: null
        })
      }
    }
    
    const showDepartmentEmployees = (department) => {
      currentDepartment.value = department
      recipientStep.value = 3
    }
    
    const toggleEmployee = (employee) => {
      const existingIndex = tempSelectedRecipients.value.findIndex(r => r.id === employee.id)
      if (existingIndex >= 0) {
        tempSelectedRecipients.value.splice(existingIndex, 1)
      } else {
        tempSelectedRecipients.value.push({
          id: employee.id,
          name: employee.name,
          position: employee.position,
          type: 'Сотрудник',
          avatar: employee.avatar
        })
      }
    }
    
    const isDepartmentSelected = (departmentId) => {
      return tempSelectedRecipients.value.some(r => r.id === `dept_${departmentId}`)
    }
    
    const isEmployeeSelected = (employeeId) => {
      return tempSelectedRecipients.value.some(r => r.id === employeeId)
    }
    
    const goBackStep = () => {
      if (recipientStep.value === 3) {
        recipientStep.value = 2
        currentDepartment.value = null
      } else if (recipientStep.value === 2) {
        recipientStep.value = 1
      }
    }
    
    const applyRecipients = () => {
      selectedRecipients.value = [...tempSelectedRecipients.value]
      closeRecipientModal()
    }
    
    const removeRecipient = (recipientId) => {
      selectedRecipients.value = selectedRecipients.value.filter(r => r.id !== recipientId)
    }
    
    // Calendar methods
    const handleCalendarAction = () => {
      tempSelectedDate.value = selectedDate.value ? new Date(selectedDate.value) : null
      showCalendarModal.value = true
    }
    
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
    
    const applyDate = () => {
      selectedDate.value = tempSelectedDate.value
      closeCalendarModal()
    }
    
    const cancelDate = () => {
      selectedDate.value = null
      tempSelectedDate.value = null
      closeCalendarModal()
    }
    
    // Status methods
    const handleStatusAction = () => {
      showStatusModal.value = true
    }
    
    const closeStatusModal = () => {
      showStatusModal.value = false
    }
    
    const selectStatus = (status) => {
      selectedStatus.value = status
      closeStatusModal()
    }
    
    // Priority methods
    const handlePriorityAction = () => {
      showPriorityModal.value = true
    }
    
    const closePriorityModal = () => {
      showPriorityModal.value = false
    }
    
    const selectPriority = (priority) => {
      selectedPriority.value = priority
      closePriorityModal()
    }
    
    // Main actions
    const sendTask = async () => {
      if (!canSendTask.value || loading.value) return
      
      loading.value = true
      
      try {
        // Подготавливаем данные для API
        const taskData = {
          title: taskTitle.value.trim(),
          description: taskText.value.trim() || '',
          due_date: selectedDate.value ? new Date(selectedDate.value).toISOString().split('T')[0] : null,
          priority_id: getPriorityId(selectedPriority.value),
          status_id: getStatusId(selectedStatus.value),
          is_personal: isPersonalTask()
        }

        // Если не личная задача, добавляем получателя
        if (!taskData.is_personal && selectedRecipients.value.length > 0) {
          // Пока что берем первого получателя (в будущем можно расширить)
          const firstRecipient = selectedRecipients.value[0]
          if (firstRecipient.id !== 'self' && typeof firstRecipient.id === 'number') {
            taskData.assigned_to = firstRecipient.id
          } else {
            // Если выбрали "себе", делаем личную задачу
            taskData.is_personal = true
            delete taskData.assigned_to
          }
        } else if (!taskData.is_personal) {
          // Если получатели не выбраны, но задача не личная - ошибка
          showAlert('Выберите получателей для задачи')
          return
        }

        console.log('Sending task:', taskData)
        
        const response = await tasksAPI.create(taskData)
        
        if (response.data.success) {
          showAlert('Задача успешно создана!')
          router.push('/tasks')
        } else {
          showAlert('Ошибка при создании задачи: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error creating task:', error)
        if (error.response) {
          const errorMsg = error.response.data?.message || `HTTP ${error.response.status}`
          showAlert(`Ошибка при создании задачи: ${errorMsg}`)
        } else {
          showAlert('Произошла ошибка при создании задачи. Проверьте подключение к интернету.')
        }
      } finally {
        loading.value = false
      }
    }
    
    const handleCancel = () => {
      router.push('/tasks')
    }
    
    // Lifecycle
    onMounted(() => {
      loadEmployees()
    })
    
    return {
      taskTitle,
      taskText,
      selectedRecipients,
      selectedDate,
      selectedStatus,
      selectedPriority,
      loading,
      showRecipientModal,
      showCalendarModal,
      showStatusModal,
      showPriorityModal,
      recipientStep,
      currentDepartment,
      tempSelectedRecipients,
      currentCalendarDate,
      tempSelectedDate,
      departments,
      employees,
      statusOptions,
      priorityOptions,
      weekdays,
      canSendTask,
      currentDepartmentEmployees,
      hasSelectedRecipients,
      calendarDays,
      getInitials,
      getStatusClass,
      getStatusText,
      getPriorityClass,
      getPriorityText,
      formatDate,
      formatCalendarMonth,
      isToday,
      isDateSelected,
      showRecipientSelector,
      closeRecipientModal,
      selectRecipientType,
      selectDepartment,
      showDepartmentEmployees,
      toggleEmployee,
      isDepartmentSelected,
      isEmployeeSelected,
      goBackStep,
      applyRecipients,
      removeRecipient,
      handleCalendarAction,
      closeCalendarModal,
      previousMonth,
      nextMonth,
      selectDate,
      applyDate,
      cancelDate,
      handleStatusAction,
      closeStatusModal,
      selectStatus,
      handlePriorityAction,
      closePriorityModal,
      selectPriority,
      sendTask,
      handleCancel,
      getPriorityId,
      getStatusId
    }
  }
}
</script>

<style scoped>
.create-task-screen {
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

.cancel-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cancel-btn:active {
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

.placeholder {
  width: 60px;
}

.content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
  padding-bottom: 100px;
}

.input-section {
  margin-bottom: 20px;
}

.title-input {
  width: 100%;
  background: #1C1C1E;
  border: 1px solid #2C2C2E;
  border-radius: 12px;
  padding: 16px;
  color: #FFFFFF;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
}

.title-input::placeholder {
  color: #8E8E93;
}

.title-input:focus {
  border-color: #007AFF;
}

.text-input {
  width: 100%;
  background: #1C1C1E;
  border: 1px solid #2C2C2E;
  border-radius: 12px;
  padding: 16px;
  color: #FFFFFF;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  resize: vertical;
  min-height: 100px;
}

.text-input::placeholder {
  color: #8E8E93;
}

.text-input:focus {
  border-color: #007AFF;
}

.recipients-section {
  margin-bottom: 32px;
}

.section-title {
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.selected-recipients {
  margin-bottom: 16px;
}

.selected-recipient {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1C1C1E;
  border-radius: 12px;
  margin-bottom: 8px;
}

.recipient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
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
  font-size: 16px;
  font-weight: 600;
}

.recipient-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recipient-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
}

.recipient-position {
  color: #8E8E93;
  font-size: 14px;
}

.remove-recipient-btn {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.remove-recipient-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.add-recipients-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1C1C1E;
  border: 1px solid #2C2C2E;
  border-radius: 12px;
  padding: 16px;
  color: #007AFF;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
}

.add-recipients-btn:hover {
  background: #2C2C2E;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #2C2C2E;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 32px;
}

.action-item {
  background: #1C1C1E;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:hover {
  background: #2C2C2E;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.calendar-icon {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.status-icon {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.status-icon.status-pending {
  background: rgba(255, 159, 10, 0.2);
  color: #FF9F0A;
}

.status-icon.status-progress {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.status-icon.status-completed {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.status-icon.status-cancelled {
  background: rgba(255, 59, 48, 0.2);
  color: #FF3B30;
}

.priority-icon {
  background: rgba(255, 204, 0, 0.2);
  color: #FFCC00;
}

.priority-icon.priority-low {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.priority-icon.priority-medium {
  background: rgba(255, 159, 10, 0.2);
  color: #FF9F0A;
}

.priority-icon.priority-high {
  background: rgba(255, 59, 48, 0.2);
  color: #FF3B30;
}

.action-content {
  flex: 1;
}

.action-title {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.action-subtitle {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
}

.action-arrow {
  color: #8E8E93;
}

.send-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #000000;
  border-top: 1px solid #2C2C2E;
}

.send-btn {
  width: 100%;
  background: #007AFF;
  border: none;
  border-radius: 12px;
  padding: 16px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:disabled {
  background: #2C2C2E;
  color: #8E8E93;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #0056B3;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Recipient Modal */
.recipient-type-selection,
.department-selection,
.employee-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-step-btn {
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.step-header h4 {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.recipient-option,
.department-option,
.employee-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #2C2C2E;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recipient-option:hover,
.department-option:hover,
.employee-option:hover {
  background: #3A3A3C;
}

.option-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recipient-option span,
.department-option span {
  color: #FFFFFF;
  font-size: 16px;
  flex: 1;
}

.option-arrow {
  color: #8E8E93;
}

.option-check {
  width: 20px;
  height: 20px;
  border: 2px solid #8E8E93;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-check.selected {
  border-color: #007AFF;
  background: #007AFF;
}

.employee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}

.employee-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.employee-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}

.employee-position {
  color: #8E8E93;
  font-size: 14px;
}

.apply-button-container {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #2C2C2E;
}

.apply-btn {
  width: 100%;
  background: #007AFF;
  border: none;
  border-radius: 8px;
  padding: 12px;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.apply-btn:disabled {
  background: #2C2C2E;
  color: #8E8E93;
  cursor: not-allowed;
}

/* Calendar Modal */
.calendar-container {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-nav-btn {
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.calendar-month {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background: #2C2C2E;
}

.calendar-day.other-month {
  color: #8E8E93;
}

.calendar-day.selected {
  background: #007AFF;
  color: #FFFFFF;
}

.calendar-day.today {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.calendar-day.today.selected {
  background: #007AFF;
  color: #FFFFFF;
}

.calendar-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.apply-btn {
  flex: 1;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-btn:disabled {
  background: #2C2C2E;
  color: #8E8E93;
  cursor: not-allowed;
}

.apply-btn:not(:disabled):active {
  background: #0056CC;
}

.cancel-date-btn {
  flex: 1;
  background: #FF3B30;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-date-btn:active {
  background: #CC2E24;
}

/* Status and Priority Modals */
.status-options,
.priority-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-option,
.priority-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #2C2C2E;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-option:hover,
.priority-option:hover {
  background: #3A3A3C;
}

.status-option.selected,
.priority-option.selected {
  background: rgba(0, 122, 255, 0.2);
}

.status-indicator,
.priority-indicator {
  width: 16px;
  height: 16px;
  border-radius: 8px;
  flex-shrink: 0;
}

.status-indicator.status-pending {
  background: #FF9F0A;
}

.status-indicator.status-progress {
  background: #007AFF;
}

.status-indicator.status-completed {
  background: #34C759;
}

.status-indicator.status-cancelled {
  background: #FF3B30;
}

.priority-indicator.priority-low {
  background: #34C759;
}

.priority-indicator.priority-medium {
  background: #FF9F0A;
}

.priority-indicator.priority-high {
  background: #FF3B30;
}

.status-info,
.priority-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.status-name,
.priority-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}

.status-description,
.priority-description {
  color: #8E8E93;
  font-size: 14px;
}
</style> 