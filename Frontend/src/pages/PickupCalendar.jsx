import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Truck, Clock, AlertTriangle, RefreshCw,
  CalendarDays, Plus, X, Download, Filter, CheckSquare, Square,
  IndianRupee, Users, Search,
} from 'lucide-react'
import { fetchPickups, fetchDonors, fetchKabadiwalas, createPickup, updatePickup } from '../services/api'
import { fmtDate, fmtCurrency, pickupStatusColor, exportToExcel } from '../utils/helpers'
import {
  PICKUP_STATUSES, PICKUP_MODES, CITIES, CITY_SECTORS,
  RST_ITEMS, SKS_ITEMS, POSTPONE_REASONS,
} from '../data/mockData'

// ── calendar helpers ─────────────────────────────────────────────────────
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay()
  const last  = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= last; d++) cells.push(d)
  return cells
}

function toYMD(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const today = () => new Date().toISOString().slice(0, 10)

// ── empty schedule form ─────────────────────────────────────────────────
const EMPTY_FORM = {
  donorId: '', donorName: '', society: '', sector: '', city: '',
  date: today(), status: 'Pending', pickupMode: 'Individual',
  type: 'RST', rstItems: [], sksItemsMap: {},
  totalValue: '', amountPaid: 0, paymentStatus: 'Not Paid',
  kabadiwala: '', kabadiMobile: '',
  nextDate: '', postponeReason: '', notes: '',
}

// ── RST chip selector ────────────────────────────────────────────────────
function RSTChips({ selected, onChange }) {
  const toggle = (item) =>
    onChange(selected.includes(item) ? selected.filter(i => i !== item) : [...selected, item])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {RST_ITEMS.map(item => {
        const on = selected.includes(item)
        return (
          <button key={item} type="button" onClick={() => toggle(item)} style={{
            display:'flex',alignItems:'center',gap:4,padding:'4px 10px',
            borderRadius:20,fontSize:12,cursor:'pointer',
            border:`1.5px solid ${on?'var(--primary)':'var(--border)'}`,
            background:on?'var(--primary-light)':'transparent',
            color:on?'var(--primary)':'var(--text-secondary)',
            fontWeight:on?600:400,transition:'all 0.15s',
          }}>
            {on?<CheckSquare size={11}/>:<Square size={11}/>}{item}
          </button>
        )
      })}
    </div>
  )
}

// ── Export helpers ───────────────────────────────────────────────────────
function exportDateWise(pickups, filename = 'PickupCalendar_Export') {
  exportToExcel(
    pickups.map(p => ({
      'Pickup ID':      p.id,
      'Donor Name':     p.donorName,
      'Date':           p.date,
      'Sector':         p.sector || '',
      'Society':        p.society || '',
      'City':           p.city || '',
      'Mode':           p.pickupMode || '',
      'Type':           p.type || '',
      'Kabadiwala':     p.kabadiwala || '',
      'Status':         p.status,
      'Payment Status': p.paymentStatus,
      'Total Value(₹)': p.totalValue || 0,
      'RST Items':      (p.rstItems||[]).join(', '),
      'SKS Items':      (p.sksItems||[]).join(', '),
      'Notes':          p.notes || '',
    })),
    filename
  )
}

function exportCSV(pickups, filename = 'PickupCalendar_Export') {
  const headers = [
    'Pickup ID','Donor Name','Date','Sector','Society','City','Mode',
    'Type','Kabadiwala','Status','Payment Status','Total Value(₹)','RST Items','SKS Items','Notes'
  ]
  const rows = pickups.map(p => [
    p.id, p.donorName, p.date, p.sector||'', p.society||'', p.city||'',
    p.pickupMode||'', p.type||'', p.kabadiwala||'', p.status,
    p.paymentStatus, p.totalValue||0,
    (p.rstItems||[]).join('|'), (p.sksItems||[]).join('|'), p.notes||''
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${filename}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function PickupCalendar({ onNav }) {
  const [pickups,     setPickups]     = useState([])
  const [donors,      setDonors]      = useState([])
  const [kabadiwalas, setKabadiwalas] = useState([])
  const [loading,     setLoading]     = useState(true)

  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [selected, setSelected] = useState(null)   // 'YYYY-MM-DD'

  // Filters
  const [filterKab,    setFilterKab]    = useState('All')
  const [filterSector, setFilterSector] = useState('')
  const [filterCity,   setFilterCity]   = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showFilters,  setShowFilters]  = useState(false)
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')

  // Schedule modal
  const [schedModal, setSchedModal] = useState(false)
  const [editPickup, setEditPickup] = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)

  // Export dropdown
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    Promise.all([fetchPickups(), fetchDonors(), fetchKabadiwalas()])
      .then(([p, d, k]) => {
        setPickups(p); setDonors(d); setKabadiwalas(k); setLoading(false)
      })
  }, [])

  const todayYMD      = today()
  const kabNames      = [...new Set(pickups.map(p => p.kabadiwala).filter(Boolean))]
  const formSectors   = CITY_SECTORS[form.city] || []
  const filterSectors = CITY_SECTORS[filterCity] || []
  const activeFilters = filterKab!=='All'||filterSector||filterCity||filterStatus!=='All'||dateFrom||dateTo

  // Apply filters to all pickups
  const filteredPickups = pickups.filter(p => {
    const matchKab    = filterKab === 'All' || p.kabadiwala === filterKab
    const matchSector = !filterSector || p.sector === filterSector
    const matchCity   = !filterCity   || p.city   === filterCity
    const matchStatus = filterStatus === 'All' || p.status === filterStatus
    const matchFrom   = !dateFrom || p.date >= dateFrom
    const matchTo     = !dateTo   || p.date <= dateTo
    return matchKab && matchSector && matchCity && matchStatus && matchFrom && matchTo
  })

  // Build pickupMap from filtered pickups
  const pickupMap = {}
  filteredPickups.forEach(p => {
    if (!pickupMap[p.date]) pickupMap[p.date] = []
    pickupMap[p.date].push(p)
  })

  const cells           = getCalendarDays(year, month)
  const selectedPickups = selected ? (pickupMap[selected] || []) : []
  const overdue         = filteredPickups.filter(p => p.status === 'Pending' && p.date < todayYMD)

  const getDayClass = (ymd) => {
    const ps = pickupMap[ymd] || []
    if (!ps.length) return null
    const statuses = ps.map(p => p.status)
    if (statuses.includes('Pending') && ymd < todayYMD) return 'overdue'
    if (statuses.every(s => s === 'Completed'))           return 'completed'
    if (statuses.includes('Pending'))                     return 'upcoming'
    if (statuses.includes('Postponed'))                   return 'postponed'
    return 'has-pickups'
  }

  const daySummary = (ps) => ({
    total:     ps.length,
    completed: ps.filter(p => p.status === 'Completed').length,
    pending:   ps.filter(p => p.status === 'Pending' && p.date >= todayYMD).length,
    overdue:   ps.filter(p => p.status === 'Pending'  && p.date < todayYMD).length,
    postponed: ps.filter(p => p.status === 'Postponed').length,
    value:     ps.reduce((s, p) => s + (p.totalValue || 0), 0),
  })

  const prevMonth = () => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextMonth = () => { if (month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  // ── Schedule / Edit ──────────────────────────────────────────────────
  const openSchedule = (preDate = null, pickup = null) => {
    setEditPickup(pickup)
    setForm(pickup
      ? { ...EMPTY_FORM, ...pickup, sksItemsMap: {} }
      : { ...EMPTY_FORM, date: preDate || todayYMD }
    )
    setSchedModal(true)
  }
  const closeSchedule = () => { setSchedModal(false); setEditPickup(null) }

  const setField = (key, val) => setForm(f => {
    const next = { ...f, [key]: val }
    if (key === 'city') next.sector = ''
    if (key === 'donorId') {
      const d = donors.find(d => d.id === val)
      if (d) { next.donorName=d.name; next.society=d.society||''; next.sector=d.sector||''; next.city=d.city||'' }
    }
    if (key === 'kabadiwala') {
      const k = kabadiwalas.find(k => k.name === val)
      next.kabadiMobile = k?.mobile || ''
    }
    return next
  })

  const save = async () => {
    if (!form.donorId || !form.date) return
    setSaving(true)
    try {
      const rstArr = form.rstItems || []
      const sksArr = Object.keys(form.sksItemsMap || {})
      const payload = {
        ...form,
        rstItems:       rstArr,
        sksItems:       sksArr,
        sksItemDetails: form.sksItemsMap || {},
        totalValue:     Number(form.totalValue) || 0,
        amountPaid:     Number(form.amountPaid)  || 0,
        type: rstArr.length>0 && sksArr.length>0 ? 'RST+SKS'
            : rstArr.length>0 ? 'RST'
            : sksArr.length>0 ? 'SKS' : 'RST',
      }
      if (editPickup) {
        const updated = await updatePickup(editPickup.id, payload)
        setPickups(ps => ps.map(p => p.id === editPickup.id ? updated : p))
      } else {
        const newP = await createPickup(payload)
        setPickups(ps => [newP, ...ps])
      }
      closeSchedule()
    } finally { setSaving(false) }
  }

  // ── Export ───────────────────────────────────────────────────────────
  const exportSelected = (fmt) => {
    const data = selected ? (pickupMap[selected] || []) : filteredPickups
    const name = selected
      ? `Pickups_${selected}`
      : `Pickups_${year}-${String(month+1).padStart(2,'0')}`
    fmt === 'csv' ? exportCSV(data, name) : exportDateWise(data, name)
    setShowExport(false)
  }

  // ── month summary ────────────────────────────────────────────────────
  const monthStart = toYMD(year, month, 1)
  const monthEnd   = toYMD(year, month, new Date(year, month+1, 0).getDate())
  const monthPs    = filteredPickups.filter(p => p.date >= monthStart && p.date <= monthEnd)
  const ms         = daySummary(monthPs)

  return (
    <div className="page-body">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        {/* Legend */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          {[
            {label:'Completed',color:'var(--secondary)'},
            {label:'Upcoming', color:'var(--info)'},
            {label:'Overdue',  color:'var(--danger)'},
            {label:'Postponed',color:'var(--warning)'},
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5 }}>
              <div style={{ width:10,height:10,borderRadius:3,background:item.color }} />
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className={`btn btn-sm ${showFilters?'btn-outline':'btn-ghost'}`}
            onClick={() => setShowFilters(f=>!f)}>
            <Filter size={13} /> Filters {activeFilters && <span className="nav-badge" style={{ marginLeft:4 }}>•</span>}
          </button>
          <div style={{ position:'relative' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowExport(e=>!e)}>
              <Download size={13} /> Export
            </button>
            {showExport && (
              <>
                <div style={{ position:'fixed',inset:0,zIndex:40 }} onClick={() => setShowExport(false)} />
                <div style={{
                  position:'absolute',right:0,top:'calc(100% + 6px)',zIndex:50,
                  background:'var(--surface)',border:'1px solid var(--border)',
                  borderRadius:'var(--radius)',boxShadow:'var(--shadow-md)',minWidth:210,padding:8,
                }}>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',padding:'4px 8px',
                    textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:4 }}>
                    {selected ? `Export ${fmtDate(selected)}` : 'Export Filtered View'}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start' }}
                    onClick={() => exportSelected('xlsx')}>
                    📊 Excel (.xlsx)
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'flex-start' }}
                    onClick={() => exportSelected('csv')}>
                    📄 CSV (.csv)
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openSchedule(selected)}>
            <Plus size={14} /> Schedule Pickup
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="filter-bar" style={{ flexWrap:'wrap',gap:10,marginBottom:16 }}>
          <select value={filterKab} onChange={e => setFilterKab(e.target.value)} style={{ flex:'1 1 160px' }}>
            <option value="All">All Kabadiwalas</option>
            {kabNames.map(k => <option key={k}>{k}</option>)}
          </select>
          <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterSector('') }} style={{ flex:'1 1 130px' }}>
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
            disabled={!filterCity} style={{ flex:'1 1 150px' }}>
            <option value="">{filterCity?'All Sectors':'Select City First'}</option>
            {filterSectors.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex:'1 1 140px' }}>
            <option value="All">All Status</option>
            {PICKUP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="form-group" style={{ margin:0,flex:'1 1 120px' }}>
            <label style={{ fontSize:11,fontWeight:600 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0,flex:'1 1 120px' }}>
            <label style={{ fontSize:11,fontWeight:600 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {activeFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setFilterKab('All');setFilterSector('');setFilterCity('');
              setFilterStatus('All');setDateFrom('');setDateTo('')
            }}>
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Overdue alert ───────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div className="alert-strip alert-warning" style={{ marginBottom:16 }}>
          <AlertTriangle size={15} style={{ flexShrink:0 }} />
          <div>
            <strong>{overdue.length} overdue pickup{overdue.length>1?'s':''}:</strong>{' '}
            {overdue.slice(0,4).map(p => `${p.donorName} (${p.date})`).join(', ')}
            {overdue.length>4 && ` +${overdue.length-4} more`}.{' '}
            <button onClick={() => onNav?.('pickups')}
              style={{ background:'none',border:'none',textDecoration:'underline',cursor:'pointer',color:'inherit',fontWeight:600 }}>
              Manage →
            </button>
          </div>
        </div>
      )}

      {/* ── Calendar + Detail ───────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 360px':'1fr', gap:20, alignItems:'start' }}>

        {/* Calendar card */}
        <div className="card">
          <div className="card-header" style={{ justifyContent:'space-between' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <div style={{ textAlign:'center', flex:1 }}>
              <div className="card-title" style={{ marginBottom:0 }}>{MONTHS[month]} {year}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          <div className="card-body" style={{ padding:16 }}>
            {/* Day headers */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:'center',fontSize:11,fontWeight:700,color:'var(--text-muted)',padding:'4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const ymd        = toYMD(year, month, day)
                const cls        = getDayClass(ymd)
                const isToday    = ymd === todayYMD
                const isSelected = ymd === selected
                const ps         = pickupMap[ymd] || []

                const bg = isSelected ? 'var(--primary)'
                  : isToday           ? 'var(--primary-light)'
                  : cls === 'overdue'    ? 'var(--danger-bg)'
                  : cls === 'completed'  ? 'var(--secondary-light)'
                  : cls === 'upcoming'   ? 'var(--info-bg)'
                  : cls === 'postponed'  ? 'var(--warning-bg)'
                  : 'transparent'

                const dotCol = isSelected ? 'rgba(255,255,255,0.85)'
                  : cls === 'completed' ? 'var(--secondary)'
                  : cls === 'upcoming'  ? 'var(--info)'
                  : cls === 'overdue'   ? 'var(--danger)'
                  : cls === 'postponed' ? 'var(--warning)'
                  : 'var(--primary)'

                return (
                  <div key={ymd}
                    onClick={() => setSelected(isSelected ? null : ymd)}
                    style={{
                      minHeight:58, borderRadius:8, padding:'6px 4px',
                      cursor: ps.length ? 'pointer' : 'default',
                      background: bg,
                      border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
                      transition:'all 0.15s',
                    }}
                  >
                    <div style={{
                      textAlign:'center', fontSize:13.5,
                      fontWeight: isToday||isSelected ? 700 : 400,
                      color: isSelected ? 'white' : isToday ? 'var(--primary)' : 'var(--text-primary)',
                    }}>
                      {day}
                    </div>
                    {ps.length > 0 && (
                      <>
                        <div style={{ display:'flex',justifyContent:'center',gap:2,marginTop:4,flexWrap:'wrap' }}>
                          {ps.slice(0,3).map((_,j) => (
                            <div key={j} style={{ width:5,height:5,borderRadius:'50%',background:dotCol }} />
                          ))}
                          {ps.length>3 && <div style={{ fontSize:9,color:dotCol,fontWeight:700 }}>+{ps.length-3}</div>}
                        </div>
                        <div style={{ textAlign:'center',fontSize:9.5,color:dotCol,marginTop:2,fontWeight:700 }}>
                          {ps.length}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Month summary footer */}
          <div style={{ borderTop:'1px solid var(--border-light)',padding:'10px 20px',
            display:'flex',gap:18,flexWrap:'wrap',alignItems:'center' }}>
            <span style={{ fontSize:12 }}>
              <strong>{ms.total}</strong>
              <span style={{ color:'var(--text-muted)' }}> pickups this month</span>
            </span>
            {ms.completed>0 && <span style={{ fontSize:12 }}><span style={{ color:'var(--secondary)',fontWeight:700 }}>{ms.completed}</span> <span style={{ color:'var(--text-muted)' }}>done</span></span>}
            {ms.pending>0   && <span style={{ fontSize:12 }}><span style={{ color:'var(--info)',fontWeight:700 }}>{ms.pending}</span> <span style={{ color:'var(--text-muted)' }}>upcoming</span></span>}
            {ms.overdue>0   && <span style={{ fontSize:12 }}><span style={{ color:'var(--danger)',fontWeight:700 }}>{ms.overdue}</span> <span style={{ color:'var(--text-muted)' }}>overdue</span></span>}
            {ms.value>0     && <span style={{ fontSize:12,marginLeft:'auto' }}><span style={{ color:'var(--primary)',fontWeight:700 }}>{fmtCurrency(ms.value)}</span> <span style={{ color:'var(--text-muted)' }}>RST value</span></span>}
          </div>
        </div>

        {/* Day detail panel */}
        {selected && (
          <div className="card" style={{ position:'sticky',top:'calc(var(--header-h) + 16px)' }}>
            <div className="card-header" style={{ justifyContent:'space-between' }}>
              <div>
                <div className="card-title">{fmtDate(selected)}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)' }}>
                  {selectedPickups.length} pickup{selectedPickups.length!==1?'s':''}
                </div>
              </div>
              <div style={{ display:'flex',gap:6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => openSchedule(selected)}>
                  <Plus size={12} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => exportSelected('xlsx')}>
                  <Download size={13} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Day summary chips */}
            {selectedPickups.length > 0 && (() => {
              const s = daySummary(selectedPickups)
              return (
                <div style={{ padding:'10px 20px',display:'flex',gap:7,flexWrap:'wrap',
                  borderBottom:'1px solid var(--border-light)' }}>
                  {s.completed>0 && <span className="badge badge-success" style={{ fontSize:11 }}>{s.completed} Completed</span>}
                  {s.pending>0   && <span className="badge badge-info"    style={{ fontSize:11 }}>{s.pending} Upcoming</span>}
                  {s.overdue>0   && <span className="badge badge-danger"  style={{ fontSize:11 }}>{s.overdue} Overdue</span>}
                  {s.postponed>0 && <span className="badge badge-warning" style={{ fontSize:11 }}>{s.postponed} Postponed</span>}
                  {s.value>0     && (
                    <span style={{ fontSize:11,fontWeight:700,color:'var(--primary)',marginLeft:'auto' }}>
                      {fmtCurrency(s.value)}
                    </span>
                  )}
                </div>
              )
            })()}

            <div style={{ maxHeight:500,overflowY:'auto',padding:'8px 0' }}>
              {selectedPickups.length === 0 ? (
                <div className="empty-state" style={{ padding:28 }}>
                  <div className="empty-icon"><CalendarDays size={20} /></div>
                  <p>No pickups on this date</p>
                  <button className="btn btn-primary btn-sm" onClick={() => openSchedule(selected)}>
                    <Plus size={13} /> Schedule one
                  </button>
                </div>
              ) : (
                selectedPickups.map((p, i) => {
                  const isOverdue = p.status === 'Pending' && p.date < todayYMD
                  const iconColor = isOverdue ? 'var(--danger)'
                    : p.status === 'Completed' ? 'var(--secondary)'
                    : p.status === 'Postponed' ? 'var(--warning)'
                    : 'var(--info)'
                  const iconBg = isOverdue ? 'var(--danger-bg)'
                    : p.status === 'Completed' ? 'var(--secondary-light)'
                    : p.status === 'Postponed' ? 'var(--warning-bg)'
                    : 'var(--info-bg)'
                  return (
                    <div key={p.id} style={{
                      padding:'12px 20px',
                      borderBottom: i<selectedPickups.length-1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,
                          background:iconBg,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {p.pickupMode==='Drive'
                            ? <Users size={14} color={iconColor} />
                            : <Truck  size={14} color={iconColor} />}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontWeight:600,fontSize:13 }}>{p.donorName}</div>
                          <div style={{ fontSize:11.5,color:'var(--text-muted)' }}>
                            {p.society}{p.sector && `, ${p.sector}`}
                          </div>
                          {p.kabadiwala && (
                            <div style={{ fontSize:11,color:'var(--text-secondary)',marginTop:2 }}>
                              🔧 {p.kabadiwala}
                            </div>
                          )}
                          {p.notes && (
                            <div style={{ fontSize:11,color:'var(--text-muted)',fontStyle:'italic',marginTop:2 }}>
                              {p.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:'right',flexShrink:0 }}>
                          <span className={`badge ${pickupStatusColor(isOverdue?'overdue':p.status)}`}
                            style={{ fontSize:10, ...(isOverdue?{background:'var(--danger-bg)',color:'var(--danger)'}:{}) }}>
                            {isOverdue ? 'Overdue' : p.status}
                          </span>
                          {p.totalValue>0 && (
                            <div style={{ fontSize:11,color:'var(--primary)',fontWeight:700,marginTop:3 }}>
                              {fmtCurrency(p.totalValue)}
                            </div>
                          )}
                          <div style={{ fontSize:10,color:'var(--text-muted)',marginTop:2 }}>{p.type}</div>
                        </div>
                      </div>
                      <div style={{ marginTop:8 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:11,padding:'3px 10px' }}
                          onClick={() => openSchedule(selected, p)}>
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          SCHEDULE / EDIT MODAL
      ════════════════════════════════════════════════════════ */}
      {schedModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && closeSchedule()}>
          <div className="modal" style={{ maxWidth:660,width:'96vw' }}>
            <div className="modal-header">
              <CalendarDays size={18} color="var(--primary)" />
              <div className="modal-title">
                {editPickup ? 'Edit Pickup' : 'Schedule Pickup'}
                {form.date && (
                  <span style={{ fontSize:12,fontWeight:400,color:'var(--text-muted)',marginLeft:8 }}>
                    {fmtDate(form.date)}
                  </span>
                )}
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeSchedule}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight:'74vh',overflowY:'auto' }}>
              <div className="form-grid">

                {/* Donor */}
                <div className="form-group full">
                  <label>Donor <span className="required">*</span></label>
                  <select value={form.donorId} onChange={e => setField('donorId', e.target.value)}>
                    <option value="">Select donor…</option>
                    {donors.filter(d => d.status !== 'Lost').map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.society}, {d.city}</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="form-group">
                  <label>Pickup Date <span className="required">*</span></label>
                  <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Next Pickup Date</label>
                  <input type="date" value={form.nextDate} onChange={e => setField('nextDate', e.target.value)} />
                </div>

                {/* Status + Mode */}
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)}>
                    {PICKUP_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pickup Mode</label>
                  <select value={form.pickupMode} onChange={e => setField('pickupMode', e.target.value)}>
                    {PICKUP_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>

                {form.status === 'Postponed' && (
                  <div className="form-group full">
                    <label>Postpone Reason <span className="required">*</span></label>
                    <select value={form.postponeReason} onChange={e => setField('postponeReason', e.target.value)}>
                      <option value="">Select reason…</option>
                      {POSTPONE_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* Location */}
                <div className="form-group">
                  <label>City</label>
                  <select value={form.city} onChange={e => setField('city', e.target.value)}>
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sector / Area</label>
                  <select value={form.sector} onChange={e => setField('sector', e.target.value)} disabled={!form.city}>
                    <option value="">{form.city ? 'Select Sector' : 'Select City First'}</option>
                    {formSectors.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Kabadiwala */}
                <div className="form-group full">
                  <label>Assign Kabadiwala</label>
                  <select value={form.kabadiwala} onChange={e => setField('kabadiwala', e.target.value)}>
                    <option value="">None / Unassigned</option>
                    {kabadiwalas.map(k => <option key={k.id} value={k.name}>{k.name} — {k.area}</option>)}
                  </select>
                </div>

                {/* RST items */}
                <div className="form-group full">
                  <label style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                    <span className="badge badge-success" style={{ fontSize:10 }}>RST</span>
                    Raddi Se Tarakki Items
                  </label>
                  <RSTChips selected={form.rstItems} onChange={items => setField('rstItems', items)} />
                </div>

                {/* RST value */}
                <div className="form-group">
                  <label>
                    RST Value (₹)
                    <span style={{ fontSize:10,color:'var(--text-muted)',marginLeft:4 }}>(Kabadiwala → FP)</span>
                  </label>
                  <input type="number" min="0" value={form.totalValue}
                    onChange={e => setField('totalValue', e.target.value)} placeholder="0" />
                </div>

                {/* Notes */}
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Any additional notes about this pickup…"
                    style={{ minHeight:60 }} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeSchedule}>Cancel</button>
              <button className="btn btn-primary" onClick={save}
                disabled={saving || !form.donorId || !form.date || (form.status==='Postponed'&&!form.postponeReason)}>
                {saving ? 'Saving…' : editPickup ? 'Save Changes' : 'Schedule Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}