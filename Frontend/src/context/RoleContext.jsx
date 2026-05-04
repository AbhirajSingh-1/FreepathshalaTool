import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api'

// Role display metadata - only for UI rendering, not for authorization
export const ROLES = {
  admin:     { label: 'Admin',     color: '#E8521A', bg: '#FDE7DA' },
  manager:   { label: 'Manager',   color: '#1B5E35', bg: '#E8F5EE' },
  executive: { label: 'Executive', color: '#3B82F6', bg: '#DBEAFE' },
}

const RoleContext = createContext(null)

function normalizeRole(role) {
  return String(role || '').toLowerCase()
}

export const useRole = () => {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be inside <RoleProvider>')
  return ctx
}

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(() => localStorage.getItem('fp_role') || '')
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  // Fetch user profile from backend - this is the single source of truth for role
  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('fp_id_token')
    if (!token) {
      setUser(null)
      setRole('')
      setAuthLoading(false)
      return null
    }

    setAuthLoading(true)
    setAuthError('')
    try {
      // Backend returns user profile with role from Firestore or custom claims
      const profile = await fetchCurrentUser()
      setUser(profile)
      const nextRole = normalizeRole(profile.role || 'executive')
      setRole(nextRole)
      localStorage.setItem('fp_role', nextRole)
      return profile
    } catch (err) {
      setUser(null)
      setRole('')
      setAuthError(err.message || 'Session expired')
      return null
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const session = await apiLogin(email, password)
      // Backend returns user with role - this is the source of truth
      setUser(session.user)
      setRole(normalizeRole(session.user?.role || 'executive'))
      return session.user
    } catch (err) {
      setAuthError(err.message || 'Login failed')
      throw err
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setRole('')
  }, [])

  // Frontend now only stores role from backend - no permission checks
  // All authorization is enforced server-side via requireRoles middleware
  const value = useMemo(() => ({
    user,
    role,
    isAuthenticated: Boolean(user && role),
    authLoading,
    authError,
    login,
    logout,
    reloadUser: loadCurrentUser,
    // Removed: changeRole, can, ROLE_PAGES, DEFAULT_PAGE
    // Role is managed entirely by backend
    ROLES,
  }), [user, role, authLoading, authError, login, logout, loadCurrentUser])

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}
