/**
 * RaddiMaster.jsx — Admin-only master data sheet
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCE: AppContext.raddiRecords — derived live from completed pickups.
 * PAYMENT SYNC: When payment is recorded in Payments page, it reflects here
 *               immediately (no page reload needed).
 * NO DUPLICATES: Records are keyed by orderId/pickupId. AppContext prevents
 *                duplicate insertion.
 */
import { useState, useMemo } from 'react'
import {
  Search, SlidersHorizontal, X, Download,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Weight, IndianRupee, TrendingUp, Package,
  MapPin, Hash, Truck, Users, Clock, CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmtDate, fmtCurrency, exportToExcel } from '../utils/helpers'
import { CITY_SECTORS } from '../data/mockData'

const PAGE_SIZE = 15

// ── Status badge configs ──────────────────────────────────────────────────────
const PAYMENT_BADGE = {
  'Received':       { bg: 'var(--secondary-light)', color: 'var(--secondary)', dot: 'var(--secondary)' },
  'Yet to Receive': { bg: 'var(--warning-bg)',       color: '#92400E',          dot: 'var(--warning)' },
  'Write-off':      { bg: 'var(--danger-bg)',        color: 'var(--danger)',    dot: 'var(--danger)' },
}

const ORDER_BADGE = {
  'Completed': { bg: 'var(--secondary-light)', color: 'var(--secondary)' },
  'Pending':   { bg: 'var(--info-bg)',          color: 'var(--info)' },
  'Postponed': { bg: 'var(--warning-bg)',       color: '#92400E' },
  'Cancelled': { bg: 'var(--danger-bg)',        color: 'var(--danger)' },
}

const TYPE_BADGE = {
  'RST':     { bg: 'var(--secondary-light)', color: 'var(--secondary)' },
  'SKS':     { bg: 'var(--info-bg)',          color: 'var(--info)' },
  'RST+SKS': { bg: 'var(--warning-bg)',       color: '#92400E' },
}

function Badge({ label, cfg }) {
  const c = cfg || { bg: 'var(--border-light)', color: 'var(--text-muted)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      background: c.bg, color: c.color,
    }}>
      {c.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
      {label}
    </span>
  )
}

// ── Date preset helper ────────────────────────────────────────────────────────
function getPresetRange(preset) {
  const t = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  if (preset === 'today') return { from: fmt(t), to: fmt(t) }
  if (preset === 'last7') { const d = new Date(t); d.setDate(d.getDate() - 7); return { from: fmt(d), to: fmt(t) } }
  if (preset === 'month') return { from: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-01`, to: fmt(t) }
  return { from: '', to: '' }
}

// ── Monthly analytics breakdown ───────────────────────────────────────────────
function MonthlyBreakdown({ data }) {
  const monthly = useMemo(() => {
    const m = {}
    data.forEach(r => {
      const key = (r.pickupDate || '').slice(0, 7)
      if (!key) return
      if (!m[key]) m[key] = { month: key, orders: 0, kg: 0, amount: 0, received: 0 }
      m[key].orders++
      m[key].kg     += r.totalKg     || 0
      m[key].amount += r.totalAmount || 0
      if (r.paymentStatus === 'Received') m[key].received += r.totalAmount || 0
    })
    return Object.values(m).sort((a, b) => b.month.localeCompare(a.month))
  }, [data])

  if (!monthly.length) return null

  const grand = monthly.reduce((s, m) => ({
    orders: s.orders + m.orders, kg: s.kg + m.kg,
    amount: s.amount + m.amount, received: s.received + m.received,
  }), { orders: 0, kg: 0, amount: 0, received: 0 })

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <TrendingUp size={16} color="var(--primary)" />
        <div className="card-title">Monthly Breakdown</div>
        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)' }}>{monthly.length} months</span>
      </div>
      <div className="table-wrap" style={{ border:'none', boxShadow:'none', borderRadius:0 }}>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Orders</th>
              <th>Weight (kg)</th>
              <th>RST Revenue</th>
              <th>Received</th>
              <th>Pending</th>
              <th>Collection %</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(m => {
              const pending = m.amount - m.received
              const pct = m.amount > 0 ? Math.round((m.received / m.amount) * 100) : 0
              return (
                <tr key={m.month}>
                  <td style={{ fontFamily:'monospace', fontWeight:700 }}>{m.month}</td>
                  <td><span style={{ fontWeight:700, color:'var(--primary)' }}>{m.orders}</span></td>
                  <td>{m.kg.toFixed(1)} kg</td>
                  <td style={{ fontWeight:700 }}>{fmtCurrency(m.amount)}</td>
                  <td style={{ color:'var(--secondary)', fontWeight:700 }}>{fmtCurrency(m.received)}</td>
                  <td style={{ color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: pending > 0 ? 700 : 400 }}>
                    {pending > 0 ? fmtCurrency(pending) : '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                        <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background: pct === 100 ? 'var(--secondary)' : pct > 50 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, flexShrink:0 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'var(--secondary-light)' }}>
              <td style={{ fontWeight:800, fontSize:13 }}>Total</td>
              <td style={{ fontWeight:800 }}>{grand.orders}</td>
              <td style={{ fontWeight:700 }}>{grand.kg.toFixed(1)} kg</td>
              <td style={{ fontWeight:800, color:'var(--primary)' }}>{fmtCurrency(grand.amount)}</td>
              <td style={{ fontWeight:800, color:'var(--secondary)' }}>{fmtCurrency(grand.received)}</td>
              <td style={{ fontWeight:800, color:'var(--danger)' }}>{fmtCurrency(grand.amount - grand.received)}</td>
              <td style={{ fontWeight:700 }}>
                {grand.amount > 0 ? `${Math.round((grand.received / grand.amount) * 100)}%` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Expandable row detail ────────────────────────────────────────────────────
function RowDetail({ record }) {
  const rstItems  = record.rstItems  || []
  const sksItems  = record.sksItems  || []
  const paid      = record.amountPaid   || 0
  const total     = record.totalAmount  || 0
  const remaining = Math.max(0, total - paid)

  return (
    <tr style={{ background:'var(--bg)' }}>
      <td colSpan={10} style={{ padding:'14px 20px', borderBottom:'2px solid var(--border-light)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>

          {/* RST Items */}
          {rstItems.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--secondary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
                RST Items
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {rstItems.map((item, i) => (
                  <span key={i} style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'var(--secondary-light)', color:'var(--secondary)', fontWeight:600 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SKS Items */}
          {sksItems.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--info)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
                SKS Items (Goods)
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {sksItems.map((item, i) => (
                  <span key={i} style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'var(--info-bg)', color:'var(--info)', fontWeight:600 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payment breakdown */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
              Payment Detail
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>Total Value</div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>{fmtCurrency(total)}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>Received</div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--secondary)' }}>{fmtCurrency(paid)}</div>
              </div>
              {remaining > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>Due</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--danger)' }}>{fmtCurrency(remaining)}</div>
                </div>
              )}
            </div>
            {total > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, width:`${Math.min(100, Math.round((paid/total)*100))}%`, background: paid >= total ? 'var(--secondary)' : paid > 0 ? 'var(--warning)' : 'var(--danger)', transition:'width 0.3s' }} />
                </div>
                <div style={{ fontSize:10.5, color:'var(--text-muted)', marginTop:3 }}>{Math.round((paid/total)*100)}% collected</div>
              </div>
            )}
          </div>

          {/* Kabadiwala */}
          {record.kabadiwalaName && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
                Kabadiwala
              </div>
              <div style={{ fontWeight:600, fontSize:13 }}>{record.kabadiwalaName}</div>
              {record.kabadiwalaPhone && (
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{record.kabadiwalaPhone}</div>
              )}
            </div>
          )}

          {/* Full address */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
              Address
            </div>
            <div style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.5 }}>
              {record.houseNo && <span>{record.houseNo}, </span>}
              {record.society && <span>{record.society}<br /></span>}
              {record.sector && <span>{record.sector}, </span>}
              {record.city && <span>{record.city}</span>}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function RaddiMaster() {
  const { raddiRecords } = useApp()

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search,      setSearch]    = useState('')
  const [filterPay,   setFPay]      = useState('')
  const [filterOrder, setFOrder]    = useState('')
  const [filterKab,   setFKab]      = useState('')
  const [filterType,  setFType]     = useState('')
  const [filterSector,setFSector]   = useState('')
  const [datePreset,  setPreset]    = useState('')
  const [dateFrom,    setDateFrom]  = useState('')
  const [dateTo,      setDateTo]    = useState('')
  const [showFilters, setFilters]   = useState(false)
  const [showMonthly, setMonthly]   = useState(false)
  const [page,        setPage]      = useState(1)
  const [sortKey,     setSortKey]   = useState('pickupDate')
  const [sortDir,     setSortDir]   = useState('desc')
  const [expanded,    setExpanded]  = useState({}) // orderId → bool

  // Unique filter options
  const kabNames = useMemo(() => [...new Set(raddiRecords.map(r => r.kabadiwalaName).filter(Boolean))].sort(), [raddiRecords])
  const sectors  = useMemo(() => [...new Set(raddiRecords.map(r => r.sector).filter(Boolean))].sort(), [raddiRecords])

  const applyPreset = (p) => {
    setPreset(p)
    if (p !== 'custom') { const { from, to } = getPresetRange(p); setDateFrom(from); setDateTo(to) }
    setPage(1)
  }

  const toggleSort = (key) => {
    setSortDir(d => sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'desc')
    setSortKey(key)
    setPage(1)
  }

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Filter + sort
  const q = search.toLowerCase().trim()
  const filtered = useMemo(() => {
    const rows = raddiRecords.filter(r => {
      const mQ   = !q || r.name?.toLowerCase().includes(q) || r.mobile?.includes(q) || r.society?.toLowerCase().includes(q) || r.kabadiwalaName?.toLowerCase().includes(q) || r.orderId?.toLowerCase().includes(q)
      const mPay = !filterPay    || r.paymentStatus === filterPay
      const mOrd = !filterOrder  || r.orderStatus   === filterOrder
      const mKab = !filterKab    || r.kabadiwalaName === filterKab
      const mTyp = !filterType   || r.type === filterType
      const mSec = !filterSector || r.sector === filterSector
      const mF   = !dateFrom || (r.pickupDate || '') >= dateFrom
      const mT   = !dateTo   || (r.pickupDate || '') <= dateTo
      return mQ && mPay && mOrd && mKab && mTyp && mSec && mF && mT
    })

    rows.sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [raddiRecords, q, filterPay, filterOrder, filterKab, filterType, filterSector, dateFrom, dateTo, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Aggregate KPIs
  const kpis = useMemo(() => ({
    orders:   filtered.length,
    kg:       filtered.reduce((s, r) => s + (r.totalKg     || 0), 0),
    revenue:  filtered.reduce((s, r) => s + (r.totalAmount || 0), 0),
    received: filtered.filter(r => r.paymentStatus === 'Received').reduce((s, r) => s + (r.totalAmount || 0), 0),
    pending:  filtered.filter(r => r.paymentStatus === 'Yet to Receive').reduce((s, r) => s + (r.totalAmount || 0), 0),
  }), [filtered])

  const hasFilters = filterPay || filterOrder || filterKab || filterType || filterSector

  const SortTh = ({ k, children, style: s }) => (
    <th onClick={() => toggleSort(k)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', ...s }}>
      {children}
      {sortKey === k
        ? <span style={{ marginLeft:4, opacity:0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        : <span style={{ marginLeft:4, opacity:0.2 }}>↕</span>}
    </th>
  )

  const handleExport = () => exportToExcel(
    filtered.map(r => ({
      'Order ID':       r.orderId,
      'Pickup Date':    r.pickupDate,
      'Donor Name':     r.name,
      'Mobile':         r.mobile,
      'House No':       r.houseNo,
      'Society':        r.society,
      'Sector':         r.sector,
      'City':           r.city,
      'Type':           r.type,
      'RST Items':      (r.rstItems || []).join(', '),
      'SKS Items':      (r.sksItems || []).join(', '),
      'Total Kg':       r.totalKg,
      'Total Value (₹)': r.totalAmount,
      'Amount Paid (₹)': r.amountPaid || 0,
      'Pending (₹)':    Math.max(0, (r.totalAmount || 0) - (r.amountPaid || 0)),
      'Payment Status': r.paymentStatus,
      'Order Status':   r.orderStatus,
      'Kabadiwala':     r.kabadiwalaName,
      'Kab Phone':      r.kabadiwalaPhone,
    })),
    'RaddiMaster_Export'
  )

  return (
    <div className="page-body">

      {/* ── Page heading ── */}
      <div style={{ marginBottom:20, padding:'12px 16px', background:'var(--secondary-light)', borderRadius:'var(--radius)', border:'1px solid rgba(27,94,53,0.15)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Package size={20} color="white" />
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--secondary)' }}>Raddi Master</div>
          <div style={{ fontSize:12, color:'var(--secondary)', opacity:0.7 }}>
            Complete pickup ledger · {raddiRecords.length} total records · Updates live as pickups are recorded
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={handleExport}>
          <Download size={13} /> Export All
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stat-grid" style={{ marginBottom:16 }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Hash size={18}/></div>
          <div className="stat-value">{kpis.orders}</div>
          <div className="stat-label">Total Orders</div>
          {filtered.length < raddiRecords.length && (
            <div style={{ fontSize:10.5, color:'var(--info)', marginTop:4 }}>of {raddiRecords.length} total</div>
          )}
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ fontSize:11, fontWeight:800, color:'var(--secondary)', background:'var(--secondary-light)' }}>kg</div>
          <div className="stat-value">{kpis.kg.toFixed(1)}</div>
          <div className="stat-label">Weight Collected</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><IndianRupee size={18}/></div>
          <div className="stat-value">{fmtCurrency(kpis.revenue)}</div>
          <div className="stat-label">Total RST Value</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle size={18}/></div>
          <div className="stat-value">{fmtCurrency(kpis.received)}</div>
          <div className="stat-label">Amount Received</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><Clock size={18}/></div>
          <div className="stat-value">{fmtCurrency(kpis.pending)}</div>
          <div className="stat-label">Pending Collection</div>
        </div>
      </div>

      {/* ── Date presets ── */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>Period:</span>
        {[['', 'All Time'], ['today','Today'], ['last7','Last 7 Days'], ['month','This Month'], ['custom','Custom']].map(([v, label]) => (
          <button key={v} className={`btn btn-sm ${datePreset === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => applyPreset(v)}>
            {label}
          </button>
        ))}
        {datePreset === 'custom' && (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} style={{ width:140 }} />
            <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1) }} style={{ width:140 }} />
          </div>
        )}
        <button className={`btn btn-ghost btn-sm ${showMonthly ? 'btn-outline' : ''}`} style={{ marginLeft:'auto' }} onClick={() => setMonthly(m => !m)}>
          {showMonthly ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          Monthly View
        </button>
      </div>

      {showMonthly && <MonthlyBreakdown data={filtered} />}

      {/* ── Search + filter bar ── */}
      <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:'1 1 220px', minWidth:0 }}>
          <Search className="icon" />
          <input
            placeholder="Search name, mobile, society, order ID, kabadiwala…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button
          className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`}
          onClick={() => setFilters(f => !f)}
          style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}
        >
          <SlidersHorizontal size={13} />
          {hasFilters
            ? <span style={{ background:'var(--primary)', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {[filterPay,filterOrder,filterKab,filterType,filterSector].filter(Boolean).length}
              </span>
            : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8, background:'var(--bg)', borderRadius:10, padding:12, border:'1px solid var(--border-light)', marginBottom:12 }}>
          <select value={filterPay}    onChange={e => { setFPay(e.target.value);    setPage(1) }} style={{ fontSize:12.5 }}>
            <option value="">All Payment Status</option>
            <option value="Received">Received</option>
            <option value="Yet to Receive">Yet to Receive</option>
            <option value="Write-off">Write-off</option>
          </select>
          <select value={filterOrder}  onChange={e => { setFOrder(e.target.value);  setPage(1) }} style={{ fontSize:12.5 }}>
            <option value="">All Order Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={filterType}   onChange={e => { setFType(e.target.value);   setPage(1) }} style={{ fontSize:12.5 }}>
            <option value="">All Types</option>
            <option value="RST">RST</option>
            <option value="SKS">SKS</option>
            <option value="RST+SKS">RST+SKS</option>
          </select>
          <select value={filterKab}    onChange={e => { setFKab(e.target.value);    setPage(1) }} style={{ fontSize:12.5 }}>
            <option value="">All Kabadiwalas</option>
            {kabNames.map(k => <option key={k}>{k}</option>)}
          </select>
          <select value={filterSector} onChange={e => { setFSector(e.target.value); setPage(1) }} style={{ fontSize:12.5 }}>
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize:11.5 }}
              onClick={() => { setFPay(''); setFOrder(''); setFKab(''); setFType(''); setFSector(''); setPage(1) }}>
              <X size={11} /> Clear All
            </button>
          )}
        </div>
      )}

      {/* Record count */}
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12.5, color:'var(--text-muted)', marginBottom:10 }}>
        <span>
          <strong style={{ color:'var(--text-primary)' }}>{filtered.length}</strong> records
          {filtered.length < raddiRecords.length && <span> (of {raddiRecords.length} total)</span>}
        </span>
        <span style={{ marginLeft:'auto' }}>Page {page}/{totalPages}</span>
      </div>

      {/* ── Main Table ── */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding:60 }}>
          <div className="empty-icon"><Package size={24} /></div>
          <h3>No records found</h3>
          <p>Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width:28 }}></th>
                  <SortTh k="orderId">Order ID</SortTh>
                  <SortTh k="pickupDate">Date</SortTh>
                  <SortTh k="name">Donor</SortTh>
                  <th>Location</th>
                  <th>Type</th>
                  <SortTh k="totalKg">Weight</SortTh>
                  <SortTh k="totalAmount">Value (₹)</SortTh>
                  <th>Kabadiwala</th>
                  <SortTh k="paymentStatus">Payment</SortTh>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => {
                  const isOpen = !!expanded[r.orderId || r.pickupId]
                  const payDue = Math.max(0, (r.totalAmount||0) - (r.amountPaid||0))
                  return [
                    <tr
                      key={r.orderId || r.pickupId}
                      style={{ cursor:'pointer' }}
                      onClick={() => toggleExpand(r.orderId || r.pickupId)}
                    >
                      {/* Expand toggle */}
                      <td style={{ textAlign:'center', color:'var(--text-muted)', padding:'11px 6px' }}>
                        {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </td>

                      {/* Order ID */}
                      <td>
                        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--primary)', background:'var(--primary-light)', padding:'2px 7px', borderRadius:5 }}>
                          {r.orderId || r.pickupId || '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ whiteSpace:'nowrap', fontSize:12.5 }}>{fmtDate(r.pickupDate)}</td>

                      {/* Donor */}
                      <td>
                        <div style={{ fontWeight:700, fontSize:13 }}>{r.name}</div>
                        <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{r.mobile}</div>
                      </td>

                      {/* Location */}
                      <td>
                        <div style={{ fontSize:12.5, fontWeight:600 }}>{r.society || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{[r.sector, r.city].filter(Boolean).join(', ')}</div>
                      </td>

                      {/* Type */}
                      <td>
                        <Badge label={r.type || 'RST'} cfg={TYPE_BADGE[r.type] || TYPE_BADGE['RST']} />
                      </td>

                      {/* Weight */}
                      <td style={{ fontWeight:600, whiteSpace:'nowrap' }}>
                        {r.totalKg > 0 ? `${r.totalKg} kg` : <span style={{ color:'var(--text-muted)' }}>—</span>}
                      </td>

                      {/* Value */}
                      <td>
                        <div style={{ fontWeight:700 }}>{r.totalAmount > 0 ? fmtCurrency(r.totalAmount) : '—'}</div>
                        {payDue > 0 && (
                          <div style={{ fontSize:11, color:'var(--danger)', fontWeight:600 }}>Due: {fmtCurrency(payDue)}</div>
                        )}
                      </td>

                      {/* Kabadiwala */}
                      <td style={{ fontSize:12.5 }}>{r.kabadiwalaName || '—'}</td>

                      {/* Payment */}
                      <td onClick={e => e.stopPropagation()}>
                        <Badge label={r.paymentStatus || 'Yet to Receive'} cfg={PAYMENT_BADGE[r.paymentStatus] || PAYMENT_BADGE['Yet to Receive']} />
                      </td>
                    </tr>,

                    // Expanded detail row
                    isOpen && <RowDetail key={`${r.orderId}-detail`} record={r} />,
                  ]
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-cards">
            {pageRows.map(r => {
              const payDue = Math.max(0, (r.totalAmount||0) - (r.amountPaid||0))
              return (
                <div key={r.orderId || r.pickupId} className="card" style={{ marginBottom:10, padding:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'var(--primary)', background:'var(--primary-light)', padding:'2px 7px', borderRadius:5 }}>
                        {r.orderId || r.pickupId}
                      </span>
                      <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>{r.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.mobile}</div>
                    </div>
                    <Badge label={r.paymentStatus || 'Yet to Receive'} cfg={PAYMENT_BADGE[r.paymentStatus] || PAYMENT_BADGE['Yet to Receive']} />
                  </div>
                  <div style={{ fontSize:12.5, color:'var(--text-secondary)', marginBottom:6 }}>
                    <MapPin size={11} style={{ verticalAlign:'middle', marginRight:3 }} />
                    {[r.society, r.sector, r.city].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:12, flexWrap:'wrap' }}>
                    <span><strong>{fmtDate(r.pickupDate)}</strong></span>
                    {r.totalKg > 0 && <span>{r.totalKg} kg</span>}
                    {r.totalAmount > 0 && <span style={{ fontWeight:700, color:'var(--primary)' }}>{fmtCurrency(r.totalAmount)}</span>}
                    {payDue > 0 && <span style={{ color:'var(--danger)', fontWeight:600 }}>Due: {fmtCurrency(payDue)}</span>}
                    <Badge label={r.type || 'RST'} cfg={TYPE_BADGE[r.type] || TYPE_BADGE['RST']} />
                  </div>
                  {r.kabadiwalaName && (
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                      Kabadiwala: {r.kabadiwalaName}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, marginTop:16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}