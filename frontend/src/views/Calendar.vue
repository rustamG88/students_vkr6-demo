<template>
  <div class="calendar-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
        </svg>
      </button>
      <div class="title-container">
        <h1 class="title">Календарь</h1>
        <span class="subtitle">Управление задачами</span>
      </div>
      <button class="menu-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#007AFF"/>
          <circle cx="12" cy="12" r="2" fill="#007AFF"/>
          <circle cx="12" cy="19" r="2" fill="#007AFF"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Calendar Header -->
      <div class="calendar-header">
        <button class="nav-btn" @click="previousMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
          </svg>
        </button>
        
        <button class="month-year-btn" @click="showYearSelector">
          {{ formatMonthYear(currentDate) }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M7 10L12 15L17 10H7Z" fill="#007AFF"/>
          </svg>
        </button>
        
        <button class="nav-btn" @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="#007AFF"/>
          </svg>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-container">
        <div class="calendar-weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        
        <div class="calendar-grid">
          <div 
            v-for="date in calendarDays" 
            :key="date.key"
            class="calendar-day"
            :class="{ 
              'other-month': !date.isCurrentMonth,
              'selected': isDateSelected(date.date),
              'today': isToday(date.date),
              'has-tasks': hasTasksOnDate(date.date),
              'past-date': isPastDate(date.date),
              'disabled': isPastDate(date.date)
            }"
            @click="selectDate(date.date)"
          >
            {{ date.day }}
            <div v-if="hasTasksOnDate(date.date)" class="task-indicator"></div>
          </div>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="tasks-section">
        <!-- Section Headers -->
        <div class="section-header">
          <span class="section-title">Без статуса</span>
          <button class="expand-btn" @click="toggleSection('no_status')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.no_status }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.no_status" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('no_status')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="section-header">
          <span class="section-title">В процессе</span>
          <button class="expand-btn" @click="toggleSection('in_progress')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.in_progress }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.in_progress" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('in_progress')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-status-indicator in-progress"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="section-header">
          <span class="section-title">Завершено</span>
          <button class="expand-btn" @click="toggleSection('completed')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.completed }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.completed" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('completed')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-status-indicator completed"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Дополнительная секция "На рассмотрении" -->
        <div class="section-header">
          <span class="section-title">На рассмотрении</span>
          <button class="expand-btn" @click="toggleSection('under_review')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.under_review }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.under_review" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('under_review')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-status-indicator under-review"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Дополнительная секция "Отложено" -->
        <div class="section-header">
          <span class="section-title">Отложено</span>
          <button class="expand-btn" @click="toggleSection('postponed')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.postponed }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.postponed" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('postponed')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-status-indicator postponed"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Дополнительная секция "Отменено" -->
        <div class="section-header">
          <span class="section-title">Отменено</span>
          <button class="expand-btn" @click="toggleSection('cancelled')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': expandedSections.cancelled }">
              <path d="M7 10L12 15L17 10H7Z" fill="#8E8E93"/>
            </svg>
          </button>
        </div>
        
        <div v-if="expandedSections.cancelled" class="tasks-list">
          <div 
            v-for="task in getTasksByStatus('cancelled')" 
            :key="task.id"
            class="task-item"
            @click="openTaskDetail(task)"
          >
            <div class="task-status-indicator cancelled"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-time">{{ formatTaskTime(task.time) }}</div>
            </div>
            <button class="task-menu-btn" @click.stop="showTaskMenu(task, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="12" r="2" fill="#8E8E93"/>
                <circle cx="12" cy="19" r="2" fill="#8E8E93"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Дополнительное пространство для прокрутки -->
        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- Year Selector Modal -->
    <div class="modal-overlay" v-if="showYearModal" @click="closeYearModal">
      <div class="modal-content year-modal" @click.stop>
        <div class="modal-header">
          <h3>Выберите год</h3>
          <button class="close-btn" @click="closeYearModal">×</button>
        </div>
        <div class="modal-body">
          <div class="years-list">
            <div 
              v-for="year in availableYears" 
              :key="year"
              class="year-option"
              :class="{ 'selected': year === currentDate.getFullYear() }"
              @click="selectYear(year)"
            >
              {{ year }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Menu Modal -->
    <div class="modal-overlay" v-if="showTaskMenuModal" @click="closeTaskMenu">
      <div class="modal-content task-menu-modal" @click.stop :style="taskMenuPosition">
        <div class="task-menu-options">
          <div class="menu-option status-option" @click="changeTaskStatus('in_progress')">
            <div class="status-indicator in-progress"></div>
            <span>В процессе</span>
            <div class="option-check" :class="{ 'selected': selectedTask?.status === 'in_progress' }">
              <svg v-if="selectedTask?.status === 'in_progress'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
              </svg>
            </div>
          </div>
          
          <div class="menu-option status-option" @click="changeTaskStatus('completed')">
            <div class="status-indicator completed"></div>
            <span>Завершено</span>
            <div class="option-check" :class="{ 'selected': selectedTask?.status === 'completed' }">
              <svg v-if="selectedTask?.status === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
              </svg>
            </div>
          </div>

          <div class="menu-option status-option" @click="changeTaskStatus('under_review')">
            <div class="status-indicator under-review"></div>
            <span>На рассмотрении</span>
            <div class="option-check" :class="{ 'selected': selectedTask?.status === 'under_review' }">
              <svg v-if="selectedTask?.status === 'under_review'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
              </svg>
            </div>
          </div>

          <div class="menu-option status-option" @click="changeTaskStatus('postponed')">
            <div class="status-indicator postponed"></div>
            <span>Отложено</span>
            <div class="option-check" :class="{ 'selected': selectedTask?.status === 'postponed' }">
              <svg v-if="selectedTask?.status === 'postponed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
              </svg>
            </div>
          </div>
          
          <div class="menu-option status-option" @click="changeTaskStatus('no_status')">
            <div class="status-indicator no-status"></div>
            <span>Без статуса</span>
            <div class="option-check" :class="{ 'selected': selectedTask?.status === 'no_status' || selectedTask?.status === 'no_status_2' }">
              <svg v-if="selectedTask?.status === 'no_status' || selectedTask?.status === 'no_status_2'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
              </svg>
            </div>
          </div>
          
          <div class="menu-option delete-option" @click="confirmDeleteTask">
            <span>Удалить</span>
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
          <p>Вы уверены, что хотите удалить эту задачу из календаря?</p>
          <div class="modal-actions">
            <button class="cancel-btn-modal" @click="closeDeleteModal">Отмена</button>
            <button class="delete-btn-modal" @click="deleteTask">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div class="modal-overlay" v-if="showTaskDetailModal" @click="closeTaskDetail">
      <div class="modal-content task-detail-modal" @click.stop>
        <!-- Header with exit and delete buttons -->
        <div class="task-detail-header">
          <button class="header-btn exit-btn" @click="closeTaskDetail">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#007AFF"/>
            </svg>
          </button>
          <h1 class="task-detail-title">{{ selectedTask?.title }}</h1>
          <button class="header-btn delete-btn" @click="confirmDeleteTaskFromDetail">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="task-detail-content">
          <!-- Task Description -->
          <div class="detail-section">
            <h4>Описание задачи</h4>
            <p class="task-description">{{ selectedTask?.description || 'Описание отсутствует' }}</p>
          </div>

          <!-- Employee Information -->
          <div class="detail-section" v-if="selectedTask?.assignee">
            <h4>Информация о сотруднике</h4>
            <div class="employee-info">
              <div class="task-avatar">
                <img v-if="selectedTask.assignee.avatar" :src="selectedTask.assignee.avatar" :alt="selectedTask.assignee.name" />
                <div v-else class="avatar-placeholder">
                  {{ getInitials(selectedTask.assignee.name) }}
                </div>
              </div>
              <div class="employee-details">
                <span class="employee-name">{{ selectedTask.assignee.name }}</span>
                <span class="employee-position">{{ selectedTask.assignee.position || 'Сотрудник' }}</span>
              </div>
            </div>
          </div>

          <!-- Add Employee Notes Section -->
          <div class="detail-section">
            <h4>Заметки о сотруднике</h4>
            <div class="employee-notes">
              <textarea 
                v-model="employeeNotes" 
                class="notes-textarea"
                placeholder="Добавьте заметку о сотруднике..."
                rows="3"
                @blur="saveEmployeeNotes"
              ></textarea>
              <div class="notes-actions">
                <button class="save-notes-btn" @click="saveEmployeeNotes" :disabled="!employeeNotes">
                  Сохранить заметку
                </button>
              </div>
            </div>
            <!-- Display existing notes -->
            <div v-if="selectedTask?.employeeNotes?.length" class="existing-notes">
              <h5>Существующие заметки:</h5>
              <div v-for="note in selectedTask.employeeNotes" :key="note.id" class="note-item">
                <div class="note-content">{{ note.text }}</div>
                <div class="note-meta">
                  <span class="note-date">{{ formatDate(note.createdAt) }}</span>
                  <button class="delete-note-btn" @click="deleteEmployeeNote(note.id)">×</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Icons Row -->
          <div class="action-icons-row">
            <!-- Calendar Icon -->
            <div class="action-icon" @click="showCalendarAction">
              <div class="icon-container calendar-icon" :class="{ 'has-date': selectedTask?.date }">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <span class="icon-label">Календарь</span>
              <span class="icon-value" v-if="selectedTask?.date">{{ formatTaskDate(selectedTask.date) }}</span>
            </div>

            <!-- Status Icon -->
            <div class="action-icon" @click="showStatusAction">
              <div class="icon-container status-icon" :class="getStatusClass(selectedTask?.status)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path v-if="selectedTask?.status === 'completed'" d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" fill="none"/>
                  <circle v-else-if="selectedTask?.status === 'in_progress'" cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
              </div>
              <span class="icon-label">Статус</span>
              <span class="icon-value">{{ getStatusText(selectedTask?.status) }}</span>
            </div>

            <!-- Priority Icon -->
            <div class="action-icon" @click="showPriorityAction">
              <div class="icon-container priority-icon" :class="getPriorityClass(selectedTask?.priority)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" fill="currentColor"/>
                </svg>
              </div>
              <span class="icon-label">Приоритет</span>
              <span class="icon-value">{{ getPriorityText(selectedTask?.priority) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Action Modal -->
    <div class="modal-overlay" v-if="showCalendarActionModal" @click="closeCalendarAction">
      <div class="modal-content calendar-action-modal" @click.stop>
        <div class="modal-header">
          <h3>Календарь</h3>
          <button class="close-btn" @click="closeCalendarAction">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedTask?.date" class="calendar-info">
            <div class="date-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#007AFF" stroke-width="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="#007AFF" stroke-width="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="#007AFF" stroke-width="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="#007AFF" stroke-width="2"/>
              </svg>
              <div>
                <p class="date-text">{{ formatTaskDate(selectedTask.date) }}</p>
                <p class="date-description">{{ getDateDescription() }}</p>
              </div>
            </div>
            <button class="go-to-calendar-btn" @click="goToCalendarDate">
              Перейти в календарь на эту дату
            </button>
          </div>
          <div v-else class="no-date-info">
            <p>Дата для этой задачи не установлена</p>
            <button class="set-date-btn" @click="showDatePicker">
              Назначить дату
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Action Modal -->
    <div class="modal-overlay" v-if="showStatusActionModal" @click="closeStatusAction">
      <div class="modal-content status-action-modal" @click.stop>
        <div class="modal-header">
          <h3>Изменить статус</h3>
          <button class="close-btn" @click="closeStatusAction">×</button>
        </div>
        <div class="modal-body">
          <div class="status-options">
            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'no_status' }"
              @click="changeTaskStatusFromDetail('no_status')"
            >
              <div class="status-indicator no-status"></div>
              <span>Без статуса</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'no_status' }">
                <svg v-if="selectedTask?.status === 'no_status'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
            
            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'in_progress' }"
              @click="changeTaskStatusFromDetail('in_progress')"
            >
              <div class="status-indicator in-progress"></div>
              <span>В процессе</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'in_progress' }">
                <svg v-if="selectedTask?.status === 'in_progress'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>

            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'under_review' }"
              @click="changeTaskStatusFromDetail('under_review')"
            >
              <div class="status-indicator under-review"></div>
              <span>На рассмотрении</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'under_review' }">
                <svg v-if="selectedTask?.status === 'under_review'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>

            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'postponed' }"
              @click="changeTaskStatusFromDetail('postponed')"
            >
              <div class="status-indicator postponed"></div>
              <span>Отложено</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'postponed' }">
                <svg v-if="selectedTask?.status === 'postponed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
            
            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'completed' }"
              @click="changeTaskStatusFromDetail('completed')"
            >
              <div class="status-indicator completed"></div>
              <span>Завершено</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'completed' }">
                <svg v-if="selectedTask?.status === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>

            <div 
              class="status-option" 
              :class="{ 'selected': selectedTask?.status === 'cancelled' }"
              @click="changeTaskStatusFromDetail('cancelled')"
            >
              <div class="status-indicator cancelled"></div>
              <span>Отменено</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.status === 'cancelled' }">
                <svg v-if="selectedTask?.status === 'cancelled'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Action Modal -->
    <div class="modal-overlay" v-if="showPriorityActionModal" @click="closePriorityAction">
      <div class="modal-content priority-action-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ canChangePriority ? 'Изменить приоритет' : 'Приоритет задачи' }}</h3>
          <button class="close-btn" @click="closePriorityAction">×</button>
        </div>
        <div class="modal-body">
          <div class="priority-options">
            <div 
              class="priority-option" 
              :class="{ 'selected': selectedTask?.priority === 'low', 'disabled': !canChangePriority }"
              @click="canChangePriority && changeTaskPriorityFromDetail('low')"
            >
              <div class="priority-indicator low"></div>
              <span>Низкий</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.priority === 'low' }">
                <svg v-if="selectedTask?.priority === 'low'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
            
            <div 
              class="priority-option" 
              :class="{ 'selected': selectedTask?.priority === 'medium', 'disabled': !canChangePriority }"
              @click="canChangePriority && changeTaskPriorityFromDetail('medium')"
            >
              <div class="priority-indicator medium"></div>
              <span>Средний</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.priority === 'medium' }">
                <svg v-if="selectedTask?.priority === 'medium'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
            
            <div 
              class="priority-option" 
              :class="{ 'selected': selectedTask?.priority === 'high', 'disabled': !canChangePriority }"
              @click="canChangePriority && changeTaskPriorityFromDetail('high')"
            >
              <div class="priority-indicator high"></div>
              <span>Высокий</span>
              <div class="option-check" :class="{ 'selected': selectedTask?.priority === 'high' }">
                <svg v-if="selectedTask?.priority === 'high'" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#007AFF"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div v-if="!canChangePriority" class="priority-note">
            <p>Приоритет этой задачи можно изменить только если она личная</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { calendarAPI, tasksAPI } from '@/services/api'
import BottomNavigation from '@/components/BottomNavigation.vue'

export default {
  name: 'Calendar',
  components: {
    BottomNavigation
  },
  setup() {
    const router = useRouter()
    const { showAlert, showConfirm, close } = useWebApp()
    
    // State
    const currentDate = ref(new Date()) // Текущая дата вместо October 2023
    const selectedDate = ref(new Date()) // Текущая дата вместо October 14, 2023
    const showYearModal = ref(false)
    const showTaskMenuModal = ref(false)
    const showDeleteModal = ref(false)
    const showTaskDetailModal = ref(false)
    const showCalendarActionModal = ref(false)
    const showStatusActionModal = ref(false)
    const showPriorityActionModal = ref(false)
    const selectedTask = ref(null)
    const taskMenuPosition = ref({})
    const employeeNotes = ref('')
    
    const expandedSections = ref({
      no_status: true,
      in_progress: true,
      completed: true,
      no_status_2: true,
      under_review: true,
      postponed: true,
      cancelled: true
    })
    
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    
    // Mock tasks data
    const tasks = ref([
      {
        id: 1,
        title: 'Макс',
        description: 'Задача от Макса',
        time: '15:00',
        date: new Date(2023, 9, 14),
        status: 'no_status',
        priority: 'medium',
        dateSetBy: 'sender',
        assignee: { name: 'Макс', avatar: null, position: 'Менеджер' }
      },
      {
        id: 2,
        title: 'Встреча с командой',
        description: 'Обсуждение проекта',
        time: '10:00',
        date: new Date(2023, 9, 14),
        status: 'in_progress',
        priority: 'high',
        dateSetBy: 'receiver',
        isPersonal: true,
        assignee: null
      },
      {
        id: 3,
        title: 'Завершить отчет',
        description: 'Финальный отчет по проекту',
        time: '14:00',
        date: new Date(2023, 9, 14),
        status: 'completed',
        priority: 'low',
        dateSetBy: 'sender',
        isPersonal: true,
        assignee: null
      },
      {
        id: 4,
        title: 'Макс',
        description: 'Еще одна задача',
        time: '16:00',
        date: new Date(2023, 9, 14),
        status: 'no_status_2',
        priority: 'high',
        dateSetBy: 'receiver',
        assignee: { name: 'Макс', avatar: null, position: 'Разработчик' }
      }
    ])
    
    // Computed
    const availableYears = computed(() => {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        years.push(i)
      }
      return years
    })

    const canChangePriority = computed(() => {
      // Can change priority only for personal tasks (tasks without assignee or assigned to self)
      return !selectedTask.value?.assignee || selectedTask.value?.isPersonal
    })
    
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      
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
    const formatMonthYear = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    }
    
    const formatTaskTime = (time) => {
      return time || ''
    }

    const formatTaskDate = (date) => {
      if (!date) return ''
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    const getInitials = (name) => {
      if (!name) return 'N'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const getStatusText = (status) => {
      const statusTexts = {
        'no_status': 'Без статуса',
        'in_progress': 'В процессе',
        'completed': 'Завершено',
        'cancelled': 'Отменено',
        'no_status_2': 'Без статуса',
        'under_review': 'На рассмотрении',
        'postponed': 'Отложено'
      }
      return statusTexts[status] || 'Без статуса'
    }

    const getStatusClass = (status) => {
      return status || 'no-status'
    }

    const getPriorityText = (priority) => {
      const priorityTexts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
      }
      return priorityTexts[priority] || 'Не указан'
    }

    const getPriorityClass = (priority) => {
      return priority || 'medium'
    }

    const getDateDescription = () => {
      if (!selectedTask.value?.date) return ''
      // Determine if date was set by sender or receiver
      if (selectedTask.value.dateSetBy === 'sender') {
        return 'Отправитель назначил задачу на эту дату'
      } else if (selectedTask.value.dateSetBy === 'receiver') {
        return 'Вы назначили задачу на эту дату'
      }
      return 'Дата назначена для этой задачи'
    }
    
    const isToday = (date) => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }
    
    const isPastDate = (date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return checkDate < today
    }
    
    const isDateSelected = (date) => {
      return selectedDate.value && date.toDateString() === selectedDate.value.toDateString()
    }
    
    const hasTasksOnDate = (date) => {
      return tasks.value.some(task => 
        task.date.toDateString() === date.toDateString()
      )
    }
    
    const getTasksByStatus = (status) => {
      return tasks.value.filter(task => 
        task.status === status && 
        task.date.toDateString() === selectedDate.value.toDateString()
      )
    }
    
    const selectDate = (date) => {
      // Не позволяем выбирать прошедшие даты
      if (isPastDate(date)) {
        return
      }
      selectedDate.value = new Date(date)
    }
    
    const previousMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
    }
    
    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
    }
    
    const showYearSelector = () => {
      showYearModal.value = true
    }
    
    const closeYearModal = () => {
      showYearModal.value = false
    }
    
    const selectYear = (year) => {
      currentDate.value = new Date(year, currentDate.value.getMonth(), 1)
      closeYearModal()
    }
    
    const toggleSection = (section) => {
      expandedSections.value[section] = !expandedSections.value[section]
    }
    
    const showTaskMenu = (task, event) => {
      selectedTask.value = task
      const rect = event.target.getBoundingClientRect()
      taskMenuPosition.value = {
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`
      }
      showTaskMenuModal.value = true
    }
    
    const closeTaskMenu = () => {
      showTaskMenuModal.value = false
      selectedTask.value = null
      taskMenuPosition.value = {}
    }
    
    const changeTaskStatus = async (newStatus) => {
      if (selectedTask.value) {
        try {
          // Map status names to IDs
          const statusMap = {
            'no_status': 1,
            'in_progress': 2,
            'completed': 4,
            'cancelled': 3,
            'no_status_2': 1,
            'under_review': 5,
            'postponed': 6
          }
          
          const statusId = statusMap[newStatus] || 1
          
          // Call API to update status
          await calendarAPI.updateTaskStatus(selectedTask.value.id, {
            status_id: statusId
          })
          
          // Update local state
          selectedTask.value.status = newStatus
          
          closeTaskMenu()
          showAlert('Статус задачи изменен!')
        } catch (error) {
          console.error('Error updating task status:', error)
          closeTaskMenu()
          showAlert('Ошибка при изменении статуса задачи')
        }
      }
    }
    
    const confirmDeleteTask = async () => {
      closeTaskMenu()
      
      const shouldDelete = await showConfirm(
        'Удалить задачу?',
        'Задача будет удалена из календаря безвозвратно.'
      )
      
      if (shouldDelete) {
        deleteTask()
      }
    }
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false
    }
    
    const deleteTask = async () => {
      if (selectedTask.value) {
        try {
          // Call API to remove task from calendar
          await calendarAPI.removeFromCalendar(selectedTask.value.id)
          
          // Remove from local state
          const index = tasks.value.findIndex(t => t.id === selectedTask.value.id)
          if (index !== -1) {
            tasks.value.splice(index, 1)
          }
          
          selectedTask.value = null
          showAlert('Задача удалена из календаря!')
        } catch (error) {
          console.error('Error removing task from calendar:', error)
          showAlert('Ошибка при удалении задачи из календаря')
        }
      }
    }
    
    const closeTaskDetail = () => {
      showTaskDetailModal.value = false
      selectedTask.value = null
    }

    // Calendar action methods
    const showCalendarAction = () => {
      showCalendarActionModal.value = true
    }

    const closeCalendarAction = () => {
      showCalendarActionModal.value = false
    }

    const goToCalendarDate = () => {
      if (selectedTask.value?.date) {
        selectedDate.value = new Date(selectedTask.value.date)
        currentDate.value = new Date(selectedTask.value.date.getFullYear(), selectedTask.value.date.getMonth(), 1)
      }
      closeCalendarAction()
      closeTaskDetail()
    }

    const showDatePicker = () => {
      // This would open a date picker - for now just close
      closeCalendarAction()
      showAlert('Функция выбора даты будет добавлена в следующем обновлении')
    }

    // Status action methods
    const showStatusAction = () => {
      showStatusActionModal.value = true
    }

    const closeStatusAction = () => {
      showStatusActionModal.value = false
    }

    const changeTaskStatusFromDetail = async (newStatus) => {
      if (selectedTask.value) {
        try {
          // Map status names to IDs
          const statusMap = {
            'no_status': 1,
            'in_progress': 2,
            'completed': 4,
            'cancelled': 3,
            'no_status_2': 1,
            'under_review': 5,
            'postponed': 6
          }
          
          const statusId = statusMap[newStatus] || 1
          
          // Call API to update status
          await calendarAPI.updateTaskStatus(selectedTask.value.id, {
            status_id: statusId
          })
          
          // Update local state
          selectedTask.value.status = newStatus
          
          closeStatusAction()
          showAlert('Статус задачи изменен!')
        } catch (error) {
          console.error('Error updating task status:', error)
          closeStatusAction()
          showAlert('Ошибка при изменении статуса задачи')
        }
      }
    }

    // Priority action methods
    const showPriorityAction = () => {
      showPriorityActionModal.value = true
    }

    const closePriorityAction = () => {
      showPriorityActionModal.value = false
    }

    const changeTaskPriorityFromDetail = async (newPriority) => {
      if (selectedTask.value && canChangePriority.value) {
        try {
          // Map priority names to IDs
          const priorityMap = {
            'low': 1,
            'medium': 2,
            'high': 3
          }
          
          const priorityId = priorityMap[newPriority] || 2
          
          // Call API to update priority (assuming this endpoint exists)
          await calendarAPI.updateTaskPriority(selectedTask.value.id, {
            priority_id: priorityId
          })
          
          // Update local state
          selectedTask.value.priority = newPriority
          
          closePriorityAction()
          showAlert('Приоритет задачи изменен!')
        } catch (error) {
          console.error('Error updating task priority:', error)
          closePriorityAction()
          showAlert('Ошибка при изменении приоритета задачи')
        }
      }
    }

    // Delete from detail screen
    const confirmDeleteTaskFromDetail = async () => {
      const shouldDelete = await showConfirm(
        'Удалить задачу?',
        'Задача будет удалена безвозвратно.'
      )
      
      if (shouldDelete) {
        try {
          // Call API to delete task
          await calendarAPI.removeFromCalendar(selectedTask.value.id)
          
          // Remove from local state
          const index = tasks.value.findIndex(t => t.id === selectedTask.value.id)
          if (index !== -1) {
            tasks.value.splice(index, 1)
          }
          
          closeTaskDetail()
          showAlert('Задача удалена!')
        } catch (error) {
          console.error('Error deleting task:', error)
          showAlert('Ошибка при удалении задачи')
        }
      }
    }
    
    const handleBack = () => {
      router.push('/tasks')
    }

    const navigateTo = (path) => {
      router.push(path)
    }

    // Employee notes methods
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const saveEmployeeNotes = async () => {
      if (!employeeNotes.value.trim() || !selectedTask.value) return
      
      try {
        const noteData = {
          taskId: selectedTask.value.id,
          text: employeeNotes.value.trim(),
          employeeId: selectedTask.value.assignee?.id
        }
        
        // Call API to save note
        const response = await calendarAPI.saveEmployeeNote(noteData)
        
        if (response.data.success) {
          // Add note to task's notes array
          if (!selectedTask.value.employeeNotes) {
            selectedTask.value.employeeNotes = []
          }
          
          selectedTask.value.employeeNotes.unshift({
            id: response.data.data.id,
            text: employeeNotes.value.trim(),
            createdAt: new Date(),
            userId: response.data.data.userId
          })
          
          employeeNotes.value = ''
          showAlert('Заметка сохранена!')
        }
      } catch (error) {
        console.error('Error saving employee note:', error)
        showAlert('Ошибка при сохранении заметки')
      }
    }

    const deleteEmployeeNote = async (noteId) => {
      try {
        const shouldDelete = await showConfirm(
          'Удалить заметку?',
          'Заметка будет удалена безвозвратно.'
        )
        
        if (!shouldDelete) return
        
        const response = await calendarAPI.deleteEmployeeNote(noteId)
        
        if (response.data.success) {
          // Remove note from task's notes array
          if (selectedTask.value.employeeNotes) {
            selectedTask.value.employeeNotes = selectedTask.value.employeeNotes.filter(
              note => note.id !== noteId
            )
          }
          showAlert('Заметка удалена!')
        }
      } catch (error) {
        console.error('Error deleting employee note:', error)
        showAlert('Ошибка при удалении заметки')
      }
    }

    // When opening task detail, load existing notes
    const openTaskDetail = (task) => {
      selectedTask.value = task
      employeeNotes.value = ''
      showTaskDetailModal.value = true
      
      // Load employee notes if assignee exists
      if (task.assignee) {
        loadEmployeeNotes(task.id)
      }
    }

    const loadEmployeeNotes = async (taskId) => {
      try {
        const response = await calendarAPI.getEmployeeNotes(taskId)
        if (response.data.success && selectedTask.value) {
          selectedTask.value.employeeNotes = response.data.data
        }
      } catch (error) {
        console.error('Error loading employee notes:', error)
      }
    }
    
    // Load tasks from API
    const loadTasks = async () => {
      try {
        // Загружаем все задачи пользователя (входящие, исходящие, личные)
        const [incomingResponse, outgoingResponse, personalResponse] = await Promise.all([
          tasksAPI.getAll({ type: 'incoming' }),
          tasksAPI.getAll({ type: 'outgoing' }),
          tasksAPI.getAll({ type: 'personal' })
        ])
        
        console.log('Calendar tasks loaded:', {
          incoming: incomingResponse.data,
          outgoing: outgoingResponse.data,
          personal: personalResponse.data
        })
        
        const allTasks = []
        
        // Обрабатываем входящие задачи
        if (incomingResponse.data.success && incomingResponse.data.data.tasks) {
          allTasks.push(...incomingResponse.data.data.tasks)
        }
        
        // Обрабатываем исходящие задачи
        if (outgoingResponse.data.success && outgoingResponse.data.data.tasks) {
          allTasks.push(...outgoingResponse.data.data.tasks)
        }
        
        // Обрабатываем личные задачи
        if (personalResponse.data.success && personalResponse.data.data.tasks) {
          allTasks.push(...personalResponse.data.data.tasks)
        }
        
        // Фильтруем только задачи с датами и преобразуем для календаря
        tasks.value = allTasks
          .filter(apiTask => apiTask.due_date) // Только задачи с датами
          .map(apiTask => ({
            id: apiTask.id,
            title: apiTask.title,
            description: apiTask.description || '',
            time: new Date(apiTask.due_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(apiTask.due_date),
            status: mapStatusFromAPI(apiTask.status_name),
            priority: mapPriorityFromAPI(apiTask.priority_name),
            dateSetBy: 'sender', // Можно расширить логику
            isPersonal: apiTask.is_personal,
            assignee: {
              name: apiTask.is_personal ? 'Я' : 
                    (apiTask.assigned_to === apiTask.created_by ? 
                     `${apiTask.creator_first_name || ''} ${apiTask.creator_last_name || ''}`.trim() || 'Создатель' :
                     `${apiTask.assigned_first_name || ''} ${apiTask.assigned_last_name || ''}`.trim() || 'Исполнитель'),
              avatar: null,
              position: apiTask.is_personal ? 'Личная задача' : 'Сотрудник'
            }
          }))
          
        console.log('Calendar tasks processed:', tasks.value)
        
      } catch (error) {
        console.error('Error loading tasks:', error)
        tasks.value = [] // Очищаем задачи при ошибке
      }
    }
    
    const mapStatusFromAPI = (statusName) => {
      const statusMap = {
        'Ожидает': 'no_status',
        'В работе': 'in_progress', 
        'Выполнено': 'completed',
        'Отменено': 'cancelled'
      }
      return statusMap[statusName] || 'no_status'
    }

    const mapPriorityFromAPI = (priorityName) => {
      const priorityMap = {
        'Низкий': 'low',
        'Средний': 'medium',
        'Высокий': 'high'
      }
      return priorityMap[priorityName] || 'medium'
    }
    
    // Initialize
    onMounted(() => {
      loadTasks()
    })
    
    return {
      currentDate,
      selectedDate,
      showYearModal,
      showTaskMenuModal,
      showDeleteModal,
      showTaskDetailModal,
      showCalendarActionModal,
      showStatusActionModal,
      showPriorityActionModal,
      selectedTask,
      taskMenuPosition,
      expandedSections,
      weekdays,
      tasks,
      availableYears,
      calendarDays,
      canChangePriority,
      formatMonthYear,
      formatTaskTime,
      formatTaskDate,
      getInitials,
      getStatusText,
      getStatusClass,
      getPriorityText,
      getPriorityClass,
      getDateDescription,
      isToday,
      isPastDate,
      isDateSelected,
      hasTasksOnDate,
      getTasksByStatus,
      selectDate,
      previousMonth,
      nextMonth,
      showYearSelector,
      closeYearModal,
      selectYear,
      toggleSection,
      showTaskMenu,
      closeTaskMenu,
      changeTaskStatus,
      confirmDeleteTask,
      closeDeleteModal,
      deleteTask,
      openTaskDetail,
      closeTaskDetail,
      showCalendarAction,
      closeCalendarAction,
      goToCalendarDate,
      showDatePicker,
      showStatusAction,
      closeStatusAction,
      changeTaskStatusFromDetail,
      showPriorityAction,
      closePriorityAction,
      changeTaskPriorityFromDetail,
      confirmDeleteTaskFromDetail,
      handleBack,
      navigateTo,
      employeeNotes,
      formatDate,
      saveEmployeeNotes,
      deleteEmployeeNote,
      loadEmployeeNotes
    }
  }
}
</script>

<style scoped>
.calendar-screen {
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

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px; /* Space for bottom navigation */
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.month-year-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
}

.month-year-btn:hover {
  background: rgba(0, 122, 255, 0.1);
}

.calendar-container {
  background: #1C1C1E;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.weekday {
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 8px 4px;
}

.bottom-navigation {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #1C1C1E;
  border-top: 1px solid #2C2C2E;
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  position: sticky;
  bottom: 0;
}

.bottom-navigation .nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
  gap: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.bottom-navigation .nav-btn.active {
  color: #007AFF;
}

.bottom-navigation .nav-btn:active {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.1);
}

.calendar-grid {
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
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
  font-weight: 500;
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
  font-weight: 600;
}

.calendar-day.today {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
  font-weight: 600;
}

.calendar-day.today.selected {
  background: #007AFF;
  color: #FFFFFF;
}

.calendar-day.past-date {
  color: #3A3A3C;
  cursor: not-allowed;
}

.calendar-day.disabled {
  pointer-events: none;
}

.task-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  background: #007AFF;
  border-radius: 2px;
}

.tasks-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1C1C1E;
  border-radius: 8px;
  cursor: pointer;
}

.section-title {
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.expand-btn svg.rotated {
  transform: rotate(180deg);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1C1C1E;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-item:hover {
  background: #2C2C2E;
}

.task-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.task-status-indicator.in-progress {
  background: #007AFF;
}

.task-status-indicator.completed {
  background: #34C759;
}

.task-status-indicator.no-status {
  background: #8E8E93;
}

.task-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}

.task-avatar img {
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
  font-size: 14px;
  font-weight: 600;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-title {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}

.task-time {
  color: #8E8E93;
  font-size: 14px;
}

.task-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.task-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
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

/* Year Modal */
.years-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.year-option {
  padding: 12px 16px;
  background: #2C2C2E;
  border-radius: 8px;
  color: #FFFFFF;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
}

.year-option:hover {
  background: #3A3A3C;
}

.year-option.selected {
  background: #007AFF;
}

/* Task Menu Modal */
.task-menu-modal {
  position: absolute;
  width: 200px;
  max-width: none;
  max-height: none;
}

.task-menu-options {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #2C2C2E;
  border-radius: 8px;
  overflow: hidden;
}

.menu-option {
  background: #1C1C1E;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-option:hover {
  background: #2C2C2E;
}

.status-option {
  color: #FFFFFF;
}

.delete-option {
  color: #FF3B30;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  flex-shrink: 0;
}

.option-check {
  width: 16px;
  height: 16px;
  border: 2px solid #8E8E93;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
}

.option-check.selected {
  border-color: #007AFF;
  background: #007AFF;
}

/* Delete Modal */
.delete-modal {
  max-width: 300px;
}

.delete-modal .modal-body p {
  color: #FFFFFF;
  margin-bottom: 20px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn-modal,
.delete-btn-modal {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn-modal {
  background: #2C2C2E;
  color: #FFFFFF;
}

.delete-btn-modal {
  background: #FF3B30;
  color: #FFFFFF;
}

/* Task Detail Modal */
.task-detail-modal {
  max-width: 100%;
  width: 90vw;
  max-height: 90vh;
}

.task-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #2C2C2E;
}

.header-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.exit-btn svg {
  color: #007AFF;
}

.delete-btn svg {
  color: #FF3B30;
}

.task-detail-title {
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  flex: 1;
  padding: 0 16px;
}

.task-detail-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h4 {
  color: #8E8E93;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.task-description {
  color: #FFFFFF;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.employee-details {
  display: flex;
  flex-direction: column;
}

.employee-name {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
}

.employee-position {
  color: #8E8E93;
  font-size: 14px;
}

.action-icons-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-icon {
  flex: 1;
  min-width: 80px;
  background: #1C1C1E;
  border-radius: 12px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-icon:hover {
  background: #2C2C2E;
}

.icon-container {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.calendar-icon {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.calendar-icon.has-date {
  background: #007AFF;
  color: #FFFFFF;
}

.status-icon {
  background: rgba(142, 142, 147, 0.2);
  color: #8E8E93;
}

.status-icon.in_progress,
.status-icon.in-progress {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.status-icon.completed {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.status-icon.no_status,
.status-icon.no-status {
  background: rgba(142, 142, 147, 0.2);
  color: #8E8E93;
}

.priority-icon {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
}

.priority-icon.low {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.priority-icon.medium {
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
}

.priority-icon.high {
  background: rgba(255, 59, 48, 0.2);
  color: #FF3B30;
}

.icon-label {
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.icon-value {
  color: #8E8E93;
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
}

/* Calendar Action Modal */
.calendar-action-modal {
  max-width: 320px;
}

.calendar-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #2C2C2E;
  border-radius: 8px;
}

.date-text {
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.date-description {
  color: #8E8E93;
  font-size: 14px;
  margin: 4px 0 0 0;
}

.go-to-calendar-btn,
.set-date-btn {
  width: 100%;
  padding: 12px;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.go-to-calendar-btn:hover,
.set-date-btn:hover {
  background: #0056D6;
}

.no-date-info {
  text-align: center;
}

.no-date-info p {
  color: #8E8E93;
  margin-bottom: 16px;
}

/* Status Action Modal */
.status-action-modal,
.priority-action-modal {
  max-width: 280px;
}

.status-options,
.priority-options {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #2C2C2E;
  border-radius: 8px;
  overflow: hidden;
}

.status-option,
.priority-option {
  background: #1C1C1E;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.status-option:hover,
.priority-option:hover {
  background: #2C2C2E;
}

.status-option.disabled,
.priority-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-option.disabled:hover,
.priority-option.disabled:hover {
  background: #1C1C1E;
}

.status-option span,
.priority-option span {
  color: #FFFFFF;
  flex: 1;
}

.priority-indicator {
  width: 12px;
  height: 12px;
  border-radius: 6px;
  flex-shrink: 0;
}

.priority-indicator.low {
  background: #34C759;
}

.priority-indicator.medium {
  background: #FFC107;
}

.priority-indicator.high {
  background: #FF3B30;
}

.priority-note {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  border-left: 3px solid #FFC107;
}

.priority-note p {
  color: #FFC107;
  font-size: 14px;
  margin: 0;
}

/* Bottom Navigation */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  z-index: 1000;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-btn.active {
  background: #007AFF;
}

.nav-btn span {
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
}

/* New Status Indicators */
.task-status-indicator.under-review {
  background: #FFC107;
}

.task-status-indicator.postponed {
  background: #FF9500;
}

.task-status-indicator.cancelled {
  background: #FF3B30;
}

.status-indicator.under-review {
  background: #FFC107;
}

.status-indicator.postponed {
  background: #FF9500;
}

.status-indicator.cancelled {
  background: #FF3B30;
}

/* Bottom Spacer for Scrolling */
.bottom-spacer {
  height: 120px; /* Extra space for comfortable scrolling */
}

/* Employee Notes Styles */
.employee-notes {
  margin-top: 8px;
}

.notes-textarea {
  width: 100%;
  background: #2C2C2E;
  border: 1px solid #3A3A3C;
  border-radius: 8px;
  color: #FFFFFF;
  padding: 12px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  resize: vertical;
  min-height: 80px;
}

.notes-textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.notes-textarea::placeholder {
  color: #8E8E93;
}

.notes-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.save-notes-btn {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-notes-btn:hover {
  background: #0056D6;
}

.save-notes-btn:disabled {
  background: #3A3A3C;
  color: #8E8E93;
  cursor: not-allowed;
}

.existing-notes {
  margin-top: 16px;
}

.existing-notes h5 {
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.note-item {
  background: #2C2C2E;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.note-content {
  color: #FFFFFF;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-date {
  color: #8E8E93;
  font-size: 12px;
}

.delete-note-btn {
  background: #FF3B30;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-note-btn:hover {
  background: #D70015;
}

/* Task Avatar Styles */
.task-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  flex-shrink: 0;
}

.task-avatar img {
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
  font-weight: 600;
  font-size: 16px;
}
</style> 