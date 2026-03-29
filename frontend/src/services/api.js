import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
})

// Auto-attach stored token
const token = localStorage.getItem('lp_token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lp_token')
      localStorage.removeItem('lp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
