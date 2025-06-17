<template>
  <div class="bottom-navigation">
    <button 
      class="nav-item" 
      :class="{ 'active': currentRoute.startsWith('/tasks') }"
      @click="navigateTo('/tasks')"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17L4 12L5.41 10.59L9 14.17L18.59 4.58L20 6L9 17Z"/>
      </svg>
      <span class="nav-label">Задачи</span>
    </button>
    
    <button 
      class="nav-item" 
      :class="{ 'active': currentRoute === '/calendar' }"
      @click="navigateTo('/calendar')"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7Z"/>
      </svg>
      <span class="nav-label">Календарь</span>
    </button>
    
    <button 
      class="nav-item" 
      :class="{ 'active': currentRoute.startsWith('/employees') }"
      @click="navigateTo('/employees')"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 4C18.21 4 20 5.79 20 8C20 10.21 18.21 12 16 12C13.79 12 12 10.21 12 8C12 5.79 13.79 4 16 4ZM16 14C20.42 14 24 15.79 24 18V20H8V18C8 15.79 11.58 14 16 14ZM8 4C10.21 4 12 5.79 12 8C12 10.21 10.21 12 8 12C5.79 12 4 10.21 4 8C4 5.79 5.79 4 8 4ZM8 14C12.42 14 16 15.79 16 18V20H0V18C0 15.79 3.58 14 8 14Z"/>
      </svg>
      <span class="nav-label">Сотрудники</span>
    </button>
    
    <button 
      class="nav-item" 
      :class="{ 'active': currentRoute === '/user-profile' }"
      @click="navigateTo('/user-profile')"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.21 7 16 8.79 16 11C16 13.21 14.21 15 12 15C9.79 15 8 13.21 8 11C8 8.79 9.79 7 12 7ZM6 19C6 16.33 9.33 15 12 15C14.67 15 18 16.33 18 19V20H6V19Z"/>
      </svg>
      <span class="nav-label">Профиль</span>
    </button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'BottomNavigation',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const currentRoute = computed(() => route.path)
    
    const navigateTo = (path) => {
      if (currentRoute.value !== path) {
        router.push(path)
      }
    }
    
    return {
      currentRoute,
      navigateTo
    }
  }
}
</script>

<style scoped>
/* Адаптивная нижняя навигация */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;  /* равные отступы между элементами */
  align-items: center;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid #2C2C2E;
  padding: 0.5rem 1rem;  /* используем rem вместо px */
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.25rem;  /* относительные отступы */
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 3.5rem;  /* базовый размер в rem */
  color: #8E8E93;  /* цвет по умолчанию для currentColor */
}

/* SVG иконки - адаптивные */
.nav-icon {
  width: 1.5rem;   /* базовый размер иконки */
  height: 1.5rem;
  transition: all 0.2s ease;
}

/* Подписи к иконкам */
.nav-label {
  font-size: 0.625rem;  /* 10px при базовом размере 16px */
  font-weight: 500;
  color: inherit;
  margin-top: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: color 0.2s ease;
  text-align: center;
  line-height: 1.2;
}

/* Активное состояние */
.nav-item.active {
  color: #007AFF;
}

/* Интерактивность */
.nav-item:active {
  transform: scale(0.95);
  opacity: 0.7;
}

/* Hover эффект для десктопа */
@media (hover: hover) {
  .nav-item:hover {
    opacity: 0.8;
  }
}

/* === MEDIA QUERIES === */

/* Очень маленькие экраны (до 360px) */
@media (max-width: 360px) {
  .bottom-navigation {
    padding: 0.25rem 0.5rem;
    padding-bottom: calc(0.25rem + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    min-height: 3rem;
    padding: 0.25rem 0.125rem;
  }
  
  .nav-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .nav-label {
    font-size: 0.5rem;  /* 8px */
    margin-top: 0.125rem;
  }
}

/* Мобильные устройства (360px - 480px) */
@media (min-width: 360px) and (max-width: 480px) {
  .nav-item {
    min-height: 3.25rem;
  }
  
  .nav-icon {
    width: 1.375rem;
    height: 1.375rem;
  }
  
  .nav-label {
    font-size: 0.5625rem;  /* 9px */
  }
}

/* Большие мобильные устройства (480px - 600px) */
@media (min-width: 480px) and (max-width: 600px) {
  .bottom-navigation {
    padding: 0.625rem 1.25rem;
    padding-bottom: calc(0.625rem + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    min-height: 3.75rem;
    padding: 0.625rem 0.375rem;
  }
  
  .nav-icon {
    width: 1.625rem;
    height: 1.625rem;
  }
  
  .nav-label {
    font-size: 0.6875rem;  /* 11px */
  }
}

/* Планшеты (600px - 1024px) */
@media (min-width: 600px) and (max-width: 1024px) {
  .bottom-navigation {
    padding: 0.75rem 2rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    min-height: 4rem;
    padding: 0.75rem 0.5rem;
  }
  
  .nav-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .nav-label {
    font-size: 0.75rem;  /* 12px */
    margin-top: 0.375rem;
  }
}

/* Десктопы (1024px+) */
@media (min-width: 1024px) {
  .bottom-navigation {
    padding: 1rem 3rem;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  
  .nav-item {
    min-height: 4.5rem;
    padding: 1rem 0.75rem;
  }
  
  .nav-icon {
    width: 2rem;
    height: 2rem;
  }
  
  .nav-label {
    font-size: 0.875rem;  /* 14px */
    margin-top: 0.5rem;
  }
}

/* Landscape ориентация для мобильных */
@media (max-height: 500px) and (orientation: landscape) {
  .nav-item {
    min-height: 2.5rem;
    padding: 0.25rem 0.125rem;
  }
  
  .nav-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .nav-label {
    font-size: 0.5rem;  /* 8px */
    margin-top: 0.125rem;
  }
}

/* Очень высокие экраны */
@media (min-height: 800px) {
  .nav-item {
    min-height: 4.5rem;
  }
  
  .nav-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}
</style> 