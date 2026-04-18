import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000, // 30s for production reliability
})

// Auto-attach stored token
const token = localStorage.getItem('lp_token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// Request interceptor — dev logging
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// Response interceptor — handle 401 globally + retry on network errors
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config

    // Retry once on network errors (not on 4xx/5xx)
    if (!err.response && !config._retried) {
      config._retried = true
      await new Promise(r => setTimeout(r, 1000))
      return api(config)
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('lp_token')
      localStorage.removeItem('lp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

