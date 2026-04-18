import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

/**
 * Decode JWT payload without a library (browser-safe).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expired (with 60s buffer).
 */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  return Date.now() >= (payload.exp * 1000) - 60_000 // 60s buffer
}

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)

  // Rehydrate from localStorage on mount — with validation
  useEffect(() => {
    try {
      const token = localStorage.getItem('lp_token')
      const saved = localStorage.getItem('lp_user')

      if (token && saved) {
        // Validate token hasn't expired
        if (isTokenExpired(token)) {
          console.warn('[Auth] Token expired — clearing session')
          localStorage.removeItem('lp_token')
          localStorage.removeItem('lp_user')
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setUser(JSON.parse(saved))
        }
      }
    } catch (err) {
      // Handle corrupted localStorage
      console.error('[Auth] Failed to rehydrate session:', err)
      localStorage.removeItem('lp_token')
      localStorage.removeItem('lp_user')
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

