import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api'

export const ROLES = {
  admin:     { label: 'Admin',     color: '#E8521A', bg: '#FDE7DA' },
  manager:   { label: 'Manager',   color: '#1B5E35', bg: '#E8F5EE' },
  executive: { label: 'Executive', color: '#3B82F6', bg: '#DBEAFE' },
}

export const ROLE_PAGES = {
  admin:     ['dashboard', 'donors', 'supporters', 'pickups', 'pickuppartners', 'payments', 'pickupscheduler', 'todaypickups', 'pickupoverview', 'raddimaster', 'sksoverview'],
  manager:   ['dashboard', 'donors', 'supporters', 'pickups', 'pickuppartners', 'payments', 'pickupscheduler', 'todaypickups', 'pickupoverview', 'sksoverview'],
  executive: ['todaypickups', 'pickups', 'pickuppartners', 'sksoverview'],
}

export const DEFAULT_PAGE = {
  admin:     'dashboard',
  manager:   'dashboard',
  executive: 'todaypickups',
}

const RoleContext = createContext(null)

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
      const profile = await fetchCurrentUser()
      setUser(profile)
      setRole(profile.role || 'executive')
      localStorage.setItem('fp_role', profile.role || 'executive')
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
      setUser(session.user)
      setRole(session.user?.role || 'executive')
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

  const can = useMemo(() => ({
    viewDashboard:      role === 'admin' || role === 'manager',
    viewDonors:         role === 'admin' || role === 'manager',
    viewSupporters:     role === 'admin' || role === 'manager',
    viewPayments:       role === 'admin' || role === 'manager',
    viewRaddiMaster:    role === 'admin',
    viewScheduler:      role === 'admin' || role === 'manager',
    viewReports:        role === 'admin' || role === 'manager',
    viewFinancials:     role === 'admin' || role === 'manager',
    viewPickupOverview: role === 'admin' || role === 'manager',
    viewPartnerReports: role === 'admin' || role === 'manager',
    viewSKSOverview:    Boolean(role),
    viewTodayPickups:   Boolean(role),
    deletePartner:      role === 'admin',
    deletePickup:       role === 'admin',
    deleteDonor:        role === 'admin' || role === 'manager',
    addPartner:         role === 'admin' || role === 'manager',
    editPartner:        role === 'admin' || role === 'manager',
    recordPickup:       Boolean(role),
    schedulePickup:     role === 'admin' || role === 'manager',
    manageDonors:       role === 'admin' || role === 'manager',
    isExecutive:        role === 'executive',
    canAccessPage: (page) => (ROLE_PAGES[role] || []).includes(page),
  }), [role])

  const value = useMemo(() => ({
    user,
    role,
    isAuthenticated: Boolean(user && role),
    authLoading,
    authError,
    login,
    logout,
    reloadUser: loadCurrentUser,
    changeRole: () => {},
    can,
    ROLES,
    ROLE_PAGES,
    DEFAULT_PAGE,
  }), [user, role, authLoading, authError, login, logout, loadCurrentUser, can])

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}
