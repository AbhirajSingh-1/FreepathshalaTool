import { useState, useEffect } from 'react'
import { CalendarSearch, Truck, X, Users, Car, Download } from 'lucide-react'
import { fetchPickups } from '../services/api'
import { fmtDate, fmtCurrency, pickupStatusColor, paymentStatusColor, exportToExcel } from '../utils/helpers'

export default function KabadiPickups() {
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [filterKab, setFilterKab] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterMode, setFilterMode] = useState('All')

  useEffect(() => {
    fetchPickups().then(data => { setPickups(data); setLoading(false) })
  }, [])

  const kabNames = [...new Set(pickups.map(p => p.kabadiwala).filter(Boolean))]

  const filtered = pickups.filter(p => {
    const matchDate = p.date >= dateFrom && p.date <= dateTo
    const matchKab  = filterKab === 'All' || p.kabadiwala === filterKab
    const matchStat = filterStatus === 'All' || p.status === filterStatus
    const matchMode = filterMode === 'All' || p.pickupMode === filterMode
    return matchDate && matchKab && matchStat && matchMode
  }).sort((a, b) => a.date.localeCompare(b.date))

  // Group by date
  const grouped = filtered.reduce((acc, p) => {
    const key = p.date
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const handleExport = () => {
    exportToExcel(filtered.map(p => ({
      Date: p.date, 'Pickup ID': p.id, Donor: p.donorName, Location: `${p.society}, ${p.sector || ''}, ${p.city}`,
      Mode: p.pickupMode, Type: p.type, Kabadiwala: p.kabadiwala,
      Status: p.status, 'RST Value': p.totalValue, 'Payment Status': p.paymentStatus,
    })), 'KabadiPickups_DateWise')
  }

  return (
    <div className="page-body">
      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label style={{ fontSize: 11.5, fontWeight: 600 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <select value={filterKab} onChange={e => setFilterKab(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="All">All Kabadiwalas</option>
          {kabNames.map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="All">All Status</option>
          {['Completed', 'Pending', 'Postponed', 'Did Not Open Door'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="All">All Modes</option>
          <option value="Individual">Individual</option>
          <option value="Drive">Drive</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ marginLeft: 'auto' }}>
          <Download size={13} /> Export
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '12px 0' }}>
        <strong>{filtered.length}</strong> pickups across <strong>{Object.keys(grouped).length}</strong> days
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CalendarSearch size={24} /></div>
          <h3>No pickups in range</h3>
          <p>Adjust the date range or filters to see pickups.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dayPickups]) => {
            const isPast   = date < new Date().toISOString().slice(0, 10)
            const isToday  = date === new Date().toISOString().slice(0, 10)
            const dayValue = dayPickups.reduce((s, p) => s + (p.totalValue || 0), 0)

            return (
              <div key={date} className="card" style={{ marginBottom: 16 }}>
                {/* Date Header */}
                <div style={{
                  padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border-light)',
                  background: isToday ? 'var(--primary-light)' : isPast ? 'var(--bg)' : 'transparent',
                  borderRadius: 'var(--radius) var(--radius) 0 0',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isToday ? 'var(--primary)' : isPast ? 'var(--border)' : 'var(--info-bg)',
                    color: isToday ? '#fff' : isPast ? 'var(--text-muted)' : 'var(--info)',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}>
                    {new Date(date + 'T00:00:00').getDate()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {fmtDate(date)}{isToday && <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>TODAY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {dayPickups.length} pickup{dayPickups.length > 1 ? 's' : ''}
                      {dayValue > 0 && ` · ₹${dayValue.toLocaleString('en-IN')} RST value`}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {['Completed', 'Pending', 'Postponed'].map(st => {
                      const ct = dayPickups.filter(p => p.status === st).length
                      if (!ct) return null
                      return (
                        <span key={st} className={`badge ${pickupStatusColor(st)}`} style={{ fontSize: 11 }}>
                          {ct} {st}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Pickups for this day */}
                <div>
                  {dayPickups.map((p, i) => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                      borderBottom: i < dayPickups.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.pickupMode === 'Drive' ? <Users size={15} color="var(--info)" /> : <Truck size={15} color="var(--secondary)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.donorName}</div>
                          <span className={`badge ${p.type === 'RST' ? 'badge-success' : p.type === 'SKS' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>{p.type}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.pickupMode}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {p.society}{p.sector && `, ${p.sector}`}{p.city && `, ${p.city}`}
                        </div>
                        {p.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic' }}>{p.notes}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.kabadiwala || '—'}</div>
                        {p.totalValue > 0 && <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>{fmtCurrency(p.totalValue)}</div>}
                      </div>
                      <span className={`badge ${pickupStatusColor(p.status)}`} style={{ flexShrink: 0, fontSize: 11 }}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
      )}
    </div>
  )
}