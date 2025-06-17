<template>
  <div class="employee-profile-screen">
    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="handleBack">←</button>
      <div class="title-container">
        <h1 class="title">{{ employee?.name || 'Анкета сотрудника' }}</h1>
        <span class="subtitle" v-if="employee?.position">{{ employee.position }}</span>
      </div>
      <button 
        v-if="isAdmin" 
        class="delete-btn" 
        @click="showDeleteConfirmation"
        title="Удалить сотрудника (только для администраторов)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#FF3B30"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="content" v-if="employee">
      <!-- Employee Header -->
      <div class="employee-header">
        <div class="employee-avatar">
          <img v-if="employee.avatar" :src="employee.avatar" :alt="employee.name" class="avatar-image" />
          <div v-else class="avatar-placeholder">
            {{ getEmployeeInitials(employee.name) }}
          </div>
        </div>
      </div>

      <!-- Employee Information -->
      <div class="employee-info-section">
        <!-- Name -->
        <div class="info-item">
          <div class="info-label">Имя</div>
          <div class="info-value">{{ employee.name }}</div>
        </div>

        <!-- Company -->
        <div class="info-item">
          <div class="info-label">Название компании</div>
          <div class="info-value">{{ employee.company }}</div>
        </div>

        <!-- Phone -->
        <div class="info-item">
          <div class="info-label">Номер телефона</div>
          <div class="info-value">{{ employee.phone }}</div>
        </div>

        <!-- Nickname -->
        <div class="info-item">
          <div class="info-label">Никнейм</div>
          <div class="info-value">{{ employee.nickname || 'Не указан' }}</div>
        </div>

        <!-- Position -->
        <div class="info-item">
          <div class="info-label">Должность</div>
          <div class="info-value">{{ employee.position }}</div>
        </div>

        <!-- Birthday -->
        <div class="info-item">
          <div class="info-label">Дата рождения</div>
          <div class="info-value">{{ formatBirthday(employee.birthday) }}</div>
        </div>

        <!-- About -->
        <div class="info-item">
          <div class="info-label">О себе</div>
          <div class="info-value">{{ employee.about_me || employee.notes || 'Информация не указана' }}</div>
        </div>

        <!-- Notes Section -->
        <div class="notes-section">
          <div class="notes-header">
            <h3 class="notes-title">Заметки</h3>
            <button class="add-note-btn" @click="showAddNote">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#007AFF"/>
              </svg>
            </button>
          </div>
          
          <div v-if="notes.length > 0" class="notes-list">
            <div v-for="note in notes" :key="note.id" class="note-item">
              <div class="note-content">
                <p class="note-text">{{ note.text }}</p>
                <span class="note-date">{{ formatNoteDate(note.created_at) }}</span>
              </div>
              <button class="note-delete" @click="deleteNote(note.id)">×</button>
            </div>
          </div>
          
          <div v-else class="empty-notes">
            <p class="empty-notes-text">Заметок пока нет</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-else-if="loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">Загрузка профиля...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" v-else>
      <div class="error-icon">❌</div>
      <h3 class="error-title">Сотрудник не найден</h3>
      <p class="error-text">Попробуйте обновить страницу или вернуться к списку сотрудников</p>
      <button class="back-to-list-btn" @click="goToEmployeesList">
        Вернуться к списку
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="closeDeleteModal">
      <div class="delete-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Удалить сотрудника?</h3>
        </div>
        <div class="modal-content">
          <p class="modal-text">Вы уверены, что хотите удалить сотрудника {{ employee?.name }}? Это действие нельзя будет отменить.</p>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="closeDeleteModal">
            Отмена
          </button>
          <button class="modal-btn delete" @click="confirmDelete" :disabled="deleteLoading">
            {{ deleteLoading ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Note Modal -->
    <div class="modal-overlay" v-if="showNoteModal" @click="closeNoteModal">
      <div class="note-modal" @click.stop>
        <div class="modal-header">
          <button class="modal-close" @click="closeNoteModal">×</button>
          <h3 class="modal-title">Добавить заметку</h3>
        </div>
        <div class="modal-content">
          <textarea
            v-model="noteText"
            placeholder="Введите заметку о сотруднике..."
            class="note-textarea"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="char-counter">{{ noteText.length }}/500</div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="closeNoteModal">
            Отмена
          </button>
          <button 
            class="modal-btn save" 
            @click="saveNote" 
            :disabled="!noteText.trim() || noteLoading"
          >
            {{ noteLoading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { employeesAPI, usersAPI } from '@/services/api'

export default {
  name: 'EmployeeProfile',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { showAlert } = useWebApp()
    
    const employee = ref(null)
    const loading = ref(true)
    const showDeleteModal = ref(false)
    const deleteLoading = ref(false)
    const notes = ref([])
    const showNoteModal = ref(false)
    const noteText = ref('')
    const noteLoading = ref(false)
    const currentUser = ref(null)
    
    // Проверка прав администратора
    const isAdmin = computed(() => {
      return currentUser.value?.is_admin === 1 || currentUser.value?.is_admin === true
    })

    // Mock employee data - replace with API call
    const mockEmployeeData = {
      1: {
        id: 1,
        name: 'Egor Sporyshev',
        position: 'Manager',
        department: 'ИТ',
        company: 'Cryptus',
        phone: '+78805546756',
        email: 'email@company.com',
        nickname: '@Fawn',
        birthday: '2003-06-18',
        notes: 'I am ...',
        avatar: null
      },
      2: {
        id: 2,
        name: 'Анна Иванова',
        position: 'Менеджер',
        department: 'МАРКЕТИНГ',
        company: 'ООО "ТехКомпани"',
        phone: '+7800555468',
        email: 'anna@company.com',
        nickname: '@anna_ivanova',
        birthday: '1985-05-15',
        notes: 'Отличный менеджер, ответственная и креативная.',
        avatar: null
      },
      3: {
        id: 3,
        name: 'Петр Петров',
        position: 'Разработчик',
        department: 'ИТ',
        company: 'ООО "ТехКомпани"',
        phone: '+7800555469',
        email: 'petr@company.com',
        nickname: '@petr_dev',
        birthday: '1992-03-20',
        notes: 'Опытный разработчик с большим стажем.',
        avatar: null
      },
      4: {
        id: 4,
        name: 'Мария Сидорова',
        position: 'Дизайнер',
        department: 'МАРКЕТИНГ',
        company: 'ООО "ТехКомпани"',
        phone: '+7800555470',
        email: 'maria@company.com',
        nickname: '@maria_design',
        birthday: '1988-07-10',
        notes: 'Креативный дизайнер с отличным вкусом.',
        avatar: null
      },
      5: {
        id: 5,
        name: 'Алексей Козлов',
        position: 'Директор',
        department: 'ДЕПАРТАМЕНТ',
        company: 'ООО "ТехКомпани"',
        phone: '+7800555471',
        email: 'alexey@company.com',
        nickname: '@alexey_boss',
        birthday: '1980-12-05',
        notes: 'Руководитель компании, стратег.',
        avatar: null
      }
    }

    const employeeId = computed(() => route.params.id)

    const getEmployeeInitials = (name) => {
      if (!name) return 'N/A'
      const names = name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const formatBirthday = (birthday) => {
      if (!birthday) return 'Не указана'
      const date = new Date(birthday)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const formatNoteDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        return 'Вчера'
      } else if (diffDays <= 7) {
        return `${diffDays} дн. назад`
      } else {
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    }

    const loadEmployee = async () => {
      loading.value = true
      try {
        const response = await employeesAPI.getById(employeeId.value)
        if (response.data.success) {
          const emp = response.data.data
          employee.value = {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`.trim(),
            position: emp.position,
            department: emp.department,
            company: emp.company || emp.department || 'Не указано',
            phone: emp.phone,
            email: emp.email,
            nickname: emp.username,
            birthday: emp.birthday,
            about_me: emp.about_me,
            notes: emp.about_me || emp.notes,
            avatar: emp.avatar_url
          }
          
          // Load employee notes
          await loadNotes()
        } else {
          // Fallback to mock data if API fails
          const empData = mockEmployeeData[employeeId.value]
          employee.value = empData || null
        }
      } catch (error) {
        console.error('Error loading employee:', error)
        // Fallback to mock data
        const empData = mockEmployeeData[employeeId.value]
        employee.value = empData || null
      } finally {
        loading.value = false
      }
    }

    const handleBack = () => {
      router.back()
    }

    const showDeleteConfirmation = () => {
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
    }

    const confirmDelete = async () => {
      deleteLoading.value = true
      try {
        const response = await employeesAPI.delete(employeeId.value)
        
        if (response.data.success) {
          showAlert('Сотрудник удален')
          router.push('/employees')
        } else {
          showAlert('Ошибка при удалении сотрудника: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error deleting employee:', error)
        const errorMessage = error.response?.data?.message || 'Ошибка при удалении сотрудника'
        showAlert(errorMessage)
      } finally {
        deleteLoading.value = false
        showDeleteModal.value = false
      }
    }

    const goToEmployeesList = () => {
      router.push('/employees')
    }

    // Notes functionality
    const showAddNote = () => {
      showNoteModal.value = true
    }

    const closeNoteModal = () => {
      showNoteModal.value = false
      noteText.value = ''
    }

    const saveNote = async () => {
      if (!noteText.value.trim()) return
      
      noteLoading.value = true
      try {
        console.log('Attempting to save note:', { 
          employeeId: employeeId.value, 
          text: noteText.value.trim() 
        })
        
        const response = await employeesAPI.addNote(employeeId.value, { text: noteText.value.trim() })
        
        console.log('Note save response:', response.data)
        
        if (response.data.success) {
          const newNote = response.data.data || {
            id: Date.now(), // Fallback ID
            text: noteText.value.trim(),
            created_at: new Date().toISOString()
          }
          notes.value.unshift(newNote) // Add to beginning of array
          showAlert('Заметка добавлена')
          closeNoteModal()
        } else {
          console.error('Note save failed:', response.data)
          showAlert('Ошибка при добавлении заметки: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error adding note:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        // Если API недоступен, добавляем заметку локально
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
          console.warn('API not available, adding note locally')
          const localNote = {
            id: Date.now(),
            text: noteText.value.trim(),
            created_at: new Date().toISOString()
          }
          notes.value.unshift(localNote)
          showAlert('Заметка добавлена (локально)')
          closeNoteModal()
        } else {
          const errorMessage = error.response?.data?.message || 'Ошибка при добавлении заметки'
          showAlert(errorMessage)
        }
      } finally {
        noteLoading.value = false
      }
    }

    const deleteNote = async (noteId) => {
      const confirmed = window.confirm('Удалить заметку?')
      if (!confirmed) return
      
      try {
        console.log('Attempting to delete note:', { employeeId: employeeId.value, noteId })
        
        const response = await employeesAPI.deleteNote(employeeId.value, noteId)
        
        if (response.data.success) {
          const index = notes.value.findIndex(n => n.id === noteId)
          if (index > -1) {
            notes.value.splice(index, 1)
          }
          showAlert('Заметка удалена')
        } else {
          showAlert('Ошибка при удалении заметки: ' + (response.data.message || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Error deleting note:', error)
        
        // Если API недоступен, удаляем локально
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
          console.warn('API not available, deleting note locally')
          const index = notes.value.findIndex(n => n.id === noteId)
          if (index > -1) {
            notes.value.splice(index, 1)
            showAlert('Заметка удалена (локально)')
          }
        } else {
          const errorMessage = error.response?.data?.message || 'Ошибка при удалении заметки'
          showAlert(errorMessage)
        }
      }
    }

    const loadNotes = async () => {
      try {
        const response = await employeesAPI.getNotes(employeeId.value)
        if (response.data.success) {
          notes.value = response.data.data
        } else {
          notes.value = []
        }
      } catch (error) {
        console.error('Error loading notes:', error)
        notes.value = []
      }
    }

    // Загрузка данных текущего пользователя для проверки прав
    const loadCurrentUser = async () => {
      try {
        const response = await usersAPI.getMe()
        if (response.data.success) {
          currentUser.value = response.data.data
          console.log('Current user loaded:', currentUser.value, 'isAdmin:', isAdmin.value)
        }
      } catch (error) {
        console.error('Error loading current user:', error)
        // Если не удается загрузить - считаем что не админ
        currentUser.value = { is_admin: false }
      }
    }

    onMounted(() => {
      loadCurrentUser()
      loadEmployee()
      // Загружаем заметки отдельно, чтобы они точно загрузились
      setTimeout(() => loadNotes(), 100)
    })

    return {
      employee,
      loading,
      showDeleteModal,
      deleteLoading,
      notes,
      showNoteModal,
      noteText,
      noteLoading,
      isAdmin,
      getEmployeeInitials,
      formatBirthday,
      handleBack,
      showDeleteConfirmation,
      closeDeleteModal,
      confirmDelete,
      goToEmployeesList,
      showAddNote,
      closeNoteModal,
      saveNote,
      deleteNote,
      formatNoteDate
    }
  }
}
</script>

<style scoped>
.employee-profile-screen {
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

.back-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 24px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  width: 44px;
  text-align: left;
}

.back-btn:active {
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

.delete-btn {
  background: none;
  border: none;
  color: #FF3B30;
  cursor: pointer;
  padding: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  transition: all 0.15s ease;
}

.delete-btn:active {
  opacity: 0.6;
  background: rgba(255, 59, 48, 0.1);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.employee-header {
  padding: 30px 20px 20px 20px;
  text-align: center;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
}

.employee-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.employee-info-section {
  padding: 0 20px 20px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  font-weight: 400;
  color: #8E8E93;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.info-value {
  font-size: 16px;
  font-weight: 400;
  color: #ffffff;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-text {
  font-size: 16px;
  color: #8E8E93;
  margin: 8px 0 20px 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.back-to-list-btn {
  background: #007AFF;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.delete-modal {
  background: #1C1C1E;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px 20px 10px 20px;
  text-align: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-content {
  padding: 0 20px 20px 20px;
}

.modal-text {
  color: #8E8E93;
  margin: 0;
  line-height: 1.4;
  text-align: center;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-actions {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-btn.cancel {
  background: rgba(44, 44, 46, 0.8);
  color: #ffffff;
}

.modal-btn.delete {
  background: #FF3B30;
  color: #ffffff;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Notes Section */
.notes-section {
  margin-top: 20px;
  padding: 20px;
  background: rgba(44, 44, 46, 0.3);
  border-radius: 12px;
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.notes-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.add-note-btn {
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.add-note-btn:active {
  opacity: 0.6;
  background: rgba(0, 122, 255, 0.1);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  background: rgba(44, 44, 46, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(84, 84, 88, 0.3);
}

.note-content {
  flex: 1;
}

.note-text {
  font-size: 14px;
  color: #ffffff;
  margin: 0 0 4px 0;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.note-date {
  font-size: 12px;
  color: #8E8E93;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.note-delete {
  background: none;
  border: none;
  color: #8E8E93;
  cursor: pointer;
  font-size: 20px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-left: 8px;
  transition: all 0.15s ease;
}

.note-delete:hover {
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.1);
}

.empty-notes {
  text-align: center;
  padding: 20px;
}

.empty-notes-text {
  color: #8E8E93;
  font-size: 14px;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Note Modal */
.note-modal {
  background: #1C1C1E;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
}

.note-textarea {
  width: 100%;
  background: rgba(44, 44, 46, 0.8);
  border: 1px solid rgba(84, 84, 88, 0.6);
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 12px;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.note-textarea:focus {
  border-color: #007AFF;
}

.note-textarea::placeholder {
  color: #8E8E93;
}

.char-counter {
  font-size: 12px;
  color: #8E8E93;
  text-align: right;
  margin-top: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-btn.save {
  background: #007AFF;
  color: #ffffff;
}

.modal-btn.save:disabled {
  background: #2C2C2E;
  color: #8E8E93;
}
</style> 