// Frontend/src/pages/PickupOverview.jsx
// Admin-only: Overview of all pickups — Individual & Drive stats + scheduler tabs
import { useState, useMemo } from 'react'
import {
  Truck, Users, AlertTriangle, TrendingUp,
  Filter, X, Calendar, BarChart3,
} from 'lucide-react'
import { useApp }        from '../context/AppContext'
import { useRole }       from '../context/RoleContext'
import PickupTabs        from '../components/PickupTabs'
import { fmtDate, fmtCurrency } from '../utils/helpers'

const fmt = (d) => d.toISOString().slice(0, 10)
function getPresetRange(p) {
  const n = new Date()
  if (p === 'today')     return { from: fmt(n), to: fmt(n) }
  if (p === 'yesterday') { const d = new Date(n); d.setDate(d.getDate() - 1); return { from: fmt(d), to: fmt(d) } }
  if (p === 'tomorrow')  { const d = new Date(n); d.setDate(d.getDate() + 1); return { from: fmt(d), to: fmt(d) } }
  if (p === 'week')      { const d = new Date(n); d.setDate(d.getDate() - 7); return { from: fmt(d), to: fmt(n) } }
  return { from: '', to: '' }
}

// ── Stats row component ───────────────────────────────────────────────────────
function PickupStatRow({ label, value, sub, color = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color }}>{value}</span>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function PickupOverview() {
  const { pickups, donors, schedulerTabData, dashboardStats } = useApp()
  const { can } = useRole()

  const [section,    setSection]   = useState('overview')  // overview | scheduler
  const [activeTab,  setActiveTab] = useState('scheduled')
  const [datePreset, setPreset]    = useState('all')
  const [dateFrom,   setDateFrom]  = useState('')
  const [dateTo,     setDateTo]    = useState('')
  const [sector,     setSector]    = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Apply preset
  const applyPreset = (p) => {
    setPreset(p)
    if (p !== 'custom' && p !== 'all') { const r = getPresetRange(p); setDateFrom(r.from); setDateTo(r.to) }
    else if (p === 'all') { setDateFrom(''); setDateTo('') }
  }

  // All sectors from pickups
  const allSectors = useMemo(() => [...new Set(pickups.map(p => p.sector).filter(Boolean))].sort(), [pickups])

  // Individual pickups analytics
  const individualPickups = useMemo(() => pickups.filter(p => p.pickupMode === 'Individual'), [pickups])
  const drivePickups      = useMemo(() => pickups.filter(p => p.pickupMode === 'Drive'), [pickups])

  const completedInd   = individualPickups.filter(p => p.status === 'Completed')
  const completedDrive = drivePickups.filter(p => p.status === 'Completed')

  const indRevenue   = completedInd.reduce((s, p) => s + (p.totalValue || 0), 0)
  const driveRevenue = completedDrive.reduce((s, p) => s + (p.totalValue || 0), 0)

  const pendingInd   = individualPickups.filter(p => p.status === 'Pending').length
  const pendingDrive = drivePickups.filter(p => p.status === 'Pending').length

  // Monthly breakdown
  const monthlyStats = useMemo(() => {
    const m = {}
    pickups.filter(p => p.status === 'Completed').forEach(p => {
      const key = (p.date || '').slice(0, 7)
      if (!key) return
      if (!m[key]) m[key] = { month: key, individual: 0, drive: 0, revenue: 0 }
      if (p.pickupMode === 'Drive') m[key].drive++
      else m[key].individual++
      m[key].revenue += p.totalValue || 0
    })
    return Object.values(m).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6)
  }, [pickups])

  // Filtered scheduler tabs
  const filteredTabData = useMemo(() => {
    const inRange  = (ds) => { if (!ds) return true; if (dateFrom && ds < dateFrom) return false; if (dateTo && ds > dateTo) return false; return true }
    const inSector = (row) => !sector || row.sector === sector
    const f        = (rows, dk = 'scheduledDate') => rows.filter(r => inRange(r[dk]) && inSector(r))
    return {
      overdue:   f(schedulerTabData.overdue),
      scheduled: f(schedulerTabData.scheduled),
      atRisk:    f(schedulerTabData.atRisk, 'lastPickup'),
      churned:   f(schedulerTabData.churned, 'lastPickup'),
    }
  }, [schedulerTabData, dateFrom, dateTo, sector])

  if (!can.viewPickupOverview) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-icon"><AlertTriangle size={24} /></div>
          <h3>Access Restricted</h3>
          <p>Pickup Overview is available to Admin and Manager roles only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-body">
      {/* Section tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${section === 'overview' ? 'active' : ''}`} onClick={() => setSection('overview')}>
          <BarChart3 size={13} style={{ marginRight: 5 }} />Pickup Analytics
        </button>
        <button className={`tab ${section === 'scheduler' ? 'active' : ''}`} onClick={() => setSection('scheduler')}>
          <Calendar size={13} style={{ marginRight: 5 }} />Scheduler Tabs
        </button>
      </div>

      {/* ── OVERVIEW SECTION ── */}
      {section === 'overview' && (
        <>
          {/* Top KPIs */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card orange">
              <div className="stat-icon"><Truck size={18} /></div>
              <div className="stat-value">{completedInd.length}</div>
              <div className="stat-label">Individual Pickups</div>
              <div className="stat-change up">{pendingInd} pending</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon"><Users size={18} /></div>
              <div className="stat-value">{completedDrive.length}</div>
              <div className="stat-label">Drive Pickups</div>
              <div className="stat-change up">{pendingDrive} pending</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon"><TrendingUp size={18} /></div>
              <div className="stat-value">{fmtCurrency(indRevenue)}</div>
              <div className="stat-label">Individual Revenue</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon"><TrendingUp size={18} /></div>
              <div className="stat-value">{fmtCurrency(driveRevenue)}</div>
              <div className="stat-label">Drive Revenue</div>
            </div>
          </div>

          <div className="two-col" style={{ marginBottom: 24 }}>
            {/* Individual stats */}
            <div className="card">
              <div className="card-header">
                <Truck size={16} color="var(--primary)" />
                <div className="card-title">Individual Pickup Stats</div>
              </div>
              <div className="card-body">
                <PickupStatRow label="Total Completed"      value={completedInd.length}       color="var(--secondary)" />
                <PickupStatRow label="Total Pending"        value={pendingInd}                 color="var(--info)" />
                <PickupStatRow label="Total Revenue"        value={fmtCurrency(indRevenue)}   color="var(--primary)" />
                <PickupStatRow label="Avg Revenue / Pickup" value={completedInd.length ? fmtCurrency(Math.round(indRevenue / completedInd.length)) : '—'} />
                <PickupStatRow label="Postponed"            value={individualPickups.filter(p => p.status === 'Postponed').length} />
                <PickupStatRow label="Did Not Open Door"    value={individualPickups.filter(p => p.status === 'Did Not Open Door').length} />
                <PickupStatRow label="RST Pickups"          value={completedInd.filter(p => p.type?.includes('RST')).length} />
                <PickupStatRow label="SKS Pickups"          value={completedInd.filter(p => p.type?.includes('SKS')).length} />
              </div>
            </div>

            {/* Drive stats */}
            <div className="card">
              <div className="card-header">
                <Users size={16} color="var(--info)" />
                <div className="card-title">Drive / Campaign Pickup Stats</div>
              </div>
              <div className="card-body">
                <PickupStatRow label="Total Completed"      value={completedDrive.length}      color="var(--secondary)" />
                <PickupStatRow label="Total Pending"        value={pendingDrive}                color="var(--info)" />
                <PickupStatRow label="Total Revenue"        value={fmtCurrency(driveRevenue)}  color="var(--primary)" />
                <PickupStatRow label="Avg Revenue / Drive"  value={completedDrive.length ? fmtCurrency(Math.round(driveRevenue / completedDrive.length)) : '—'} />
                <PickupStatRow label="Postponed"            value={drivePickups.filter(p => p.status === 'Postponed').length} />
                <PickupStatRow label="SKS Drives"           value={completedDrive.filter(p => p.type?.includes('SKS')).length} />
                <PickupStatRow label="RST Drives"           value={completedDrive.filter(p => p.type?.includes('RST')).length} />
                <PickupStatRow label="RST+SKS Combo Drives" value={completedDrive.filter(p => p.type === 'RST+SKS').length} />
              </div>
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className="card">
            <div className="card-header">
              <BarChart3 size={16} color="var(--secondary)" />
              <div className="card-title">Monthly Pickup Breakdown</div>
            </div>
            <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Individual</th>
                    <th>Drive</th>
                    <th>Total</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No completed pickups</td></tr>
                  ) : monthlyStats.map(m => (
                    <tr key={m.month}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.month}</td>
                      <td style={{ fontWeight: 600 }}>{m.individual}</td>
                      <td style={{ fontWeight: 600 }}>{m.drive}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.individual + m.drive}</td>
                      <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{fmtCurrency(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── SCHEDULER TABS SECTION ── */}
      {section === 'scheduler' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="card-title">Scheduled & At-Risk Pickups</div>
            <button className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`} onClick={() => setShowFilters(f => !f)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={13} />Filters
            </button>
          </div>

          {showFilters && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['today','Today'],['yesterday','Yesterday'],['tomorrow','Tomorrow'],['week','This Week'],['all','All'],['custom','Custom']].map(([v, l]) => (
                    <button key={v} className={`btn btn-sm ${datePreset === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => applyPreset(v)} style={{ fontSize: 12 }}>{l}</button>
                  ))}
                  {datePreset === 'custom' && (
                    <>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140, fontSize: 12 }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ width: 140, fontSize: 12 }} />
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sector</label>
                <select value={sector} onChange={e => setSector(e.target.value)} style={{ minWidth: 160, fontSize: 13 }}>
                  <option value="">All Sectors</option>
                  {allSectors.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {(sector || datePreset !== 'all') && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSector(''); applyPreset('all') }}>
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          )}

          <div className="card-body">
            <PickupTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              data={filteredTabData}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}