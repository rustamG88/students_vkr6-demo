<template>
  <div class="add-employee-screen">
    <!-- Header -->
    <div class="header">
      <button class="cancel-btn" @click="handleCancel">Cancel</button>
      <div class="title-container">
        <h1 class="title">Новый сотрудник</h1>
      </div>
      <button 
        class="save-btn" 
        @click="handleSave"
        :disabled="!canSave || loading"
      >
        {{ loading ? '...' : 'Готово' }}
      </button>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-container">
          <div v-if="!form.avatar" class="avatar-placeholder">
            {{ getInitials() }}
          </div>
          <img v-else :src="form.avatar" alt="Employee" class="avatar-image" />
          <button class="avatar-upload" @click="handlePhotoUpload">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="form-section">
        <!-- Name Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.name"
              type="text"
              placeholder="Имя и фамилия"
              class="field-input"
              :class="{ 'error': errors.name }"
              @blur="validateName"
            />
          </div>
          <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
        </div>

        <!-- Position Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.position"
              type="text"
              placeholder="Должность"
              class="field-input"
              :class="{ 'error': errors.position }"
              @blur="validatePosition"
            />
          </div>
          <div v-if="errors.position" class="error-text">{{ errors.position }}</div>
        </div>

        <!-- Department Field -->
        <div class="field-group">
          <div class="field-container">
            <select
              v-model="form.department"
              class="field-input"
              :class="{ 'error': errors.department }"
              @blur="validateDepartment"
            >
              <option value="">Выберите департамент</option>
              <option value="ИТ">ИТ</option>
              <option value="МАРКЕТИНГ">Маркетинг</option>
              <option value="ДЕПАРТАМЕНТ">Департамент</option>
              <option value="HR">HR</option>
              <option value="ФИНАНСЫ">Финансы</option>
            </select>
          </div>
          <div v-if="errors.department" class="error-text">{{ errors.department }}</div>
        </div>

        <!-- Phone Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.phone"
              type="tel"
              placeholder="Номер телефона"
              class="field-input"
              :class="{ 'error': errors.phone }"
              @blur="validatePhone"
            />
          </div>
          <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
        </div>

        <!-- Email Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.email"
              type="email"
              placeholder="Email"
              class="field-input"
              :class="{ 'error': errors.email }"
              @blur="validateEmail"
            />
          </div>
          <div v-if="errors.email" class="error-text">{{ errors.email }}</div>
        </div>

        <!-- Nickname Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.nickname"
              type="text"
              placeholder="Никнейм (например, @username)"
              class="field-input"
              :class="{ 'error': errors.nickname }"
              @blur="validateNickname"
            />
          </div>
          <div v-if="errors.nickname" class="error-text">{{ errors.nickname }}</div>
        </div>

        <!-- Birthday Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.birthday"
              type="date"
              placeholder="Дата рождения"
              class="field-input"
              :class="{ 'error': errors.birthday }"
              @blur="validateBirthday"
            />
          </div>
          <div v-if="errors.birthday" class="error-text">{{ errors.birthday }}</div>
        </div>

        <!-- Company Field -->
        <div class="field-group">
          <div class="field-container">
            <input
              v-model="form.company"
              type="text"
              placeholder="Название компании"
              class="field-input"
              :class="{ 'error': errors.company }"
              @blur="validateCompany"
            />
          </div>
          <div v-if="errors.company" class="error-text">{{ errors.company }}</div>
        </div>

        <!-- Notes Field -->
        <div class="field-group">
          <div class="field-container">
            <textarea
              v-model="form.notes"
              placeholder="Заметки о сотруднике"
              class="field-input field-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { employeesAPI } from '@/services/api'

export default {
  name: 'AddEmployee',
  setup() {
    const router = useRouter()
    const { showAlert } = useWebApp()
    const loading = ref(false)

    const form = ref({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
      birthday: '',
      notes: '',
      avatar: null,
      company: '',
      nickname: ''
    })

    const errors = ref({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
      birthday: '',
      company: '',
      nickname: ''
    })

    // Validation methods
    const validateName = () => {
      if (!form.value.name.trim()) {
        errors.value.name = 'Имя обязательно для заполнения'
        return false
      }
      if (form.value.name.trim().length < 2) {
        errors.value.name = 'Имя должно содержать минимум 2 символа'
        return false
      }
      errors.value.name = ''
      return true
    }

    const validatePosition = () => {
      if (!form.value.position.trim()) {
        errors.value.position = 'Должность обязательна для заполнения'
        return false
      }
      errors.value.position = ''
      return true
    }

    const validateDepartment = () => {
      if (!form.value.department) {
        errors.value.department = 'Выберите департамент'
        return false
      }
      errors.value.department = ''
      return true
    }

    const validatePhone = () => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      if (!form.value.phone.trim()) {
        errors.value.phone = 'Номер телефона обязателен для заполнения'
        return false
      }
      if (!phoneRegex.test(form.value.phone.replace(/\s/g, ''))) {
        errors.value.phone = 'Неверный формат номера телефона'
        return false
      }
      errors.value.phone = ''
      return true
    }

    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!form.value.email.trim()) {
        errors.value.email = 'Email обязателен для заполнения'
        return false
      }
      if (!emailRegex.test(form.value.email)) {
        errors.value.email = 'Неверный формат email'
        return false
      }
      errors.value.email = ''
      return true
    }

    const validateNickname = () => {
      if (!form.value.nickname.trim()) {
        errors.value.nickname = 'Никнейм обязателен для заполнения'
        return false
      }
      errors.value.nickname = ''
      return true
    }

    const validateBirthday = () => {
      if (!form.value.birthday) {
        errors.value.birthday = 'Дата рождения обязательна для заполнения'
        return false
      }
      const birthDate = new Date(form.value.birthday)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 16 || age > 100) {
        errors.value.birthday = 'Возраст должен быть от 16 до 100 лет'
        return false
      }
      errors.value.birthday = ''
      return true
    }

    const validateCompany = () => {
      if (!form.value.company.trim()) {
        errors.value.company = 'Название компании обязательно для заполнения'
        return false
      }
      errors.value.company = ''
      return true
    }

    const canSave = computed(() => {
      return validateName() && 
             validatePosition() && 
             validateDepartment() && 
             validatePhone() && 
             validateEmail() && 
             validateNickname() &&
             validateBirthday() &&
             validateCompany() &&
             !Object.values(errors.value).some(error => error !== '')
    })

    const getInitials = () => {
      if (!form.value.name.trim()) return 'N'
      const names = form.value.name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }

    const handleCancel = () => {
      router.back()
    }

    const handlePhotoUpload = () => {
      showAlert('Функция загрузки фото будет добавлена позже')
    }

    const handleSave = async () => {
      loading.value = true

      try {
        // Validate all fields
        const isValid = validateName() && 
                        validatePosition() && 
                        validateDepartment() && 
                        validatePhone() && 
                        validateEmail() && 
                        validateNickname() &&
                        validateBirthday() &&
                        validateCompany()

        if (!isValid) {
          showAlert('Пожалуйста, исправьте ошибки в форме')
          return
        }

        // Prepare employee data
        const names = form.value.name.trim().split(' ')
        const employeeData = {
          first_name: names[0] || '',
          last_name: names.slice(1).join(' ') || '',
          position: form.value.position.trim(),
          company: form.value.company.trim(),
          department: form.value.department,
          phone: form.value.phone.trim(),
          email: form.value.email.trim()
        }

        // API call to create employee
        const response = await employeesAPI.create(employeeData)
        
        if (response.status === 201 && response.data.success) {
          showAlert('Сотрудник успешно добавлен!')
          router.push('/employees')
        } else {
          showAlert('Ошибка при добавлении сотрудника: ' + (response.data.message || 'Неизвестная ошибка'))
        }

      } catch (error) {
        console.error('Error creating employee:', error)
        const errorMessage = error.response?.data?.message || 'Ошибка при добавлении сотрудника'
        showAlert(errorMessage)
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      errors,
      loading,
      canSave,
      getInitials,
      handleCancel,
      handlePhotoUpload,
      handleSave,
      validateName,
      validatePosition,
      validateDepartment,
      validatePhone,
      validateEmail,
      validateNickname,
      validateBirthday,
      validateCompany
    }
  }
}
</script>

<style scoped>
.add-employee-screen {
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
  flex: 1;
  text-align: center;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.save-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.save-btn:disabled {
  color: #8E8E93;
  cursor: not-allowed;
}

.save-btn:active:not(:disabled) {
  opacity: 0.6;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.avatar-section {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background: linear-gradient(135deg, #333333 0%, #666666 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 600;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  object-fit: cover;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #007AFF;
  border: 3px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.avatar-upload:active {
  background: #0056B3;
  transform: scale(0.95);
}

.form-section {
  padding: 0 20px;
}

.field-group {
  margin-bottom: 20px;
}

.field-container {
  display: flex;
  align-items: center;
  background: rgba(44, 44, 46, 0.8);
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid rgba(84, 84, 88, 0.6);
  transition: all 0.15s ease;
}

.field-container:focus-within {
  border-color: #007AFF;
  background: rgba(44, 44, 46, 1);
}

.field-input {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  width: 100%;
}

.field-input::placeholder {
  color: #8E8E93;
}

.field-input select {
  background: transparent;
  color: #ffffff;
}

.field-input option {
  background: #1C1C1E;
  color: #ffffff;
}

.field-textarea {
  resize: none;
  min-height: 60px;
}

.field-input.error {
  border-color: #FF3B30;
}

.error-text {
  font-size: 12px;
  color: #FF3B30;
  margin-top: 4px;
  margin-left: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@media (max-width: 480px) {
  .avatar-container {
    width: 80px;
    height: 80px;
  }
  
  .avatar-placeholder,
  .avatar-image {
    width: 80px;
    height: 80px;
    border-radius: 40px;
  }
  
  .avatar-placeholder {
    font-size: 30px;
  }
  
  .avatar-upload {
    width: 28px;
    height: 28px;
    border-radius: 14px;
  }
}
</style> 