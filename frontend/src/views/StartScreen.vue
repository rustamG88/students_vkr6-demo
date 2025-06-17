<template>
  <div class="start-screen">
    <!-- Header -->
    <div class="header">
      <button class="cancel-btn" @click="handleCancel">Cancel</button>
      <div class="title-container">
        <h1 class="title">Playground</h1>
        <span class="subtitle">bot</span>
      </div>
      <div class="menu-btn" @click="handleMenu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#007AFF"/>
          <circle cx="12" cy="12" r="2" fill="#007AFF"/>
          <circle cx="12" cy="19" r="2" fill="#007AFF"/>
        </svg>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Mailbox Sticker -->
      <div class="sticker-container">
        <div class="mailbox-sticker">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
            <!-- Mailbox base/post -->
            <rect x="62" y="95" width="16" height="30" fill="#8A7968" rx="2"/>
            <ellipse cx="70" cy="125" rx="18" ry="6" fill="#6B5D4F"/>
            
            <!-- Mailbox body -->
            <rect x="25" y="45" width="90" height="55" rx="12" fill="#4A5563"/>
            <rect x="27" y="47" width="86" height="51" rx="10" fill="#5A6B7A"/>
            
            <!-- Mailbox front panel -->
            <rect x="30" y="52" width="76" height="41" rx="8" fill="#2D3748"/>
            <rect x="32" y="54" width="72" height="37" rx="6" fill="#1A202C"/>
            
            <!-- Door handle -->
            <circle cx="95" cy="72" r="4" fill="#A0ADB8"/>
            <circle cx="95" cy="72" r="2" fill="#CBD5E0"/>
            
            <!-- Mail slot -->
            <rect x="45" y="67" width="35" height="3" rx="1.5" fill="#4A5568"/>
            
            <!-- Flag -->
            <rect x="110" y="58" width="24" height="14" rx="3" fill="#E53E3E"/>
            <rect x="112" y="60" width="20" height="10" rx="2" fill="#FC8181"/>
            
            <!-- Flag hinge -->
            <rect x="108" y="62" width="6" height="6" rx="3" fill="#718096"/>
            
            <!-- Decorative details -->
            <rect x="35" y="58" width="2" height="2" rx="1" fill="#4A5568"/>
            <rect x="40" y="58" width="2" height="2" rx="1" fill="#4A5568"/>
            <rect x="35" y="63" width="2" height="2" rx="1" fill="#4A5568"/>
            <rect x="40" y="63" width="2" height="2" rx="1" fill="#4A5568"/>
          </svg>
        </div>
      </div>

      <!-- Start Button -->
      <div class="button-container">
        <button 
          class="start-button"
          @click="handleStart"
          :disabled="loading"
        >
          <span v-if="!loading">Старт</span>
          <div v-else class="loading-spinner"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { WebApp } from '@twa-dev/sdk'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'StartScreen',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const loading = ref(false)

    const handleCancel = () => {
      // Close the WebApp safely
      if (WebApp && typeof WebApp.close === 'function') {
        WebApp.close()
      } else {
        // In browser mode, just show a message
        console.log('Cancel clicked - running in browser mode')
      }
    }

    const handleMenu = () => {
      // Menu action (placeholder)
      console.log('Menu clicked')
    }

    const handleStart = async () => {
      loading.value = true
      
      try {
        // Get Telegram WebApp init data
        const initData = WebApp && WebApp.initData ? WebApp.initData : null
        
        if (!initData) {
          console.error('No Telegram init data available')
          if (WebApp && typeof WebApp.showAlert === 'function') {
            WebApp.showAlert('Ошибка авторизации в Telegram')
          } else {
            // Browser mode - simulate auth for testing
            console.log('Browser mode - simulating authentication')
            router.push('/tasks')
          }
          return
        }

        // Authenticate with backend
        const result = await authStore.authenticateStart(initData)
        
        if (result.success) {
          if (result.needsProfileCompletion) {
            // Navigate to profile setup
            router.push('/profile')
          } else {
            // Navigate to tasks
            router.push('/tasks')
          }
        } else {
          if (WebApp && typeof WebApp.showAlert === 'function') {
            WebApp.showAlert('Ошибка при входе в приложение')
          } else {
            alert('Ошибка при входе в приложение')
          }
        }
      } catch (error) {
        console.error('Start error:', error)
        if (WebApp && typeof WebApp.showAlert === 'function') {
          WebApp.showAlert('Произошла ошибка. Попробуйте еще раз.')
        } else {
          alert('Произошла ошибка. Попробуйте еще раз.')
        }
      } finally {
        loading.value = false
      }
    }

    // Set back button behavior safely
    if (WebApp && WebApp.BackButton && typeof WebApp.BackButton.hide === 'function') {
      WebApp.BackButton.hide()
    }

    return {
      loading,
      handleCancel,
      handleMenu,
      handleStart
    }
  }
}
</script>

<style scoped>
.start-screen {
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

.menu-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 22px;
}

.menu-btn:active {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.1);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.sticker-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 60px;
  min-height: 200px;
}

.mailbox-sticker {
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
  transform-origin: center center;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-5px) rotate(0.5deg);
  }
  50% {
    transform: translateY(-8px) rotate(0deg);
  }
  75% {
    transform: translateY(-3px) rotate(-0.5deg);
  }
}

.button-container {
  width: 100%;
  max-width: 320px;
  margin-bottom: calc(20px + env(safe-area-inset-bottom));
  padding: 0 20px;
}

.start-button {
  width: 100%;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  padding: 16px 24px;
  min-height: 56px;
  background: #007AFF;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.start-button:active {
  background: #0056B3;
  transform: scale(0.97);
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.4);
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-height: 667px) {
  .content {
    padding: 16px 20px;
  }
  
  .sticker-container {
    margin-bottom: 40px;
    min-height: 160px;
  }
  
  .mailbox-sticker svg {
    width: 120px;
    height: 120px;
  }
  
  .start-button {
    min-height: 50px;
    border-radius: 12px;
  }
}

@media (max-height: 568px) {
  .sticker-container {
    margin-bottom: 30px;
    min-height: 140px;
  }
  
  .mailbox-sticker svg {
    width: 100px;
    height: 100px;
  }
}
</style> 