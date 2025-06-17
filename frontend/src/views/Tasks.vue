<template>
  <div class="tasks-screen">
    <!-- Header -->
    <div class="header">
      <button class="cancel-btn" @click="handleCancel">Cancel</button>
      <div class="title-container">
        <h1 class="title">Задачи</h1>
        <span class="subtitle">Управление задачами</span>
      </div>
      <div class="search-btn" @click="toggleSearch">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#007AFF"/>
        </svg>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container" v-if="showSearch">
      <div class="search-input-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="search-icon">
          <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#8E8E93"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск задач..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">×</button>
      </div>
    </div>

    <!-- Task Tabs -->
    <div class="tabs-container">
      <div class="tabs-scroll">
        <button
          v-for="(tab, index) in taskTabs"
          :key="index"
          class="tab-btn"
          :class="{ 'active': activeTab === index }"
          @click="selectTab(index)"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Task List -->
      <div class="task-list" v-if="filteredTasks.length > 0">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-card"
          @click="openTaskDetails(task)"
        >
          <div class="task-avatar">
            <img v-if="task.avatar" :src="task.avatar" :alt="task.senderName" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              {{ getTaskInitials(task.senderName) }}
            </div>
          </div>
          <div class="task-info">
            <div class="task-header">
              <h3 class="task-sender">{{ task.senderName }}</h3>
              <span class="task-time">{{ formatTime(task.createdAt) }}</span>
            </div>
            <p class="task-text">{{ task.text }}</p>
            <div class="task-meta">
              <span class="task-status" :class="getStatusClass(task.status)">
                {{ getStatusText(task.status) }}
              </span>
              <span class="task-priority" :class="getPriorityClass(task.priority)">
                {{ getPriorityText(task.priority) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" v-else>
        <div class="empty-icon">📋</div>
        <h3 class="empty-title">Задачи не найдены</h3>
        <p class="empty-text">
          {{ searchQuery ? 'Попробуйте изменить поисковый запрос' : getEmptyStateText() }}
        </p>
      </div>
    </div>

    <!-- Add Task Button -->
    <div class="add-task-container">
      <button class="add-task-btn" @click="showCreateTask">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white"/>
        </svg>
      </button>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { tasksAPI } from '@/services/api'
import BottomNavigation from '@/components/BottomNavigation.vue'

export default {
  name: 'Tasks',
  components: {
    BottomNavigation
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { showAlert, close } = useWebApp()
    
    // State
    const showSearch = ref(false)
    const searchQuery = ref('')
    const activeTab = ref(0)
    const tasks = ref([])
    const loading = ref(false)

    // Task tabs
    const taskTabs = ref([
      { name: 'ВХОДЯЩИЕ', filter: 'incoming' },
      { name: 'ИСХОДЯЩИЕ', filter: 'outgoing' },
      { name: 'ЛИЧНЫЕ', filter: 'personal' }
    ])

    // Убираем демо-данные - показываем только реальные задачи пользователя

    // Computed
    const filteredTasks = computed(() => {
      let filtered = tasks.value || []

      // Filter by search query (фильтрация по типу теперь происходит на сервере)
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(task =>
          task.text.toLowerCase().includes(query) ||
          task.senderName.toLowerCase().includes(query) ||
          task.title.toLowerCase().includes(query)
        )
      }

      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })

    // Methods
    const toggleSearch = () => {
      showSearch.value = !showSearch.value
      if (!showSearch.value) {
        clearSearch()
      }
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }

    const handleSearch = () => {
      // Search is handled by computed property
    }

    const selectTab = (index) => {
      activeTab.value = index
      // Обновляем URL без перезагрузки страницы
      const tab = taskTabs.value[index]?.filter
      if (tab) {
        router.replace({ query: { ...route.query, tab } })
      }
      // Перезагружаем задачи для выбранного типа
      loadTasks()
    }

    const getTaskInitials = (name) => {
      if (!name) return 'N/A'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const formatTime = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
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
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
      }
      return texts[priority] || 'Средний'
    }

    const getEmptyStateText = () => {
      const currentTab = taskTabs.value[activeTab.value]
      const texts = {
        'incoming': 'У вас нет входящих задач',
        'outgoing': 'Вы еще не отправляли задач',
        'personal': 'У вас нет личных задач'
      }
      return texts[currentTab?.filter] || 'Задач пока нет'
    }

    const openTaskDetails = (task) => {
      if (task.type === 'outgoing') {
        router.push(`/tasks/outgoing/${task.id}`)
      } else {
        router.push(`/tasks/${task.id}`)
      }
    }

    const showCreateTask = () => {
      router.push('/tasks/create')
    }

    const handleCancel = () => {
      close()
    }

    const navigateTo = (path) => {
      router.push(path)
    }

    const loadTasks = async () => {
      loading.value = true
      try {
        // Получаем тип задач из активной вкладки
        const currentTab = taskTabs.value[activeTab.value]
        const taskType = currentTab?.filter || 'incoming'
        
        const response = await tasksAPI.getAll({ type: taskType })
        if (response.data.success) {
          // Transform API data to match our component structure
          tasks.value = response.data.data.tasks.map(task => {
            // Определяем тип задачи согласно ТЗ
            let taskType = 'incoming'
            let senderName = 'Отправитель'
            let senderPosition = 'Сотрудник'
            
            if (task.is_personal || (task.assigned_to === task.created_by)) {
              // ЛИЧНЫЕ задачи
              taskType = 'personal'
              senderName = 'Я'
              senderPosition = 'Личная задача'
            } else if (task.created_by === task.assigned_to) {
              // Это не должно происходить, но на всякий случай
              taskType = 'personal'
              senderName = 'Я'
              senderPosition = 'Личная задача'
            } else {
              // Определяем по текущему пользователю
              const currentTab = taskTabs.value[activeTab.value]
              if (currentTab?.filter === 'outgoing') {
                // ИСХОДЯЩИЕ: я создатель, показываем получателя
                taskType = 'outgoing'
                senderName = `${task.assigned_first_name || ''} ${task.assigned_last_name || ''}`.trim() || 'Получатель'
                senderPosition = 'Получатель'
              } else {
                // ВХОДЯЩИЕ: я получатель, показываем создателя
                taskType = 'incoming'
                senderName = `${task.creator_first_name || ''} ${task.creator_last_name || ''}`.trim() || 'Отправитель'
                senderPosition = 'Отправитель'
              }
            }
            
            return {
              id: task.id,
              type: taskType,
              title: task.title,
              senderName,
              senderPosition,
              text: task.description || task.title,
              status: task.status_name?.toLowerCase().replace(/\s+/g, '_') || 'pending',
              priority: task.priority_name?.toLowerCase() || 'medium',
              createdAt: task.created_at,
              avatar: null
            }
          })
        } else {
          console.warn('API returned unsuccessful response')
          tasks.value = []
        }
      } catch (error) {
        console.error('Error loading tasks:', error)
        tasks.value = []
        // НЕ показываем уведомление при первом входе - это нормально что задач нет
      } finally {
        loading.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      // Устанавливаем активную вкладку из URL-параметра
      const tabParam = route.query.tab
      if (tabParam) {
        const tabIndex = taskTabs.value.findIndex(tab => tab.filter === tabParam)
        if (tabIndex !== -1) {
          activeTab.value = tabIndex
        }
      }
      
      loadTasks()
    })

    return {
      showSearch,
      searchQuery,
      activeTab,
      taskTabs,
      filteredTasks,
      loading,
      toggleSearch,
      clearSearch,
      handleSearch,
      selectTab,
      getTaskInitials,
      formatTime,
      getStatusClass,
      getStatusText,
      getPriorityClass,
      getPriorityText,
      getEmptyStateText,
      openTaskDetails,
      showCreateTask,
      handleCancel,
      navigateTo
    }
  }
}
</script>

<style scoped>
.tasks-screen {
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
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
  height: 44px;
  min-height: 44px;
  position: sticky;
  top: 0;
  z-index: 100;
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
  justify-content: center;
  flex: 1;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #8E8E93;
  margin: 0;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.search-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 22px;
  background: none;
  border: none;
}

.search-btn:active {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.1);
}

.search-container {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
}

.search-input-container {
  display: flex;
  align-items: center;
  background: rgba(44, 44, 46, 0.8);
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(84, 84, 88, 0.6);
}

.search-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
}

.search-input::placeholder {
  color: #8E8E93;
}

.clear-btn {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
}

.tabs-container {
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
}

.tabs-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 12px 0;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.tab-btn.active {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.15);
}

.tab-btn:active {
  opacity: 0.6;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
}

.task-list {
  padding: 16px;
}

.task-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: rgba(44, 44, 46, 0.8);
  border: 1px solid rgba(84, 84, 88, 0.6);
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-card:active {
  background: rgba(44, 44, 46, 1);
  transform: scale(0.98);
}

.task-avatar {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-sender {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.task-time {
  font-size: 12px;
  color: #8E8E93;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.task-text {
  font-size: 14px;
  color: #ffffff;
  margin: 0 0 8px 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: 8px;
}

.task-status,
.task-priority {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.status-pending {
  background: rgba(255, 149, 0, 0.2);
  color: #FF9500;
}

.status-progress {
  background: rgba(0, 122, 255, 0.2);
  color: #007AFF;
}

.status-completed {
  background: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

.status-cancelled {
  background: rgba(255, 59, 48, 0.2);
  color: #FF3B30;
}

.priority-low {
  background: rgba(142, 142, 147, 0.2);
  color: #8E8E93;
}

.priority-medium {
  background: rgba(255, 149, 0, 0.2);
  color: #FF9500;
}

.priority-high {
  background: rgba(255, 59, 48, 0.2);
  color: #FF3B30;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.empty-text {
  font-size: 16px;
  color: #8E8E93;
  margin: 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.add-task-container {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 50;
}

.add-task-btn {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: #007AFF;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  transition: all 0.15s ease;
}

.add-task-btn:active {
  background: #0056B3;
  transform: scale(0.95);
}

.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(255, 255, 255, 0.1);
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  z-index: 100;
}

.nav-btn {
  background: none;
  border: none;
  color: #8E8E93;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.15s ease;
}

.nav-btn:active {
  opacity: 0.6;
}

.nav-btn:nth-child(1) {
  color: #007AFF;
}

.nav-btn:nth-child(1) svg path {
  fill: #007AFF;
}

@media (max-width: 480px) {
  .task-card {
    padding: 12px;
  }
  
  .task-avatar {
    width: 36px;
    height: 36px;
    margin-right: 10px;
  }
  
  .avatar-image,
  .avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 18px;
  }
  
  .avatar-placeholder {
    font-size: 14px;
  }
  
  .task-sender {
    font-size: 15px;
  }
  
  .task-text {
    font-size: 13px;
  }
}
</style> 