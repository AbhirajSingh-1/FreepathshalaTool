// Frontend/src/App.jsx
import { useState, useEffect } from 'react'
import { AppProvider }    from './context/AppContext'
import { RoleProvider, useRole, ROLES } from './context/RoleContext'
import Sidebar            from './component/Layout/Sidebar'
import Header             from './component/Layout/Header'
import Dashboard          from './pages/Dashboard'
import Donors             from './pages/Donors'
import Pickups            from './pages/Pickups'
import PickupPartners     from './pages/Pickuppartners'
import Payments           from './pages/Payments'
import PickupScheduler    from './pages/PickupScheduler'
import PickupOverview     from './pages/PickupOverview'
import RaddiMaster        from './pages/RaddiMaster'

const PAGES = {
  dashboard:       Dashboard,
  donors:          Donors,
  pickups:         Pickups,
  pickuppartners:  PickupPartners,
  payments:        Payments,
  pickupscheduler: PickupScheduler,
  pickupoverview:  PickupOverview,
  raddimaster:     RaddiMaster,
}

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '')
  return PAGES[hash] ? hash : 'dashboard'
}

// ── Role Switcher (demo widget, bottom-right) ─────────────────────────────────
function RoleSwitcher() {
  const { role, changeRole, ROLES } = useRole()
  const [open, setOpen] = useState(false)
  const current = ROLES[role]

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 300 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-md)', padding: 8, minWidth: 180 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px 8px' }}>Switch Role (Demo)</div>
          {Object.entries(ROLES).map(([key, val]) => (
            <button key={key} onClick={() => { changeRole(key); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: role === key ? val.bg : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: role === key ? 700 : 400, color: role === key ? val.color : 'var(--text-secondary)' }}>{val.label}</span>
              {role === key && <span style={{ marginLeft: 'auto', fontSize: 10, color: val.color }}>✓</span>}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, border: `2px solid ${current.color}`, background: current.bg, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: current.color, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: current.color }} />
        {current.label}
      </button>
    </div>
  )
}

function AppShell() {
  const [page, setPage]      = useState(getPageFromHash)
  const [sidebarOpen, setSO] = useState(false)
  const [addDonor, setAddD]  = useState(false)
  const { can } = useRole()

  const navigate = (p) => {
    setPage(p)
    window.location.hash = p
    setSO(false)
  }

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const PageComponent = PAGES[page] || Dashboard

  return (
    <div className="app-layout">
      <Sidebar
        active={page}
        onNav={navigate}
        open={sidebarOpen}
        onClose={() => setSO(false)}
        onLogoClick={() => navigate('dashboard')}
      />
      <div className="main-content">
        <Header
          page={page}
          onMenuClick={() => setSO(o => !o)}
          onAddDonor={() => setAddD(true)}
        />
        <PageComponent
          onNav={navigate}
          triggerAddDonor={addDonor}
          onAddDonorDone={() => setAddD(false)}
        />
      </div>
      <RoleSwitcher />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <RoleProvider>
        <AppShell />
      </RoleProvider>
    </AppProvider>
  )
}