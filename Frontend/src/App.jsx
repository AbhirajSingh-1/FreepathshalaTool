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
import UserManagement from './pages/UserManagement'

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
  usermanagement: UserManagement,
}

function LoginScreen() {
  const { login, authError } = useRole()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSaving, setForgotSaving] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const submitForgot = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSaving(true)
    setForgotMsg('')
    try {
      const { forgotPassword } = await import('./services/api')
      await forgotPassword(forgotEmail.trim())
      setForgotMsg('success')
    } catch (err) {
      setForgotMsg(err.message || 'Failed to send reset email')
    } finally {
      setForgotSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: isMobile ? '16px' : '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    background: '#f9fafb',
    fontFamily: 'inherit'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '16px' : '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: 'auto'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        display: isMobile ? 'none' : 'block',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        display: isMobile ? 'none' : 'block',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: isMobile ? '100%' : 'min(420px, 100%)',
        maxWidth: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: isMobile ? '12px' : '16px',
        boxShadow: isMobile ? '0 10px 30px rgba(0, 0, 0, 0.2)' : '0 20px 60px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        padding: isMobile ? '32px 20px' : '40px 36px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '28px' : '32px', textAlign: 'center', flexShrink: 0 }}>
          {/* Logo Circle */}
          <div style={{
            width: isMobile ? '56px' : '60px',
            height: isMobile ? '56px' : '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            flexShrink: 0
          }}>
            <svg width={isMobile ? '28' : '30'} height={isMobile ? '28' : '30'} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
          </div>
          
          <h1 style={{
            fontSize: isMobile ? '28px' : '30px',
            fontWeight: '700',
            margin: '0 0 6px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            FreePathshala
          </h1>
          
          <p style={{
            color: '#999',
            fontSize: isMobile ? '13px' : '13.5px',
            margin: '0',
            fontWeight: '500'
          }}>
            {showForgot ? 'Recover your account' : 'Charity Management Platform'}
          </p>
        </div>

        {showForgot ? (
          // Forgot Password Form
          <form onSubmit={submitForgot}>
            {forgotMsg === 'success' ? (
              <div style={{
                padding: '14px 12px',
                borderRadius: '12px',
                background: '#ecfdf5',
                border: '1px solid #d1fae5',
                color: '#047857',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: isMobile ? '18px' : '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                <span>Reset link sent! Check your email inbox</span>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: isMobile ? '18px' : '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '13px' : '13.5px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '6px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    autoFocus
                    required
                    style={inputStyle}
                    onFocus={e => {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.background = '#f9fafb'
                    }}
                  />
                </div>
                
                {forgotMsg && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '12px',
                    marginBottom: '14px',
                    padding: '10px 12px',
                    background: '#fee2e2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}>
                    {forgotMsg}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={forgotSaving}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: forgotSaving ? 'not-allowed' : 'pointer',
                    opacity: forgotSaving ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    marginBottom: '10px',
                    fontFamily: 'inherit'
                  }}
                >
                  {forgotSaving ? 'Sending…' : 'Send Reset Link'}
                </button>
              </>
            )}
            
            <button
              type="button"
              onClick={() => { setShowForgot(false); setForgotMsg('') }}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: isMobile ? '13px' : '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px',
                transition: 'color 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => e.target.style.color = '#764ba2'}
              onMouseLeave={e => e.target.style.color = '#667eea'}
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          // Sign In Form
          <form onSubmit={submit}>
            <div style={{ marginBottom: isMobile ? '18px' : '16px' }}>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '13px' : '13.5px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '6px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                autoFocus
                required
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.background = '#fff'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.background = '#f9fafb'
                }}
              />
            </div>

            <div style={{ marginBottom: isMobile ? '18px' : '16px' }}>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '13px' : '13.5px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.background = '#fff'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.background = '#f9fafb'
                }}
              />
            </div>

            {(error || authError) && (
              <div style={{
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '14px',
                padding: '11px 12px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠</span>
                <span>{error || authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                marginBottom: '10px',
                fontFamily: 'inherit'
              }}
            >
              {saving ? (
                <span>Signing in...</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgot(true); setForgotEmail(email) }}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#999',
                fontSize: isMobile ? '13px' : '13.5px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '6px',
                transition: 'color 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={e => e.target.style.color = '#667eea'}
              onMouseLeave={e => e.target.style.color = '#999'}
            >
              Forgot your password?
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{
          marginTop: isMobile ? '24px' : '24px',
          paddingTop: isMobile ? '16px' : '18px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#999',
          fontSize: isMobile ? '11px' : '11.5px'
        }}>
          <p style={{ margin: '0' }}>FreePathshala © 2026 • All rights reserved</p>
        </div>
      </div>
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

// Default page based on role - used as fallback when no hash in URL
const DEFAULT_PAGE_BY_ROLE = {
  admin: 'dashboard',
  manager: 'dashboard',
  executive: 'todaypickups',
}

function AppShell() {
  const { role, user, logout } = useRole()
  const { loading, error, refetchAll } = useApp()

  // Default page based on role
  const defaultPage = DEFAULT_PAGE_BY_ROLE[role] || 'todaypickups'

  // Navigation is now simple - frontend allows navigation to any page
  // Backend enforces authorization with 403 errors if user lacks permission
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return PAGES[hash] ? hash : defaultPage
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addDonor, setAddDonor] = useState(false)
  const [pickupInitDonorId, setPickupInitDonorId] = useState(null)
  const [pickupInitPickupId, setPickupInitPickupId] = useState(null)

  // Navigate to any page - backend will block unauthorized access
  const navigate = (target, opts = {}) => {
    setPage(target)
    window.location.hash = target
    setSidebarOpen(false)
    setPickupInitDonorId(target === 'pickups' && opts?.donorId ? opts.donorId : null)
    setPickupInitPickupId(target === 'pickups' && opts?.pickupId ? opts.pickupId : null)
  }

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      // Allow navigation to any hash - backend will enforce permissions
      const newPage = PAGES[hash] ? hash : defaultPage
      setPage(newPage)
      if (newPage !== hash && PAGES[hash]) {
        window.location.hash = hash
      } else if (!PAGES[hash]) {
        window.location.hash = defaultPage
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [role]) // eslint-disable-line

const PageComponent = PAGES[page] || Dashboard
  // Frontend allows navigation to all pages - backend enforces authorization
  // We no longer check isAccessible here since backend will return 403 for unauthorized access

  return (
    <div className="app-layout">
      <Sidebar
        active={page}
        onNav={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogoClick={() => navigate(defaultPage)}
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
            <button className="btn btn-ghost btn-sm" onClick={() => refetchAll({ force: true })}>Retry</button>
          </div>
        )}
        {/* Always render the page component - backend will return 403 if unauthorized */}
        <PageComponent
          onNav={navigate}
          triggerAddDonor={addDonor}
          onAddDonorDone={() => setAddDonor(false)}
          initialDonorId={page === 'pickups' ? pickupInitDonorId : undefined}
          initialPickupId={page === 'pickups' ? pickupInitPickupId : undefined}
          onDonorApplied={() => setPickupInitDonorId(null)}
          onPickupApplied={() => setPickupInitPickupId(null)}
        />
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
