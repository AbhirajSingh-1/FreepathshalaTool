// Frontend/src/pages/Supporters.jsx
// Dedicated page for Supporters & Contributors
// Shows all donors classified by type: RST donors, SKS contributors, Supporters (cash/goods), Both
// Donor status uses the same centralized logic as the rest of the system
import { useState, useMemo } from 'react'
import {
  Heart, ThumbsUp, Search, SlidersHorizontal, X,
  Phone, MapPin, Clock, CheckCircle, AlertCircle,
  UserX, Download, ChevronDown, ChevronUp, Users,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { deriveDonorStatus } from '../context/AppContext'
import { fmtDate, fmtCurrency, exportToExcel } from '../utils/helpers'
import { CITIES, CITY_SECTORS } from '../data/mockData'
import { differenceInDays, parseISO } from 'date-fns'

// ── Re-use the same category logic as Donors.jsx ──────────────────────────────
function getDonorCategory(donor, donorPickups) {
  if (donor.donorType === 'both')      return 'both'
  if (donor.donorType === 'supporter') return 'supporter'
  if (donor.donorType === 'donor')     return 'contributor'
  const completed  = (donorPickups || []).filter(p => p.status === 'Completed')
  const hasContrib = completed.some(p =>
    (p.rstItems?.length > 0 && (p.type === 'RST' || p.type === 'RST+SKS')) ||
    (p.sksItems?.length > 0 && (p.type === 'SKS' || p.type === 'RST+SKS')) ||
    p.totalValue > 0
  )
  const hasSupport =
    !!(donor.supportContribution?.trim()) ||
    completed.some(p => p.rstItems?.includes('Others') || p.sksItems?.some(i => i?.startsWith('Others')))

  if (hasContrib && hasSupport) return 'both'
  if (hasSupport)               return 'supporter'
  if (hasContrib)               return 'contributor'
  return null
}

// ── Centralized donor segment (uses same logic as Donors page) ────────────────
function getDonorSegment(donor) {
  if (donor.status === 'Lost')      return 'Lost'
  if (donor.status === 'Postponed') return 'Postponed'
  if (!donor.lastPickup)            return 'Active'
  const days = differenceInDays(new Date(), parseISO(donor.lastPickup))
  if (days <= 30)  return 'Active'
  if (days <= 45)  return 'Pickup Due'
  if (days <= 60)  return 'At Risk'
  return 'Churned'
}

// ── Status config ─────────────────────────────────────────────────────────────
const SEGMENT_CONFIG = {
  'Active':     { color: 'var(--secondary)', bg: 'var(--secondary-light)', icon: CheckCircle },
  'Pickup Due': { color: 'var(--info)',       bg: 'var(--info-bg)',         icon: Clock },
  'At Risk':    { color: 'var(--warning)',    bg: 'var(--warning-bg)',      icon: AlertCircle },
  'Churned':    { color: 'var(--danger)',     bg: 'var(--danger-bg)',       icon: UserX },
  'Postponed':  { color: 'var(--warning)',    bg: 'var(--warning-bg)',      icon: Clock },
  'Lost':       { color: 'var(--danger)',     bg: 'var(--danger-bg)',       icon: UserX },
}

const CATEGORY_CONFIG = {
  both:        { label: '❤️ 👍 Supporter + Contributor', color: 'var(--primary)',   bg: 'var(--primary-light)' },
  supporter:   { label: '❤️ Supporter',                 color: '#991B1B',           bg: '#FEE2E2' },
  contributor: { label: '👍 RST/SKS Contributor',       color: 'var(--secondary)',  bg: 'var(--secondary-light)' },
}

function StatusBadge({ segment }) {
  const cfg = SEGMENT_CONFIG[segment] || SEGMENT_CONFIG['Active']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {segment}
    </span>
  )
}

function CategoryBadge({ category }) {
  if (!category) return null
  const cfg = CATEGORY_CONFIG[category] || {}
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg || 'var(--border-light)', color: cfg.color || 'var(--text-muted)' }}>
      {cfg.label}
    </span>
  )
}

// ── Type filter tabs ──────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { id: 'all',         label: 'All',           icon: Users },
  { id: 'both',        label: '❤️ 👍 Both',   icon: null },
  { id: 'supporter',   label: '❤️ Supporters', icon: Heart },
  { id: 'contributor', label: '👍 RST/SKS',   icon: ThumbsUp },
]

// ════════════════════════════════════════════════════════════════════════════
export default function Supporters() {
  const { donors, pickups } = useApp()

  const [search,        setSearch]       = useState('')
  const [filterType,    setFilterType]   = useState('all')
  const [filterStatus,  setFilterStatus] = useState('')
  const [filterCity,    setFilterCity]   = useState('')
  const [filterSector,  setFilterSector] = useState('')
  const [showFilters,   setShowFilters]  = useState(false)
  const [sortKey,       setSortKey]      = useState('name')
  const [sortDir,       setSortDir]      = useState('asc')
  const [expanded,      setExpanded]     = useState({})

  const sectorOptions = useMemo(() => filterCity ? (CITY_SECTORS[filterCity] || []) : [], [filterCity])

  // Build pickup lookup
  const pickupsByDonor = useMemo(() => {
    const map = {}
    pickups.forEach(p => {
      if (!map[p.donorId]) map[p.donorId] = []
      map[p.donorId].push(p)
    })
    return map
  }, [pickups])

  // Enrich donors with category & segment
  const enrichedDonors = useMemo(() => {
    return donors
      .filter(d => d.status !== 'Lost')  // exclude lost donors from main view
      .map(d => {
        const donorPickups = pickupsByDonor[d.id] || []
        const category     = getDonorCategory(d, donorPickups)
        const segment      = getDonorSegment(d)
        const sksCount     = donorPickups.filter(p => p.status === 'Completed' && (p.sksItems || []).length > 0).length
        const rstCount     = donorPickups.filter(p => p.status === 'Completed' && (p.rstItems || []).length > 0).length
        const totalPickups = donorPickups.filter(p => p.status === 'Completed').length
        const daysSince    = d.lastPickup ? differenceInDays(new Date(), parseISO(d.lastPickup)) : null
        return { ...d, category, segment, sksCount, rstCount, totalPickups, daysSince }
      })
  }, [donors, pickupsByDonor])

  // KPI counts
  const kpis = useMemo(() => ({
    total:       enrichedDonors.length,
    both:        enrichedDonors.filter(d => d.category === 'both').length,
    supporters:  enrichedDonors.filter(d => d.category === 'supporter').length,
    contributors:enrichedDonors.filter(d => d.category === 'contributor').length,
    active:      enrichedDonors.filter(d => d.segment === 'Active').length,
    atRisk:      enrichedDonors.filter(d => d.segment === 'At Risk' || d.segment === 'Churned').length,
  }), [enrichedDonors])

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let rows = enrichedDonors.filter(d => {
      const mSearch = !q || d.name.toLowerCase().includes(q) || (d.mobile || '').includes(q) || (d.society || '').toLowerCase().includes(q) || (d.id || '').toLowerCase().includes(q)
      const mType   = filterType === 'all' || d.category === filterType
      const mStatus = !filterStatus || d.segment === filterStatus
      const mCity   = !filterCity   || d.city   === filterCity
      const mSector = !filterSector || d.sector === filterSector
      return mSearch && mType && mStatus && mCity && mSector
    })
    // Sort
    rows.sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      if (sortKey === 'totalRST' || sortKey === 'totalPickups' || sortKey === 'sksCount') {
        av = Number(av); bv = Number(bv)
      } else {
        if (typeof av === 'string') av = av.toLowerCase()
        if (typeof bv === 'string') bv = bv.toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [enrichedDonors, search, filterType, filterStatus, filterCity, filterSector, sortKey, sortDir])

  const toggleSort = (key) => {
    setSortDir(d => sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
  }

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  const hasFilters = filterStatus || filterCity || filterSector

  const SortTh = ({ k, children, style: s }) => (
    <th onClick={() => toggleSort(k)} style={{ cursor: 'pointer', userSelect: 'none', ...s }}>
      {children}
      {sortKey === k
        ? <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        : <span style={{ marginLeft: 4, opacity: 0.2 }}>↕</span>}
    </th>
  )

  const handleExport = () => {
    exportToExcel(filtered.map(d => ({
      'ID':                 d.id,
      'Name':               d.name,
      'Mobile':             d.mobile || '—',
      'Type':               CATEGORY_CONFIG[d.category]?.label || '—',
      'Support Contribution': d.supportContribution || '—',
      'Donor Status':       d.segment,
      'City':               d.city || '—',
      'Sector':             d.sector || '—',
      'Society':            d.society || '—',
      'House No':           d.house || '—',
      'Last Pickup':        d.lastPickup ? fmtDate(d.lastPickup) : '—',
      'Next Pickup':        d.nextPickup ? fmtDate(d.nextPickup) : '—',
      'Total Pickups':      d.totalPickups,
      'RST Pickups':        d.rstCount,
      'SKS Pickups':        d.sksCount,
      'Total RST Donated (₹)': d.totalRST || 0,
    })), 'Supporters_Export')
  }

  return (
    <div className="page-body">

      {/* ── Header ── */}
      <div style={{ marginBottom: 20, padding: '14px 18px', background: 'linear-gradient(135deg, #FDE7DA 0%, var(--secondary-light) 100%)', borderRadius: 'var(--radius)', border: '1px solid rgba(232,82,26,0.15)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Heart size={20} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>Supporters & Contributors</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>All donors, RST/SKS contributors and supporters in one view</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ flexShrink: 0 }}>
          <Download size={13} /> Export ({filtered.length})
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card orange">
          <div className="stat-icon"><Users size={18} /></div>
          <div className="stat-value">{kpis.total}</div>
          <div className="stat-label">Total Donors</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><Heart size={18} /></div>
          <div className="stat-value">{kpis.supporters + kpis.both}</div>
          <div className="stat-label">Supporters (incl. Both)</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><ThumbsUp size={18} /></div>
          <div className="stat-value">{kpis.contributors + kpis.both}</div>
          <div className="stat-label">RST/SKS Contributors</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><CheckCircle size={18} /></div>
          <div className="stat-value">{kpis.active}</div>
          <div className="stat-label">Active Donors</div>
          <div className="stat-change down">{kpis.atRisk} at risk / churned</div>
        </div>
      </div>

      {/* ── Type filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {TYPE_FILTERS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              borderRadius: 'var(--radius-sm)', border: `1.5px solid ${filterType === t.id ? 'var(--primary)' : 'var(--border)'}`,
              background: filterType === t.id ? 'var(--primary-light)' : 'var(--surface)',
              color: filterType === t.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: filterType === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
            <span style={{ background: filterType === t.id ? 'var(--primary)' : 'var(--border)', color: filterType === t.id ? 'white' : 'var(--text-muted)', borderRadius: 20, fontSize: 10.5, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
              {t.id === 'all' ? kpis.total : t.id === 'both' ? kpis.both : t.id === 'supporter' ? kpis.supporters : kpis.contributors}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input placeholder="Search name, mobile, society, ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: '100%', fontSize: 13 }} />
          </div>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`}
            onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <SlidersHorizontal size={13} />
            {hasFilters
              ? <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{[filterStatus, filterCity, filterSector].filter(Boolean).length}</span>
              : 'Filter'}
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, background: 'var(--bg)', borderRadius: 10, padding: 10, border: '1px solid var(--border-light)' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12.5 }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pickup Due">Pickup Due</option>
              <option value="At Risk">At Risk</option>
              <option value="Churned">Churned</option>
              <option value="Postponed">Postponed</option>
            </select>
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterSector('') }} style={{ fontSize: 12.5 }}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} disabled={!filterCity} style={{ fontSize: 12.5 }}>
              <option value="">{filterCity ? 'All Sectors' : 'Select city first'}</option>
              {sectorOptions.map(s => <option key={s}>{s}</option>)}
            </select>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { setFilterStatus(''); setFilterCity(''); setFilterSector('') }}>
                <X size={10} /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of <strong>{enrichedDonors.length}</strong> donors
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Heart size={24} /></div>
          <h3>No donors found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 28, padding: '10px 6px' }}></th>
                  <SortTh k="id">ID</SortTh>
                  <SortTh k="name">Name</SortTh>
                  <th>Mobile</th>
                  <th>Type / Category</th>
                  <th>Support Contribution</th>
                  <SortTh k="segment">Donor Status</SortTh>
                  <th>Location</th>
                  <SortTh k="lastPickup">Last Pickup</SortTh>
                  <th>Next Pickup</th>
                  <SortTh k="totalPickups">Pickups</SortTh>
                  <SortTh k="sksCount">SKS</SortTh>
                  <SortTh k="totalRST">RST Donated</SortTh>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const isOpen   = !!expanded[d.id]
                  const segCfg   = SEGMENT_CONFIG[d.segment] || SEGMENT_CONFIG['Active']
                  const donorPks = pickupsByDonor[d.id] || []
                  const recentPks = donorPks.filter(p => p.status === 'Completed').sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5)

                  return [
                    <tr key={d.id} onClick={() => toggleExpand(d.id)} style={{ cursor: 'pointer' }}>
                      {/* Expand */}
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '11px 6px' }}>
                        {recentPks.length > 0 ? (isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null}
                      </td>
                      {/* ID */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: 5 }}>{d.id}</span>
                      </td>
                      {/* Name */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                        {d.house && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.house}</div>}
                      </td>
                      {/* Mobile */}
                      <td style={{ fontSize: 12.5, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={10} color="var(--text-muted)" />
                          {d.mobile || '—'}
                        </div>
                      </td>
                      {/* Type */}
                      <td><CategoryBadge category={d.category} /></td>
                      {/* Support Contribution */}
                      <td>
                        {d.supportContribution?.trim()
                          ? <span style={{ fontSize: 12, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>❤️ {d.supportContribution}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      {/* Status */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: segCfg.color, flexShrink: 0 }} />
                          <StatusBadge segment={d.segment} />
                        </div>
                        {d.daysSince !== null && (
                          <div style={{ fontSize: 10.5, color: segCfg.color, marginTop: 2, fontWeight: 600 }}>{d.daysSince}d ago</div>
                        )}
                      </td>
                      {/* Location */}
                      <td>
                        <div style={{ fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <MapPin size={10} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            {d.society && <div style={{ fontWeight: 500 }}>{d.society}</div>}
                            <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{[d.sector, d.city].filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                      </td>
                      {/* Last Pickup */}
                      <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{d.lastPickup ? fmtDate(d.lastPickup) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      {/* Next Pickup */}
                      <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {d.nextPickup
                          ? <span style={{ fontWeight: 600, color: new Date(d.nextPickup) < new Date() ? 'var(--danger)' : 'var(--info)' }}>{fmtDate(d.nextPickup)}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      {/* Total Pickups */}
                      <td style={{ fontWeight: 700, textAlign: 'center' }}>{d.totalPickups}</td>
                      {/* SKS */}
                      <td style={{ textAlign: 'center' }}>
                        {d.sksCount > 0
                          ? <span style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>{d.sksCount}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      {/* RST Donated */}
                      <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                        {(d.totalRST || 0) > 0 ? fmtCurrency(d.totalRST) : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}
                      </td>
                    </tr>,

                    // Expanded detail: recent pickups
                    isOpen && recentPks.length > 0 && (
                      <tr key={`${d.id}-detail`}>
                        <td colSpan={13} style={{ padding: '12px 20px', background: 'var(--bg)', borderBottom: '2px solid var(--border-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Recent Pickups</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {recentPks.map(p => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 7px', borderRadius: 4 }}>{p.orderId || p.id}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtDate(p.date)}</span>
                                <span style={{ fontSize: 11, background: p.type === 'RST' ? 'var(--secondary-light)' : p.type === 'SKS' ? 'var(--info-bg)' : 'var(--warning-bg)', color: p.type === 'RST' ? 'var(--secondary)' : p.type === 'SKS' ? 'var(--info)' : '#92400E', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{p.type}</span>
                                {(p.rstItems || []).slice(0, 3).map(item => (
                                  <span key={item} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--secondary-light)', color: 'var(--secondary)', fontWeight: 600 }}>{item}</span>
                                ))}
                                {(p.sksItems || []).slice(0, 2).map(item => (
                                  <span key={item} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--info)', fontWeight: 600 }}>{item}</span>
                                ))}
                                {p.totalValue > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>{fmtCurrency(p.totalValue)}</span>}
                                <span style={{ fontSize: 11, fontWeight: 600, color: p.kabadiwala ? 'var(--secondary)' : 'var(--text-muted)' }}>{p.kabadiwala || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-cards">
            {filtered.map(d => {
              const segCfg = SEGMENT_CONFIG[d.segment] || SEGMENT_CONFIG['Active']
              return (
                <div key={d.id} className="card" style={{ marginBottom: 10, padding: 14, borderLeft: `3px solid ${segCfg.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--primary)', padding: '1px 7px', borderRadius: 4 }}>{d.id}</span>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {d.mobile}
                      </div>
                    </div>
                    <StatusBadge segment={d.segment} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <CategoryBadge category={d.category} />
                  </div>
                  {d.supportContribution?.trim() && (
                    <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 4 }}>❤️ {d.supportContribution}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} /> {[d.society, d.sector, d.city].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
                    <span>Last: {d.lastPickup ? fmtDate(d.lastPickup) : '—'}</span>
                    <span>{d.totalPickups} pickups</span>
                    {d.sksCount > 0 && <span style={{ color: 'var(--info)' }}>SKS: {d.sksCount}</span>}
                    {(d.totalRST || 0) > 0 && <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{fmtCurrency(d.totalRST)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}