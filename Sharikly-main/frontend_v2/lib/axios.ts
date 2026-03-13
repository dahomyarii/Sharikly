import axios from 'axios'

const DEFAULT_TIMEOUT_MS = 30_000
const API_BASE = process.env.NEXT_PUBLIC_API_BASE
const REFRESH_PATH = '/auth/token/refresh/'

let refreshPromise: Promise<string | null> | null = null

function clearStoredAuth() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  delete axiosInstance.defaults.headers.common['Authorization']
  delete axios.defaults.headers.common['Authorization']
  window.dispatchEvent(new CustomEvent('userLogout'))
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken || !API_BASE) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE}${REFRESH_PATH}`,
        { refresh: refreshToken },
        { timeout: DEFAULT_TIMEOUT_MS }
      )
      .then((response) => {
        const nextAccessToken = response.data?.access
        const nextRefreshToken = response.data?.refresh

        if (!nextAccessToken) {
          return null
        }

        localStorage.setItem('access_token', nextAccessToken)
        if (nextRefreshToken) {
          localStorage.setItem('refresh_token', nextRefreshToken)
        }
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${nextAccessToken}`
        return nextAccessToken as string
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

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
      const isAuthEndpoint =
        url.includes('/auth/token') ||
        url.includes('/auth/register') ||
        url.includes(REFRESH_PATH)
      const hadAuthorizationHeader = Boolean(
        config?.headers?.Authorization || config?.headers?.authorization
      )

      if (!isAuthEndpoint && !config?.__retried401 && hadAuthorizationHeader) {
        const nextAccessToken = await refreshAccessToken()

        if (nextAccessToken) {
          config.__retried401 = true
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${nextAccessToken}`
          return axiosInstance.request(config)
        }
      }

      if (!isAuthEndpoint) {
        clearStoredAuth()
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
    // __retried is a one-time guard on the request config to prevent infinite retry
    if (!error.response && config && !config.__retried && (config.method === 'get' || config.method === 'GET')) {
      config.__retried = true
      return axiosInstance.request(config)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

