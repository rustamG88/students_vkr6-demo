import axios from 'axios'

class FrontendLogger {
  constructor() {
    this.logs = []
    this.apiUrl = this.getFullApiUrl()
    this.maxRetries = 3
    this.retryQueue = []
    this.isOnline = navigator.onLine
    this.enabled = true
  }

  getApiBaseUrl() {
    // В production используем относительный путь
    if (import.meta.env.PROD) {
      return '/api';
    }
    
    // В development - используем переменную окружения или localhost
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
    return backendUrl;
  }

  getFullApiUrl() {
    // В production используем относительный путь  
    if (import.meta.env.PROD) {
      return window.location.origin + '/api';
    }
    
    // В development - используем переменную окружения или localhost
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
    return backendUrl;
  }

  async sendLog(level, message, data = null, action = null) {
    if (!this.enabled) return

    const logData = {
      level,
      message,
      data,
      action,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    console.log(`[${level.toUpperCase()}] ${message}`, data || '')

    try {
      await axios.post(`${this.apiUrl}/logs/frontend`, logData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.debug('Log server unavailable:', error.message)
    }
  }

  info(message, data = null, action = null) {
    return this.sendLog('info', message, data, action)
  }

  warn(message, data = null, action = null) {
    return this.sendLog('warn', message, data, action)
  }

  error(message, data = null, action = null) {
    return this.sendLog('error', message, data, action)
  }

  debug(message, data = null, action = null) {
    return this.sendLog('debug', message, data, action)
  }

  buttonClick(buttonName, data = null) {
    return this.info(`Button clicked: ${buttonName}`, data, 'button_click')
  }

  apiCall(method, url, requestData = null) {
    return this.info(`API call: ${method} ${url}`, requestData, 'api_call')
  }

  apiResponse(method, url, responseData = null, success = true) {
    const level = success ? 'info' : 'error'
    return this.sendLog(level, `API response: ${method} ${url}`, responseData, 'api_response')
  }

  userAction(action, data = null) {
    return this.info(`User action: ${action}`, data, 'user_action')
  }

  formSubmit(formName, formData = null) {
    return this.info(`Form submitted: ${formName}`, formData, 'form_submit')
  }

  navigation(from, to) {
    return this.info(`Navigation: ${from} -> ${to}`, { from, to }, 'navigation')
  }
}

export const logger = new FrontendLogger()
export default logger 