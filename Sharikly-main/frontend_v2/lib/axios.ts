import axios from 'axios'

const DEFAULT_TIMEOUT_MS = 30_000

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
})

// Response interceptor: token expiration, 429, timeout, and optional retry
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    if (error.response?.status === 401) {
      const url = config?.url || ''
      const isAuthEndpoint = url.includes('/auth/token') || url.includes('/auth/register')
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        delete axiosInstance.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['Authorization']
        window.dispatchEvent(new CustomEvent('userLogout'))
      }
    }

    if (error.response?.status === 429 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalShowToast', {
          detail: {
            message: 'Too many requests. Please wait a moment and try again.',
            type: 'warning',
          },
        })
      )
    }

    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))
    const isNetworkError = !error.response && error.request
    if ((isTimeout || isNetworkError) && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('globalShowToast', {
          detail: {
            message: isTimeout ? 'Request took too long. Please try again.' : 'Network error. Please check your connection and try again.',
            type: 'error',
          },
        })
      )
    }

    // Retry once for GET requests on timeout or network failure (no response)
    if (!error.response && config && !config.__retried && (config.method === 'get' || config.method === 'GET')) {
      config.__retried = true
      return axiosInstance.request(config)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

