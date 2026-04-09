import { useState, useEffect } from 'react'
import { AlertTriangle, UserX, Clock, Phone, MapPin, RefreshCw, Search } from 'lucide-react'
import { fetchDonors, updateDonor } from '../services/api'
import { CITIES, CITY_SECTORS, LOST_REASONS, POSTPONE_REASONS } from '../data/mockData'
import { fmtDate, donorStatusColor } from '../utils/helpers'

export default function LostPostponed({ onNav }) {
  const [donors, setDonors]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('all') // 'all' | 'Lost' | 'Postponed'
  const [search, setSearch]   = useState('')
  const [filterCity, setFilterCity]     = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [reactivating, setReactivating] = useState(null)

  useEffect(() => {
    fetchDonors().then(d => { setDonors(d); setLoading(false) })
  }, [])

  const filterSectors = filterCity ? (CITY_SECTORS[filterCity] || []) : []
  const q = search.toLowerCase()

  const inactive = donors.filter(d => {
    if (d.status !== 'Lost' && d.status !== 'Postponed') return false
    const matchTab    = tab === 'all' || d.status === tab
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.mobile.includes(q)
    const matchCity   = !filterCity   || d.city === filterCity
    const matchSector = !filterSector || d.sector === filterSector
    return matchTab && matchSearch && matchCity && matchSector
  })

  const lostCount      = donors.filter(d => d.status === 'Lost').length
  const postponedCount = donors.filter(d => d.status === 'Postponed').length

  const reactivate = async (donor) => {
    setReactivating(donor.id)
    try {
      const updated = await updateDonor(donor.id, { status: 'Active', lostReason: '', nextPickup: '' })
      setDonors(ds => ds.map(d => d.id === donor.id ? updated : d))
    } finally { setReactivating(null) }
  }

  return (
    <div className="page-body">
      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <UserX size={18} />
          </div>
          <div className="stat-value">{lostCount}</div>
          <div className="stat-label">Lost Donors</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Clock size={18} />
          </div>
          <div className="stat-value">{postponedCount}</div>
          <div className="stat-label">Postponed Donors</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="stat-value">{lostCount + postponedCount}</div>
          <div className="stat-label">Total Inactive</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <RefreshCw size={18} />
          </div>
          <div className="stat-value">{donors.filter(d => d.status === 'Active').length}</div>
          <div className="stat-label">Active Donors</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Inactive ({lostCount + postponedCount})
        </button>
        <button className={`tab ${tab === 'Postponed' ? 'active' : ''}`} onClick={() => setTab('Postponed')}>
          Postponed ({postponedCount})
        </button>
        <button className={`tab ${tab === 'Lost' ? 'active' : ''}`} onClick={() => setTab('Lost')}>
          Lost ({lostCount})
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-wrap" style={{ flex: '2 1 200px' }}>
          <Search className="icon" />
          <input
            placeholder="Search by name or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCity}
          onChange={e => { setFilterCity(e.target.value); setFilterSector('') }}
          style={{ flex: '1 1 130px' }}
        >
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          value={filterSector}
          onChange={e => setFilterSector(e.target.value)}
          style={{ flex: '1 1 150px' }}
          disabled={!filterCity}
        >
          <option value="">{filterCity ? 'All Sectors' : 'Select City First'}</option>
          {filterSectors.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '12px 0' }}>
        Showing <strong>{inactive.length}</strong> inactive donor{inactive.length !== 1 ? 's' : ''}
      </div>

      {/* Donor Cards */}
      {loading ? (
        <div className="empty-state"><p>Loading donors…</p></div>
      ) : inactive.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {tab === 'Lost' ? <UserX size={24} /> : <Clock size={24} />}
          </div>
          <h3>No {tab === 'all' ? 'inactive' : tab.toLowerCase()} donors</h3>
          <p>Adjust filters or search to find donors.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {inactive.map(d => (
            <div
              key={d.id}
              className="card"
              style={{
                borderLeft: `4px solid ${d.status === 'Lost' ? 'var(--danger)' : 'var(--warning)'}`,
              }}
            >
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: d.status === 'Lost' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                    color: d.status === 'Lost' ? 'var(--danger)' : 'var(--warning)',
                  }}>
                    {d.name[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
                      <span className={`badge ${donorStatusColor(d.status)}`}>{d.status}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <Phone size={11} /> {d.mobile}
                      &nbsp;·&nbsp;
                      <MapPin size={11} /> {d.society}{d.sector && `, ${d.sector}`}, {d.city}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtDate(d.lastPickup)}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Pickup</div>
                    </div>
                    {d.nextPickup && d.status === 'Postponed' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--warning)' }}>{fmtDate(d.nextPickup)}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rescheduled</div>
                      </div>
                    )}
                  </div>

                  {/* Reactivate action */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => reactivate(d)}
                      disabled={reactivating === d.id}
                    >
                      <RefreshCw size={12} />
                      {reactivating === d.id ? 'Reactivating…' : 'Reactivate'}
                    </button>
                  </div>
                </div>

                {/* Reason banner */}
                {(d.lostReason || d.postponeReason || d.notes) && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 14px',
                    background: d.status === 'Lost' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: d.status === 'Lost' ? 'var(--danger)' : '#92400E',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                    <span>
                      {d.status === 'Lost' && d.lostReason && (
                        <><strong>Reason: </strong>{d.lostReason}. </>
                      )}
                      {d.notes && d.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}