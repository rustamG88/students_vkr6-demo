<template>
  <div class="app-header">
    <!-- Debug info for Telegram WebApp (only in development) -->
    <div v-if="isDevelopment" class="debug-info">
      <div class="debug-toggle" @click="showDebug = !showDebug">
        {{ showDebug ? '🔽' : '▶️' }} DEBUG
      </div>
      <div v-if="showDebug" class="debug-panel">
        <div><strong>Telegram WebApp Status:</strong> {{ webAppStatus }}</div>
        <div><strong>User Data:</strong> {{ JSON.stringify(telegramUser, null, 2) }}</div>
        <div><strong>Init Data:</strong> {{ initData }}</div>
      </div>
    </div>
    
    <button 
      v-if="showBack" 
      class="back-btn" 
      @click="handleBack"
    >
      ←
    </button>
    <div 
      v-else-if="backText" 
      class="back-btn-text" 
      @click="handleBack"
    >
      {{ backText }}
    </div>
    <div v-else class="back-spacer"></div>
    
    <div class="title-container">
      <h1 v-if="title" class="title">{{ title }}</h1>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    
    <button 
      v-if="rightAction" 
      class="right-btn"
      @click="handleRightAction"
      :disabled="rightActionDisabled"
    >
      {{ rightAction }}
    </button>
    <div v-else class="right-spacer"></div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { useWebApp } from '@/composables/useWebApp'
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'AppHeader',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: false
    },
    backText: {
      type: String,
      default: ''
    },
    rightAction: {
      type: String,
      default: ''
    },
    rightActionDisabled: {
      type: Boolean,
      default: false
    },
    customBackAction: {
      type: Function,
      default: null
    },
    customRightAction: {
      type: Function,
      default: null
    }
  },
  emits: ['back', 'rightAction'],
  setup(props, { emit }) {
    const router = useRouter()
    const { isWebAppAvailable, getUserData, getInitData } = useWebApp()
    const showDebug = ref(false)
    const telegramUser = ref(null)
    const initData = ref('')
    
    // Определяем, если это режим разработки
    const isDevelopment = computed(() => {
      return import.meta.env.DEV || window.location.hostname === 'localhost'
    })
    
    const webAppStatus = computed(() => {
      return isWebAppAvailable.value ? '✅ Available' : '❌ Not Available'
    })
    
    onMounted(() => {
      // Загружаем отладочную информацию
      if (isDevelopment.value) {
        telegramUser.value = getUserData()
        initData.value = getInitData()
        
        console.log('🔍 AppHeader Debug Info:')
        console.log('- WebApp Available:', isWebAppAvailable.value)
        console.log('- User Data:', telegramUser.value)
        console.log('- Init Data:', initData.value)
      }
    })

    const handleBack = () => {
      if (props.customBackAction) {
        props.customBackAction()
      } else {
        emit('back')
        
        // Улучшенная навигация назад
        if (isWebAppAvailable.value) {
          // В Telegram WebApp - возвращаемся назад в истории
          if (window.history.length > 1) {
            router.go(-1)
          } else {
            router.push('/tasks')
          }
        } else {
          // В браузере - возвращаемся назад или на главную
          if (window.history.length > 1) {
            router.go(-1)
          } else {
            router.push('/tasks')
          }
        }
      }
    }

    const handleRightAction = () => {
      if (props.customRightAction) {
        props.customRightAction()
      } else {
        emit('rightAction')
      }
    }

    return {
      handleBack,
      handleRightAction,
      isDevelopment,
      showDebug,
      webAppStatus,
      telegramUser,
      initData
    }
  }
}
</script>

<style scoped>
.app-header {
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

.debug-info {
  margin-bottom: 8px;
  font-size: 12px;
  color: #8E8E93;
}

.debug-toggle {
  cursor: pointer;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: inline-block;
}

.debug-panel {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.back-btn,
.back-btn-text {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  min-width: 44px;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.back-btn {
  font-size: 24px;
}

.back-btn:active,
.back-btn-text:active {
  opacity: 0.6;
}

.back-spacer {
  min-width: 44px;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0 16px;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
}

.subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #8E8E93;
  margin: 0;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.right-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 8px 0;
  min-width: 44px;
  text-align: right;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.right-btn:active {
  opacity: 0.6;
}

.right-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.right-spacer {
  min-width: 44px;
}
</style> 