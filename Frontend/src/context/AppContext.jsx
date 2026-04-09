// Frontend/src/context/AppContext.jsx
// ─── Global State — connects Donors, Pickups, Raddi, Payments, Kabadiwala ───

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  donors as _initDonors,
  pickups as _initPickups,
  kabadiwalas as _initKabs,
} from '../data/mockData'
import { raddiMasterData as _initRaddi } from '../data/raddimockData'

// ─────────────────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const today = () => new Date().toISOString().slice(0, 10)

function derivePaymentStatus(total, paid) {
  const t = Number(total) || 0
  const p = Number(paid)  || 0
  if (t === 0)    return 'Not Paid'
  if (p >= t)     return 'Paid'
  if (p > 0)      return 'Partially Paid'
  return 'Not Paid'
}

function deriveDonorStatus(lastPickup) {
  if (!lastPickup) return 'Active'
  const days = Math.floor((Date.now() - new Date(lastPickup)) / 86_400_000)
  if (days <= 30) return 'Active'
  if (days <= 45) return 'Pickup Due'
  if (days <= 60) return 'At Risk'
  return 'Churned'
}

// ─────────────────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [donors,    setDonors]    = useState(() => _initDonors)
  const [pickups,   setPickups]   = useState(() => _initPickups)
  const [kabadiwalas, setKabs]    = useState(() => _initKabs)
  const [raddiRecords, setRaddi]  = useState(() => _initRaddi)

  // ── DONORS ──────────────────────────────────────────────────────────────

  const addDonor = useCallback((data) => {
    const donor = {
      ...data,
      id: uid('D'),
      status: 'Active',
      totalRST: 0,
      totalSKS: 0,
      createdAt: today(),
      lastPickup: null,
      nextPickup: null,
    }
    setDonors(prev => [donor, ...prev])
    return donor
  }, [])

  const updateDonor = useCallback((id, data) => {
    setDonors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
  }, [])

  const deleteDonor = useCallback((id) => {
    setDonors(prev => prev.filter(d => d.id !== id))
  }, [])

  // ── PICKUPS ─────────────────────────────────────────────────────────────

  const schedulePickup = useCallback((data) => {
    const pickup = {
      ...data,
      id: uid('SC'),
      status: 'Pending',
      totalValue: 0,
      amountPaid: 0,
      paymentStatus: 'Not Paid',
      rstItems: [],
      sksItems: [],
      createdAt: today(),
    }
    setPickups(prev => [pickup, ...prev])

    // Mirror nextPickup onto donor
    if (data.donorId && data.date) {
      setDonors(prev => prev.map(d =>
        d.id === data.donorId
          ? { ...d, nextPickup: data.date, status: deriveDonorStatus(d.lastPickup) }
          : d
      ))
    }
    return pickup
  }, [])

  const recordPickup = useCallback((id, data) => {
    // data contains rstItems, sksItems, totalValue, amountPaid, kabadiwala, etc.
    const paymentStatus = derivePaymentStatus(data.totalValue, data.amountPaid)
    const patch = { ...data, status: 'Completed', paymentStatus }

    setPickups(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))

    // Derive type
    const type = data.rstItems?.length && data.sksItems?.length ? 'RST+SKS'
               : data.rstItems?.length ? 'RST'
               : data.sksItems?.length ? 'SKS' : 'RST'

    // Add raddi master record
    const pickup  = pickups.find(p => p.id === id) || {}
    const donor   = donors.find(d => d.id === pickup.donorId) || {}
    const kabObj  = kabadiwalas.find(k => k.name === data.kabadiwala) || {}

    const raddiRow = {
      orderId:         id,
      mobile:          donor.mobile || '',
      name:            donor.name   || pickup.donorName || '',
      houseNo:         donor.house  || '',
      society:         donor.society || pickup.society || '',
      sector:          donor.sector  || pickup.sector  || '',
      city:            donor.city    || pickup.city    || '',
      pickupDate:      data.date || pickup.date || today(),
      orderDate:       pickup.createdAt || today(),
      kabadiwalaName:  data.kabadiwala     || '',
      kabadiwalaPhone: kabObj.mobile       || data.kabadiMobile || '',
      donorStatus:     deriveDonorStatus(donor.lastPickup || data.date),
      items:           data.items || Array(9).fill(0),
      totalKg:         Number(data.totalKg)    || 0,
      totalAmount:     Number(data.totalValue) || 0,
      paymentStatus:   paymentStatus === 'Paid'             ? 'Received'
                     : paymentStatus === 'Partially Paid'   ? 'Yet to Receive'
                     : 'Yet to Receive',
      orderStatus:     'Completed',
      type,
    }

    setRaddi(prev => {
      const exists = prev.findIndex(r => r.orderId === id)
      return exists >= 0
        ? prev.map((r, i) => i === exists ? raddiRow : r)
        : [raddiRow, ...prev]
    })

    // Update donor lastPickup / totalRST / totalSKS
    setDonors(prev => prev.map(d => {
      if (d.id !== pickup.donorId) return d
      return {
        ...d,
        lastPickup: data.date || today(),
        nextPickup: data.nextDate || d.nextPickup,
        totalRST:   (d.totalRST || 0) + (Number(data.totalValue) || 0),
        totalSKS:   (d.totalSKS || 0) + (data.sksItems?.length ? 1 : 0),
        status:     deriveDonorStatus(data.date || today()),
      }
    }))

    // Update kabadiwala financials
    if (data.kabadiwala) {
      setKabs(prev => prev.map(k => {
        if (k.name !== data.kabadiwala) return k
        const val  = Number(data.totalValue) || 0
        const paid = Number(data.amountPaid) || 0
        return {
          ...k,
          totalPickups:   (k.totalPickups   || 0) + 1,
          totalValue:     (k.totalValue     || 0) + val,
          amountReceived: (k.amountReceived || 0) + paid,
          pendingAmount:  (k.pendingAmount  || 0) + (val - paid),
          transactions: [
            ...(k.transactions || []),
            {
              date:     data.date || today(),
              pickupId: id,
              donor:    donor.name || pickup.donorName || '',
              value:    val,
              paid:     paid,
              status:   paymentStatus,
            },
          ],
        }
      }))
    }
  }, [pickups, donors, kabadiwalas])

  const updatePickup = useCallback((id, data) => {
    const paymentStatus = data.totalValue !== undefined || data.amountPaid !== undefined
      ? derivePaymentStatus(data.totalValue, data.amountPaid)
      : undefined

    setPickups(prev => prev.map(p =>
      p.id === id ? { ...p, ...data, ...(paymentStatus ? { paymentStatus } : {}) } : p
    ))

    // Sync raddi record payment status
    if (paymentStatus) {
      const raddiPS = paymentStatus === 'Paid'           ? 'Received'
                    : paymentStatus === 'Partially Paid' ? 'Yet to Receive'
                    : 'Yet to Receive'
      setRaddi(prev => prev.map(r =>
        r.orderId === id
          ? { ...r, paymentStatus: raddiPS, totalAmount: Number(data.totalValue) ?? r.totalAmount }
          : r
      ))
    }
  }, [])

  const deletePickup = useCallback((id) => {
    setPickups(prev => prev.filter(p => p.id !== id))
    setRaddi(prev => prev.filter(r => r.orderId !== id))
  }, [])

  // ── KABADIWALA PAYMENT ───────────────────────────────────────────────────

  const recordKabadiwalaPayment = useCallback((kabId, { pickupId, amount, refMode, refValue, notes, date }) => {
    setKabs(prev => prev.map(k => {
      if (k.id !== kabId) return k
      const additional = Number(amount) || 0
      const newReceived = (k.amountReceived || 0) + additional
      const newPending  = Math.max(0, (k.pendingAmount || 0) - additional)
      return {
        ...k,
        amountReceived: newReceived,
        pendingAmount:  newPending,
        transactions: (k.transactions || []).map(tx => {
          if (tx.pickupId !== pickupId) return tx
          const newPaid   = (tx.paid || 0) + additional
          return {
            ...tx,
            paid:   newPaid,
            status: newPaid >= (tx.value || 0) ? 'Paid' : 'Partially Paid',
          }
        }),
      }
    }))

    // Sync pickup payment
    if (pickupId) {
      setPickups(prev => prev.map(p => {
        if (p.id !== pickupId) return p
        const newPaid = (p.amountPaid || 0) + (Number(amount) || 0)
        const status  = derivePaymentStatus(p.totalValue, newPaid)
        return {
          ...p,
          amountPaid:    newPaid,
          paymentStatus: status,
          payHistory: [...(p.payHistory || []), { date, amount: Number(amount), refMode, refValue, notes }],
        }
      }))
    }
  }, [])

  // ── KABADIWALA CRUD ──────────────────────────────────────────────────────

  const addKabadiwala = useCallback((data) => {
    const k = {
      ...data,
      id: uid('K'),
      rating: 4.0,
      totalPickups:   0,
      totalValue:     0,
      amountReceived: 0,
      pendingAmount:  0,
      transactions:   [],
    }
    setKabs(prev => [...prev, k])
    return k
  }, [])

  const updateKabadiwala = useCallback((id, data) => {
    setKabs(prev => prev.map(k => k.id === id ? { ...k, ...data } : k))
  }, [])

  const deleteKabadiwala = useCallback((id) => {
    setKabs(prev => prev.filter(k => k.id !== id))
  }, [])

  // ── DERIVED DASHBOARD STATS ──────────────────────────────────────────────

  const dashboardStats = useMemo(() => {
    const now = new Date()
    return {
      totalDonors:       donors.length,
      activeDonors:      donors.filter(d => d.status === 'Active').length,
      postponedDonors:   donors.filter(d => d.status === 'Postponed').length,
      lostDonors:        donors.filter(d => d.status === 'Lost').length,
      totalPickupsThisMonth: pickups.filter(p => p.status === 'Completed').length,
      totalRSTValue:     pickups.reduce((s, p) => s + (p.totalValue || 0), 0),
      pendingPayments:   pickups.filter(p =>
        p.paymentStatus === 'Not Paid' || p.paymentStatus === 'Partially Paid'
      ).length,
      upcomingPickups:   pickups.filter(p => p.status === 'Pending').length,
      overduePickups:    donors.filter(d =>
        d.nextPickup && new Date(d.nextPickup) < now && d.status === 'Active'
      ).length,
      drivePickups:      pickups.filter(p => p.pickupMode === 'Drive').length,
      individualPickups: pickups.filter(p => p.pickupMode === 'Individual').length,
      totalRaddiKg:      raddiRecords.reduce((s, r) => s + (r.totalKg || 0), 0),
      totalRevenue:      raddiRecords.reduce((s, r) => s + (r.totalAmount || 0), 0),
    }
  }, [donors, pickups, raddiRecords])

  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    // State
    donors,
    pickups,
    kabadiwalas,
    raddiRecords,
    dashboardStats,

    // Donor actions
    addDonor,
    updateDonor,
    deleteDonor,

    // Pickup actions
    schedulePickup,
    recordPickup,
    updatePickup,
    deletePickup,

    // Kabadiwala actions
    addKabadiwala,
    updateKabadiwala,
    deleteKabadiwala,
    recordKabadiwalaPayment,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}