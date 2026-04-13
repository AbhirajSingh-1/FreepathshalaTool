// src/context/RoleContext.jsx
import { createContext, useContext, useState } from 'react'

export const ROLES = {
  admin:     { label: 'Admin',     color: '#E8521A', bg: '#FDE7DA' },
  manager:   { label: 'Manager',   color: '#1B5E35', bg: '#E8F5EE' },
  executive: { label: 'Executive', color: '#3B82F6', bg: '#DBEAFE' },
}

const RoleContext = createContext(null)

export const useRole = () => {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be inside <RoleProvider>')
  return ctx
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('fp_role') || 'admin')

  const changeRole = (r) => {
    if (!ROLES[r]) return
    setRole(r)
    localStorage.setItem('fp_role', r)
  }

  // Granular capability map
  const can = {
    viewReports:        role === 'admin' || role === 'manager',
    viewFinancials:     role === 'admin' || role === 'manager',
    deletePartner:      role === 'admin',
    deletePickup:       role === 'admin',
    deleteDonor:        role === 'admin' || role === 'manager',
    addPartner:         true,                                // all roles
    editPartner:        role === 'admin' || role === 'manager',
    recordPickup:       true,                                // all roles
    schedulePickup:     true,
    viewPickupOverview: role === 'admin' || role === 'manager',
    viewPartnerReports: role === 'admin' || role === 'manager',
    manageDonors:       role === 'admin' || role === 'manager',
  }

  return (
    <RoleContext.Provider value={{ role, changeRole, can, ROLES }}>
      {children}
    </RoleContext.Provider>
  )
}