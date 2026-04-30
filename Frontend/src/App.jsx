import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { RoleProvider, useRole } from './context/RoleContext'
import Sidebar from './component/Layout/Sidebar'
import Header from './component/Layout/Header'
import Dashboard from './pages/Dashboard'
import Donors from './pages/Donors'
import Supporters from './pages/Supporters'
import Pickups from './pages/Pickups'
import PickupPartners from './pages/Pickuppartners'
import Payments from './pages/Payments'
import PickupScheduler from './pages/PickupScheduler'
import PickupOverview from './pages/PickupOverview'
import RaddiMaster from './pages/RaddiMaster'
import SKSOverview from './pages/SKSOverview'
import TodayPickups from './pages/Todaypickups'

const PAGES = {
  dashboard: Dashboard,
  donors: Donors,
  supporters: Supporters,
  pickups: Pickups,
  pickuppartners: PickupPartners,
  payments: Payments,
  pickupscheduler: PickupScheduler,
  todaypickups: TodayPickups,
  pickupoverview: PickupOverview,
  raddimaster: RaddiMaster,
  sksoverview: SKSOverview,
}

function LoginScreen() {
  const { login, authError } = useRole()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 20 }}>
      <form onSubmit={submit} className="modal" style={{ width: 'min(420px, 94vw)', padding: 28 }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>FreePathshala</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Sign in with your Firebase account</div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {(error || authError) && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 12 }}>{error || authError}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

function AccessDenied({ onBack }) {
  return (
    <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="empty-state">
        <div className="empty-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h3>Access Restricted</h3>
        <p>You do not have permission to view this page. Contact your admin to request access.</p>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={onBack}>
          Go Back
        </button>
      </div>
    </div>
  )
}

function AppShell() {
  const { role, user, logout, ROLE_PAGES, DEFAULT_PAGE } = useRole()
  const { loading, error, refetchAll } = useApp()

  const getValidPage = (hash) => {
    const page = PAGES[hash] ? hash : DEFAULT_PAGE[role] || 'pickups'
    return (ROLE_PAGES[role] || []).includes(page) ? page : (DEFAULT_PAGE[role] || 'pickups')
  }

  const [page, setPage] = useState(() => getValidPage(window.location.hash.replace('#', '')))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addDonor, setAddDonor] = useState(false)
  const [pickupInitDonorId, setPickupInitDonorId] = useState(null)
  const [pickupInitPickupId, setPickupInitPickupId] = useState(null)

  useEffect(() => {
    if (!(ROLE_PAGES[role] || []).includes(page)) {
      const fallback = DEFAULT_PAGE[role] || 'pickups'
      setPage(fallback)
      window.location.hash = fallback
    }
  }, [role]) // eslint-disable-line

  const navigate = (target, opts = {}) => {
    if (!(ROLE_PAGES[role] || []).includes(target)) return
    setPage(target)
    window.location.hash = target
    setSidebarOpen(false)
    setPickupInitDonorId(target === 'pickups' && opts?.donorId ? opts.donorId : null)
    setPickupInitPickupId(target === 'pickups' && opts?.pickupId ? opts.pickupId : null)
  }

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      const valid = getValidPage(hash)
      setPage(valid)
      if (valid !== hash) window.location.hash = valid
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [role]) // eslint-disable-line

  const PageComponent = PAGES[page] || Dashboard
  const isAccessible = (ROLE_PAGES[role] || []).includes(page)

  return (
    <div className="app-layout">
      <Sidebar
        active={page}
        onNav={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogoClick={() => navigate(DEFAULT_PAGE[role] || 'pickups')}
        role={role}
      />
      <div className="main-content">
        <Header
          page={page}
          onMenuClick={() => setSidebarOpen(open => !open)}
          onAddDonor={() => setAddDonor(true)}
          user={user}
          role={role}
          onLogout={logout}
        />
        {loading && (
          <div style={{ padding: '10px 18px', background: 'var(--info-bg)', color: 'var(--info)', fontSize: 13, fontWeight: 700 }}>
            Loading latest backend data...
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 18px', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={refetchAll}>Retry</button>
          </div>
        )}
        {isAccessible ? (
          <PageComponent
            onNav={navigate}
            triggerAddDonor={addDonor}
            onAddDonorDone={() => setAddDonor(false)}
            initialDonorId={page === 'pickups' ? pickupInitDonorId : undefined}
            initialPickupId={page === 'pickups' ? pickupInitPickupId : undefined}
            onDonorApplied={() => setPickupInitDonorId(null)}
            onPickupApplied={() => setPickupInitPickupId(null)}
          />
        ) : (
          <AccessDenied onBack={() => navigate(DEFAULT_PAGE[role] || 'pickups')} />
        )}
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const { authLoading, isAuthenticated } = useRole()
  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>
  }
  if (!isAuthenticated) return <LoginScreen />
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <AuthenticatedApp />
    </RoleProvider>
  )
}
