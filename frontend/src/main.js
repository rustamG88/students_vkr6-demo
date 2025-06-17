import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// Telegram WebApp SDK
import { WebApp } from '@twa-dev/sdk'

// Initialize Telegram WebApp safely
let webAppReady = false
try {
  if (WebApp && typeof WebApp.ready === 'function') {
    WebApp.ready()
    WebApp.expand()
    webAppReady = true
    console.log('✅ Telegram WebApp initialized successfully')
  } else {
    console.warn('⚠️ Telegram WebApp SDK not available - running in browser mode')
  }
} catch (error) {
  console.warn('⚠️ Error initializing Telegram WebApp:', error)
}

// Global WebApp availability
window.TG_WEB_APP_READY = webAppReady

// Set Telegram theme
if (WebApp && WebApp.colorScheme) {
  if (WebApp.colorScheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
  }
} else {
  // Default theme for browser
  document.documentElement.setAttribute('data-theme', 'dark')
}

// Create Vue app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Global properties
app.config.globalProperties.$tg = WebApp || {}

app.mount('#app')

// Debug info
console.log('🚀 Telegram MiniApp started')
if (WebApp && WebApp.version) {
  console.log('📱 WebApp version:', WebApp.version)
  console.log('🎨 Theme:', WebApp.colorScheme)
} else {
  console.log('🌐 Running in browser mode')
} 