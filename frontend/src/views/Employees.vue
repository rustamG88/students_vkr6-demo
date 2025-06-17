<template>
  <div class="employees-screen">
    <!-- Header -->
    <div class="header">
      <button class="cancel-btn" @click="handleCancel">Cancel</button>
      <div class="title-container">
        <h1 class="title">Сотрудники</h1>
        <span class="subtitle">Управление командой</span>
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
          placeholder="Поиск сотрудников..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">×</button>
      </div>
    </div>

    <!-- Position Tabs -->
    <div class="tabs-container">
      <div class="tabs-scroll">
        <button
          v-for="(tab, index) in companyTabs"
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
      <!-- Employee List -->
      <div class="employee-list" v-if="filteredEmployees.length > 0">
        <div
          v-for="employee in filteredEmployees"
          :key="employee.id"
          class="employee-card"
          @click="openEmployeeProfile(employee)"
        >
          <div class="employee-avatar">
            <img v-if="employee.avatar" :src="employee.avatar" :alt="employee.name" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              {{ getEmployeeInitials(employee.name) }}
            </div>
          </div>
          <div class="employee-info">
            <h3 class="employee-name">{{ employee.name }}</h3>
            <p class="employee-position">{{ employee.position }}</p>
            <p class="employee-company">{{ employee.company }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" v-else>
        <div class="empty-icon">👥</div>
        <h3 class="empty-title">Сотрудники не найдены</h3>
        <p class="empty-text">
          {{ searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В данном департаменте пока нет сотрудников' }}
        </p>
      </div>
    </div>

    <!-- Add Employee Button (только для админов) -->
    <div class="add-employee-container" v-if="isAdmin">
      <button class="add-employee-btn" @click="showAddEmployee">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white"/>
        </svg>
      </button>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-navigation">
      <button class="nav-btn" @click="navigateTo('/tasks')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#8E8E93"/>
        </svg>
        <span>Задачи</span>
      </button>
      <button class="nav-btn" @click="navigateTo('/calendar')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z" fill="#8E8E93"/>
        </svg>
        <span>Календарь</span>
      </button>
      <button class="nav-btn" @click="navigateTo('/employees')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.21 7 16 8.79 16 11C16 13.21 14.21 15 12 15C9.79 15 8 13.21 8 11C8 8.79 9.79 7 12 7ZM6 19C6 16.33 9.33 15 12 15C14.67 15 18 16.33 18 19V20H6V19Z" fill="#007AFF"/>
        </svg>
        <span>Сотрудники</span>
      </button>
      <button class="nav-btn" @click="navigateTo('/profile')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM6.023 15.416C7.491 17.606 9.695 19 12.16 19C14.625 19 16.829 17.606 18.297 15.416C16.755 13.249 14.615 11.954 12.16 11.954C9.705 11.954 7.565 13.249 6.023 15.416ZM12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4Z" fill="#8E8E93"/>
        </svg>
        <span>Профиль</span>
      </button>
    </div>

    <!-- Invite Modal -->
    <div class="modal-overlay" v-if="showInviteModal" @click="closeInviteModal">
      <div class="invite-modal" @click.stop>
        <div class="modal-header">
          <button class="modal-close" @click="closeInviteModal">×</button>
          <h3 class="modal-title">Пригласить сотрудника</h3>
        </div>
        
        <div class="modal-content">
          <div class="modal-actions">
            <button class="modal-btn primary" @click="sendInvitation" :disabled="inviteLoading">
              {{ inviteLoading ? 'Отправляем...' : 'Отправить' }}
            </button>
            
            <button class="modal-btn primary" @click="copyInviteLink">
              Копировать ссылку
            </button>
          </div>
          
          <div class="admin-checkbox">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                v-model="isAdminInvite" 
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">Назначить администратором</span>
            </label>
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
import { employeesAPI, usersAPI } from '@/services/api'

export default {
  name: 'Employees',
  setup() {
    const router = useRouter()
    const { showAlert, close, openTelegramLink } = useWebApp()
    
    // State
    const showSearch = ref(false)
    const searchQuery = ref('')
    const activeTab = ref(0)
    const employees = ref([])
    const loading = ref(false)
    const showInviteModal = ref(false)
    const isAdminInvite = ref(false) // Переименовали чтобы не путать с правами пользователя
    const inviteLoading = ref(false)
    const currentUser = ref(null)
    
    // Проверка прав администратора
    const isAdmin = computed(() => {
      return currentUser.value?.is_admin === 1 || currentUser.value?.is_admin === true
    })

    // Динамические отделы на основе должностей сотрудников
    const companyTabs = computed(() => {
      const tabs = [{ name: 'ВСЕ', filter: 'all' }]
      
      // Получаем все уникальные должности из сотрудников
      const allEmployees = employees.value || []
      const positions = new Set()
      
      // Логируем для отладки
      console.log('Creating tabs from employees:', allEmployees.length, 'employees')
      
      allEmployees.forEach(emp => {
        if (emp.position) {
          // Нормализуем должность для создания отдела
          const normalizedPosition = normalizePosition(emp.position)
          positions.add(normalizedPosition)
          console.log(`Employee: ${emp.name}, Position: ${emp.position} -> Normalized: ${normalizedPosition}`)
        }
      })
      
      // Создаем вкладки для каждой уникальной должности
      const sortedPositions = Array.from(positions).sort()
      console.log('Unique positions found:', sortedPositions)
      
      sortedPositions.forEach(position => {
        tabs.push({
          name: position.toUpperCase(),
          filter: position.toLowerCase()
        })
      })
      
      console.log('Final tabs:', tabs)
      return tabs
    })

    // Функция нормализации должности для группировки
    const normalizePosition = (position) => {
      if (!position) return 'Не указано'
      const pos = position.toLowerCase()
      
      // Группируем похожие должности
      if (pos.includes('менеджер') || pos.includes('manager')) return 'Менеджеры'
      if (pos.includes('разработчик') || pos.includes('developer') || pos.includes('программист')) return 'Разработчики'
      if (pos.includes('дизайнер') || pos.includes('designer')) return 'Дизайнеры'
      if (pos.includes('директор') || pos.includes('director') || pos.includes('ceo')) return 'Руководство'
      if (pos.includes('hr') || pos.includes('кадр')) return 'HR'
      if (pos.includes('финанс') || pos.includes('бухгалтер')) return 'Финансы'
      if (pos.includes('аналитик')) return 'Аналитики'
      if (pos.includes('тестировщик') || pos.includes('qa')) return 'Тестирование'
      if (pos.includes('маркетинг') || pos.includes('реклам')) return 'Маркетинг'
      if (pos.includes('продаж') || pos.includes('sales')) return 'Продажи'
      
      // Если не подходит ни под одну категорию, используем оригинальное название
      return position.charAt(0).toUpperCase() + position.slice(1)
    }

    // Убираем демо-данные - показываем только реальных сотрудников команды

    // API Methods
    // Computed
    const filteredEmployees = computed(() => {
      let filtered = employees.value || []

      // УЛУЧШЕННАЯ фильтрация по отделам на основе должностей
      const currentTab = companyTabs.value[activeTab.value]
      if (currentTab && currentTab.filter !== 'all') {
        filtered = filtered.filter(emp => {
          if (!emp.position) return false
          
          const normalizedEmployeePosition = normalizePosition(emp.position)
          const tabFilter = currentTab.filter
          
          // Сравниваем нормализованную должность с фильтром вкладки
          return normalizedEmployeePosition.toLowerCase() === tabFilter
        })
      }

      // Filter by search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(emp =>
          emp.name?.toLowerCase().includes(query) ||
          emp.position?.toLowerCase().includes(query) ||
          emp.company?.toLowerCase().includes(query) ||
          (emp.department && emp.department.toLowerCase().includes(query))
        )
      }

      // УЛУЧШЕННАЯ сортировка - сначала по отделам, потом по должности, потом по имени
      return filtered.sort((a, b) => {
        // Группируем по отделам
        const deptA = normalizePosition(a.position || '')
        const deptB = normalizePosition(b.position || '')
        const deptCompare = deptA.localeCompare(deptB, 'ru')
        
        if (deptCompare !== 0) {
          return deptCompare
        }
        
        // Внутри отдела сортируем по должности
        const positionCompare = (a.position || '').localeCompare(b.position || '', 'ru')
        if (positionCompare !== 0) {
          return positionCompare
        }
        
        // Потом по имени
        return (a.name || '').localeCompare(b.name || '', 'ru')
      })
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
    }

    const getEmployeeInitials = (name) => {
      if (!name) return 'N/A'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const openEmployeeProfile = (employee) => {
      // Navigate to employee profile
      router.push(`/employees/${employee.id}`)
    }

    // removeEmployee функция удалена - удаление только из карточки сотрудника (для админов)

    const showAddEmployee = () => {
      showInviteModal.value = true
    }

    const closeInviteModal = () => {
      showInviteModal.value = false
      isAdminInvite.value = false
    }

    const sendInvitation = async () => {
      inviteLoading.value = true
      try {
        // Generate invitation link via API
        const response = await employeesAPI.generateInvite({ is_admin: isAdminInvite.value })
        
        if (response.data.success) {
          const inviteLink = response.data.data.inviteLink
          
          const inviteText = isAdminInvite.value 
            ? '🔑 Присоединяйтесь к нашей команде в корпоративном приложении с правами администратора!\n\n📱 Нажмите на ссылку для входа:' 
            : '👥 Присоединяйтесь к нашей команде в корпоративном приложении!\n\n📱 Нажмите на ссылку для входа:'
          
          // Open Telegram with share intent
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteText)}`
          openTelegramLink(shareUrl)
          
          closeInviteModal()
          
          const successMessage = isAdminInvite.value 
            ? '✅ Приглашение с правами администратора готово к отправке через Telegram'
            : '✅ Приглашение готово к отправке через Telegram'
          
          showAlert(successMessage)
        } else {
          showAlert('❌ Ошибка при создании приглашения: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error generating invitation:', error)
        const errorMessage = error.response?.data?.message || 'Ошибка при создании приглашения'
        showAlert('❌ ' + errorMessage)
      } finally {
        inviteLoading.value = false
      }
    }

    const copyInviteLink = async () => {
      try {
        // Generate invitation link via API
        const response = await employeesAPI.generateInvite({ is_admin: isAdminInvite.value })
        
        if (response.data.success) {
          const inviteLink = response.data.data.inviteLink
          
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(inviteLink)
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = inviteLink
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
          }
          
          const message = isAdminInvite.value 
            ? '🔗 Ссылка для приглашения администратора скопирована в буфер обмена'
            : '🔗 Ссылка приглашения скопирована в буфер обмена'
          
          showAlert(message)
          closeInviteModal()
        } else {
          showAlert('❌ Ошибка при создании приглашения: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error generating invitation:', error)
        const errorMessage = error.response?.data?.message || 'Ошибка при создании приглашения'
        showAlert('❌ ' + errorMessage)
      }
    }



    const handleCancel = () => {
      close()
    }

    const navigateTo = (path) => {
      router.push(path)
    }

    const loadEmployees = async () => {
      loading.value = true
      try {
        const response = await employeesAPI.getAll()
        if (response.data.success) {
          employees.value = response.data.data.employees.map(emp => ({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`.trim(),
            position: emp.position,
            department: emp.department,
            company: emp.company || emp.department || 'Не указано', // Используем company, fallback на department
            avatar: emp.avatar_url,
            phone: emp.phone,
            email: emp.email,
            nickname: emp.username,
            birthday: null, // Not in API response
            notes: null, // Not in API response
            active_tasks_count: emp.active_tasks_count || 0
          }))
        } else {
          console.warn('API returned unsuccessful response')
          employees.value = []
        }
      } catch (error) {
        console.error('Error loading employees:', error)
        employees.value = []
        showAlert('Ошибка при загрузке сотрудников. Проверьте подключение к интернету.')
      } finally {
        loading.value = false
      }
    }

    // Загрузка данных текущего пользователя для проверки прав
    const loadCurrentUser = async () => {
      try {
        const response = await usersAPI.getMe()
        if (response.data.success) {
          currentUser.value = response.data.data
          console.log('Current user in employees:', currentUser.value, 'isAdmin:', isAdmin.value)
        }
      } catch (error) {
        console.error('Error loading current user:', error)
        // Если не удается загрузить - считаем что не админ
        currentUser.value = { is_admin: false }
      }
    }

    // Lifecycle
    onMounted(() => {
      loadCurrentUser()
      loadEmployees()
    })

    return {
      showSearch,
      searchQuery,
      activeTab,
      companyTabs,
      filteredEmployees,
      loading,
      showInviteModal,
      isAdmin,
      isAdminInvite,
      inviteLoading,
      normalizePosition,
      toggleSearch,
      clearSearch,
      handleSearch,
      selectTab,
      getEmployeeInitials,
      openEmployeeProfile,
      showAddEmployee,
      closeInviteModal,
      sendInvitation,
      copyInviteLink,
      handleCancel,
      navigateTo
    }
  }
}
</script>

<style scoped>
.employees-screen {
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

.tab-btn.add-tab {
  color: #007AFF;
  font-size: 20px;
  padding: 8px 12px;
}

.tab-btn:active {
  opacity: 0.6;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px; /* Space for bottom navigation */
}

.employee-list {
  padding: 16px;
}

.employee-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(44, 44, 46, 0.8);
  border: 1px solid rgba(84, 84, 88, 0.6);
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.employee-card:active {
  background: rgba(44, 44, 46, 1);
  transform: scale(0.98);
}

.employee-avatar {
  width: 48px;
  height: 48px;
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar-image {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.employee-info {
  flex: 1;
}

.employee-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.employee-position {
  font-size: 14px;
  color: #007AFF;
  margin: 0 0 2px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.employee-company {
  font-size: 14px;
  color: #8E8E93;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.employee-actions {
  margin-left: 12px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 59, 48, 0.8);
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-btn:active {
  background: rgba(255, 59, 48, 1);
  transform: scale(0.95);
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

.add-employee-container {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 50;
}

.add-employee-btn {
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

.add-employee-btn:active {
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

.nav-btn:nth-child(3) {
  color: #007AFF;
}

.nav-btn:nth-child(3) svg path {
  fill: #007AFF;
}

@media (max-width: 480px) {
  .employee-card {
    padding: 12px;
  }
  
  .employee-avatar {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }
  
  .avatar-image,
  .avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
  
  .avatar-placeholder {
    font-size: 16px;
  }
  
  .employee-name {
    font-size: 15px;
  }
  
  .employee-position,
  .employee-company {
    font-size: 13px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.invite-modal {
  background: #1C1C1E;
  border-radius: 16px;
  max-width: 320px;
  width: 100%;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 20px 20px 10px 20px;
  text-align: center;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}

.modal-close:active {
  opacity: 0.6;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-content {
  padding: 10px 20px 20px 20px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-btn {
  background: #007AFF;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 14px 20px;
  border-radius: 10px;
  transition: all 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-btn:active {
  background: #0056B3;
  transform: scale(0.98);
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-checkbox {
  padding: 16px 0;
  border-top: 0.5px solid rgba(255, 255, 255, 0.1);
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  opacity: 0;
  position: absolute;
  pointer-events: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #8E8E93;
  border-radius: 4px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: transparent;
}

.checkbox-input:checked + .checkbox-custom {
  background: #007AFF;
  border-color: #007AFF;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  font-size: 16px;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
}
</style> 