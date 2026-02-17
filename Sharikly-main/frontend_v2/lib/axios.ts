import axios from 'axios'

// Create axios instance with default config
const axiosInstance = axios.create()

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Don't clear tokens on login/register attempts — 401 there means wrong credentials, not expired token
      const isAuthEndpoint = url.includes('/auth/token') || url.includes('/auth/register')
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        delete axiosInstance.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['Authorization']
        window.dispatchEvent(new CustomEvent('userLogout'))
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance

