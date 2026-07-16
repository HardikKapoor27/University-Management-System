import { createContext, useContext, useState, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ums_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authAPI.login({ username, password })
      const data = res.data
      // Store everything from login response including profileId, profileName, isMentor
      const userData = {
        username:    data.username,
        role:        data.role,
        userId:      data.userId,
        token:       data.token,
        profileId:   data.profileId   || null,
        profileName: data.profileName || data.username,
        isMentor:    data.isMentor    || false,
      }
      localStorage.setItem('ums_token', data.token)
      localStorage.setItem('ums_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, role: data.role }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ums_token')
    localStorage.removeItem('ums_user')
    setUser(null)
  }, [])

  // Re-fetch the latest profile from the server and merge it into the cached
  // user object. This matters because things like a faculty member's
  // "mentor" (can-mark-attendance) status can be changed by an admin at any
  // time — without this, a faculty member who is already logged in would
  // keep seeing their *old* permissions (cached at login time) until they
  // manually logged out and back in.
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me()
      const data = res.data
      setUser(prev => {
        if (!prev) return prev
        const merged = {
          ...prev,
          profileId:   data.profileId   ?? prev.profileId,
          profileName: data.name        || prev.profileName,
          isMentor:    data.isMentor    ?? false,
        }
        localStorage.setItem('ums_user', JSON.stringify(merged))
        return merged
      })
      return data
    } catch {
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
