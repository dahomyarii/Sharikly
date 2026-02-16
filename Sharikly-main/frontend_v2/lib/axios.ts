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
    // Handle 401 Unauthorized errors (expired/invalid tokens)
    if (error.response?.status === 401) {
      // Clear expired token and user data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        
        // Clear axios default headers
        delete axiosInstance.defaults.headers.common['Authorization']
        delete axios.defaults.headers.common['Authorization']
        
        // Dispatch logout event to notify components
        window.dispatchEvent(new CustomEvent('userLogout'))
      }
    }
    
    // Return the error so it can be handled by the calling code
    return Promise.reject(error)
  }
)

export default axiosInstance

