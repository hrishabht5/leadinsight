import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('lp_token')
    const saved = localStorage.getItem('lp_user')
    if (token && saved) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/v1/auth/login', { email, password })
    _saveSession(data)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/api/v1/auth/register', payload)
    _saveSession(data)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lp_token')
    localStorage.removeItem('lp_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  function _saveSession(data) {
    localStorage.setItem('lp_token', data.access_token)
    localStorage.setItem('lp_user', JSON.stringify({
      id: data.user_id,
      email: data.email,
      workspace_id: data.workspace_id,
    }))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    setUser({ id: data.user_id, email: data.email, workspace_id: data.workspace_id })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
