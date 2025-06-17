<template>
  <div id="app" class="app">
    <router-view />
  </div>
</template>

<script>
import { WebApp } from '@twa-dev/sdk'

export default {
  name: 'App',
  mounted() {
    // Set Telegram WebApp ready safely
    if (WebApp && typeof WebApp.ready === 'function') {
      WebApp.ready()
      
      // Disable vertical swipes
      if (typeof WebApp.disableVerticalSwipes === 'function') {
        WebApp.disableVerticalSwipes()
      }
      
      // Set app colors to match Telegram theme
      if (WebApp.themeParams) {
        document.documentElement.style.setProperty('--tg-bg-color', WebApp.themeParams.bg_color || '#000000')
        document.documentElement.style.setProperty('--tg-text-color', WebApp.themeParams.text_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-button-color', WebApp.themeParams.button_color || '#007aff')
      }
    } else {
      // Set default colors for browser mode
      document.documentElement.style.setProperty('--tg-bg-color', '#000000')
      document.documentElement.style.setProperty('--tg-text-color', '#ffffff')
      document.documentElement.style.setProperty('--tg-button-color', '#007aff')
    }
  }
}
</script>

<style>
.app {
  width: 100vw;
  height: 100vh;
  background: var(--bg-color);
  overflow: hidden;
}
</style> 