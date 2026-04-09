import { useState, useEffect } from 'react'
import { Search, CalendarSearch, X, Truck, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { fetchPickups, fetchDonors } from '../services/api'
import { fmtDate, fmtCurrency, pickupStatusColor, paymentStatusColor, exportToExcel } from '../utils/helpers'

export default function CustomerPickups() {
  const [pickups, setPickups]   = useState([])
  const [donors, setDonors]     = useState([])
  const [loading, setLoading]   = useState(true)

  const [search, setSearch]     = useState('')
  const [selectedDonor, setSelectedDonor] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    Promise.all([fetchPickups(), fetchDonors()]).then(([p, d]) => {
      setPickups(p); setDonors(d); setLoading(false)
    })
  }, [])

  const toggleExpand = (donorId) => setExpanded(e => ({ ...e, [donorId]: !e[donorId] }))

  // Filter donors first
  const q = search.toLowerCase()
  const filteredDonors = donors.filter(d =>
    (!q || d.name.toLowerCase().includes(q) || d.mobile.includes(q) || d.society.toLowerCase().includes(q)) &&
    (!selectedDonor || d.id === selectedDonor)
  )

  // For each donor get their pickups
  const getPickupsForDonor = (donorId) => pickups.filter(p => {
    const matchDonor = p.donorId === donorId
    const matchDate  = (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo)
    const matchStat  = filterStatus === 'All' || p.status === filterStatus
    return matchDonor && matchDate && matchStat
  }).sort((a, b) => b.date.localeCompare(a.date))

  const handleExport = () => {
    const rows = filteredDonors.flatMap(d =>
      getPickupsForDonor(d.id).map(p => ({
        Donor: d.name, Mobile: d.mobile, Society: d.society, 'Pickup ID': p.id,
        Date: p.date, Mode: p.pickupMode, Type: p.type, Status: p.status,
        'RST Items': p.rstItems.join(', '), 'SKS Items': p.sksItems.join(', '),
        'RST Value (₹)': p.totalValue, 'Payment Status': p.paymentStatus,
        Kabadiwala: p.kabadiwala, 'Next Date': p.nextDate,
      }))
    )
    exportToExcel(rows, 'CustomerPickups')
  }

  return (
    <div className="page-body">
      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-wrap" style={{ flex: '2 1 200px' }}>
          <Search className="icon" />
          <input placeholder="Search donor by name, mobile, society…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={selectedDonor} onChange={e => setSelectedDonor(e.target.value)} style={{ flex: '1 1 180px' }}>
          <option value="">All Donors</option>
          {donors.filter(d => d.status !== 'Lost').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="All">All Status</option>
          {['Completed', 'Pending', 'Postponed', 'Did Not Open Door'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
          <label style={{ fontSize: 11, fontWeight: 600 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 130px' }}>
          <label style={{ fontSize: 11, fontWeight: 600 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {(dateFrom || dateTo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo('') }}>
            <X size={12} /> Clear Dates
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ marginLeft: 'auto' }}>
          <Download size={13} /> Export
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '12px 0' }}>
        Showing pickups for <strong>{filteredDonors.length}</strong> donor{filteredDonors.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : filteredDonors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Search size={24} /></div>
          <h3>No donors found</h3>
          <p>Try adjusting the search or filters.</p>
        </div>
      ) : (
        filteredDonors.map(d => {
          const donorPickups = getPickupsForDonor(d.id)
          const isOpen = expanded[d.id]
          const totalRST = donorPickups.filter(p => p.status === 'Completed').reduce((s, p) => s + (p.totalValue || 0), 0)
          const lastP = donorPickups[0]
          const overdue = d.nextPickup && new Date(d.nextPickup) < new Date() && d.status === 'Active'

          return (
            <div key={d.id} className="card" style={{ marginBottom: 14 }}>
              {/* Donor Summary Row */}
              <div
                style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => toggleExpand(d.id)}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                  {d.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {d.mobile} · {d.society}{d.sector ? `, ${d.sector}` : ''}, {d.city}
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>{donorPickups.length}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pickups</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(totalRST)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RST Donated</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{lastP ? fmtDate(lastP.date) : '—'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Pickup</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: overdue ? 'var(--danger)' : 'inherit' }}>
                      {d.status === 'Lost' ? '—' : fmtDate(d.nextPickup)}
                    </div>
                    <div style={{ fontSize: 10.5, color: overdue ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {overdue ? '⚠ Overdue' : 'Next Pickup'}
                    </div>
                  </div>
                </div>

                <div style={{ marginLeft: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Pickup History */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-light)' }}>
                  {donorPickups.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No pickups found for selected filters
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Pickup ID</th>
                            <th>Date</th>
                            <th>Mode</th>
                            <th>Type</th>
                            <th>RST Items</th>
                            <th>SKS Items</th>
                            <th>RST Value</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Next Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donorPickups.map(p => (
                            <tr key={p.id}>
                              <td><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-muted)' }}>{p.id}</span></td>
                              <td style={{ fontSize: 12.5 }}>{fmtDate(p.date)}</td>
                              <td>
                                <span className="badge badge-muted" style={{ fontSize: 10 }}>{p.pickupMode || 'Individual'}</span>
                              </td>
                              <td>
                                <span className={`badge ${p.type === 'RST' ? 'badge-success' : p.type === 'SKS' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>{p.type}</span>
                              </td>
                              <td style={{ fontSize: 11.5, color: 'var(--secondary)', maxWidth: 120 }}>
                                {p.rstItems?.length > 0 ? p.rstItems.join(', ') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td style={{ fontSize: 11.5, color: 'var(--info)', maxWidth: 120 }}>
                                {p.sksItems?.length > 0 ? p.sksItems.join(', ') : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {p.totalValue > 0 ? fmtCurrency(p.totalValue) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td><span className={`badge ${pickupStatusColor(p.status)}`} style={{ fontSize: 10 }}>{p.status}</span></td>
                              <td><span className={`badge ${paymentStatusColor(p.paymentStatus)}`} style={{ fontSize: 10 }}>{p.paymentStatus}</span></td>
                              <td style={{ fontSize: 12 }}>{p.nextDate ? fmtDate(p.nextDate) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}