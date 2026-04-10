// Frontend/src/pages/Donors.jsx
import { useState, useEffect, useMemo } from 'react'
import {
  Search, Plus, Edit2, Trash2, X, Phone, MapPin,
  AlertTriangle, SlidersHorizontal, Clock,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  CITIES, CITY_SECTORS, SOCIETIES, DONOR_STATUSES, LOST_REASONS,
} from '../data/mockData'
import { fmtDate, fmtCurrency, donorStatusColor, getDonorHealthStatus, daysSince } from '../utils/helpers'

const EMPTY_FORM = {
  name: '', mobile: '', house: '', society: '',
  city: 'Gurgaon', sector: '', status: 'Active',
  lostReason: '', notes: '',
}

// ── Segmentation config ───────────────────────────────────────────────────────
const SEGMENTS = [
  { id: 'All',         label: 'All',         color: 'var(--text-secondary)' },
  { id: 'Active',      label: 'Active',      color: 'var(--secondary)' },
  { id: 'Pickup Due',  label: 'Pickup Due',  color: 'var(--info)' },
  { id: 'At Risk',     label: 'At Risk',     color: 'var(--warning)' },
  { id: 'Churned',     label: 'Churned',     color: 'var(--text-muted)' },
  { id: 'Postponed',   label: 'Postponed',   color: '#92400E' },
  { id: 'Lost',        label: 'Lost',        color: 'var(--danger)' },
]

function getHealthLabel(donor) {
  if (donor.status === 'Lost')      return 'Lost'
  if (donor.status === 'Postponed') return 'Postponed'
  return getDonorHealthStatus(donor.lastPickup).label
}

// ── Days since badge ──────────────────────────────────────────────────────────
function DaysSinceBadge({ lastPickup }) {
  const days = daysSince(lastPickup)
  if (days === null) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Never picked up</span>
  const color =
    days <= 30 ? 'var(--secondary)' :
    days <= 45 ? 'var(--info)' :
    days <= 60 ? 'var(--warning)' :
    'var(--danger)'
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Clock size={10} />
      {days}d ago
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function Donors({ triggerAddDonor, onAddDonorDone }) {
  const { donors, addDonor, updateDonor, deleteDonor } = useApp()

  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)

  const [search, setSearch]               = useState('')
  const [filterCity, setFilterCity]       = useState('')
  const [filterSector, setFilterSector]   = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterSociety, setFilterSociety] = useState('')
  const [showFilters, setShowFilters]     = useState(false)
  const [activeSeg, setActiveSeg]         = useState('All')

  const sectorOptions = filterCity ? (CITY_SECTORS[filterCity] || []) : []
  const formSectors   = CITY_SECTORS[form.city] || []

  const allSocieties = useMemo(() => [...new Set([
    ...SOCIETIES,
    ...donors.map(d => d.society).filter(Boolean),
  ])].sort(), [donors])

  useEffect(() => {
    if (triggerAddDonor) { openModal(); onAddDonorDone?.() }
  }, [triggerAddDonor])

  const openModal = (donor = null) => {
    setEditing(donor)
    setForm(donor ? { ...EMPTY_FORM, ...donor } : EMPTY_FORM)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null) }

  const setField = (key, val) => setForm(f => {
    const next = { ...f, [key]: val }
    if (key === 'city') next.sector = ''
    return next
  })

  const save = async () => {
    if (!form.name.trim() || !form.mobile.trim()) return
    if (form.status === 'Lost' && !form.lostReason) return
    setSaving(true)
    try {
      editing ? updateDonor(editing.id, form) : addDonor(form)
      closeModal()
    } finally { setSaving(false) }
  }

  const remove = (id) => {
    if (!confirm('Delete this donor?')) return
    deleteDonor(id)
  }

  // ── Segment counts ────────────────────────────────────────────────────────
  const segCounts = useMemo(() => {
    const counts = { All: donors.length }
    donors.forEach(d => {
      const label = getHealthLabel(d)
      counts[label] = (counts[label] || 0) + 1
    })
    return counts
  }, [donors])

  // ── Filtered donors (segment + search + filters) ──────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return donors.filter(d => {
      const segLabel = getHealthLabel(d)
      const matchSeg    = activeSeg === 'All' || segLabel === activeSeg
      const matchQ      = !q || d.name.toLowerCase().includes(q) || d.mobile.includes(q) || d.society?.toLowerCase().includes(q)
      const matchCity   = !filterCity   || d.city === filterCity
      const matchSector = !filterSector || d.sector === filterSector
      const matchStatus = !filterStatus || d.status === filterStatus
      const matchSoc    = !filterSociety || d.society === filterSociety
      return matchSeg && matchQ && matchCity && matchSector && matchStatus && matchSoc
    })
  }, [donors, activeSeg, search, filterCity, filterSector, filterStatus, filterSociety])

  const hasFilters = filterCity || filterSector || filterStatus || filterSociety

  return (
    <div className="page-body">

      {/* ── Segmentation Tab Bar ── */}
      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content', paddingBottom: 2 }}>
          {SEGMENTS.map(seg => {
            const count   = segCounts[seg.id] || 0
            const isActive = activeSeg === seg.id
            return (
              <button
                key={seg.id}
                onClick={() => setActiveSeg(seg.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${isActive ? seg.color : 'var(--border)'}`,
                  background: isActive ? 'var(--surface)' : 'transparent',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                  color: isActive ? seg.color : 'var(--text-muted)',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {seg.label}
                {count > 0 && (
                  <span style={{
                    background: isActive ? seg.color : 'var(--border)',
                    color: isActive ? 'white' : 'var(--text-muted)',
                    fontSize: 10.5, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 20, minWidth: 18, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap', marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              placeholder="Search name, mobile, society…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 13, width: '100%' }}
            />
          </div>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`}
            onClick={() => setShowFilters(f => !f)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 12 }}
          >
            <SlidersHorizontal size={13} />
            {hasFilters
              ? <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
                  {[filterCity, filterSector, filterStatus, filterSociety].filter(Boolean).length}
                </span>
              : 'Filter'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal()} style={{ flexShrink: 0, padding: '6px 10px', fontSize: 12 }}>
            <Plus size={13} /> Add
          </button>
        </div>

        {showFilters && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
            gap: 8, background: 'var(--bg)', borderRadius: 10, padding: 10,
            border: '1px solid var(--border-light)',
          }}>
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterSector('') }} style={{ fontSize: 12 }}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} disabled={!filterCity} style={{ fontSize: 12 }}>
              <option value="">{filterCity ? 'All Sectors' : 'City First'}</option>
              {sectorOptions.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12 }}>
              <option value="">All Status</option>
              {DONOR_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterSociety} onChange={e => setFilterSociety(e.target.value)} style={{ fontSize: 12 }}>
              <option value="">All Societies</option>
              {allSocieties.map(s => <option key={s}>{s}</option>)}
            </select>
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, height: 34 }}
                onClick={() => { setFilterCity(''); setFilterSector(''); setFilterStatus(''); setFilterSociety('') }}
              >
                <X size={11} /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Showing <strong>{filtered.length}</strong> of <strong>{donors.length}</strong> donors
        {activeSeg !== 'All' && <> in <strong>{activeSeg}</strong></>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Search size={24} /></div>
          <h3>No donors found</h3>
          <p>Try adjusting your search, filters, or segment tab.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(d => {
            const health  = getDonorHealthStatus(d.lastPickup)
            const overdue = d.nextPickup && new Date(d.nextPickup) < new Date() && d.status === 'Active'
            const days    = daysSince(d.lastPickup)

            return (
              <div key={d.id} className="card" style={{
                borderLeft: `3px solid ${
                  d.status === 'Lost'      ? 'var(--danger)' :
                  health.label === 'At Risk' ? 'var(--warning)' :
                  health.label === 'Pickup Due' ? 'var(--info)' :
                  health.label === 'Churned'  ? 'var(--text-muted)' :
                  'transparent'
                }`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', flexWrap: 'nowrap' }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--primary)' }}>
                    {d.name[0]}
                  </div>
                  {/* Info */}
                  <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{d.name}</div>
                      <DaysSinceBadge lastPickup={d.lastPickup} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      <Phone size={10} style={{ flexShrink: 0 }} /> {d.mobile}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }} className="truncate">
                      <MapPin size={10} style={{ flexShrink: 0 }} />
                      <span className="truncate">{d.society}{d.sector && `, ${d.sector}`}, {d.city}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openModal(d)}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => remove(d.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Stats strip */}
                <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border-light)', background: 'var(--bg)' }}>
                  {[
                    { label: 'Status',  value: <span className={`badge ${donorStatusColor(d.status)}`} style={{ fontSize: 10 }}>{d.status}</span> },
                    { label: 'Health',  value: <span className={`badge ${health.color}`} style={{ fontSize: 10 }}>{health.label}</span> },
                    { label: 'RST',     value: <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--secondary)' }}>{fmtCurrency(d.totalRST)}</span> },
                    { label: overdue ? '⚠ Overdue' : 'Next', value: <span style={{ fontWeight: 600, fontSize: 11.5, color: overdue ? 'var(--danger)' : 'inherit' }}>{d.status === 'Lost' ? '—' : fmtDate(d.nextPickup)}</span> },
                  ].map((item, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px 4px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border-light)' : 'none', minWidth: 0 }}>
                      <div style={{ marginBottom: 2 }}>{item.value}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }} className="truncate">{item.label}</div>
                    </div>
                  ))}
                </div>

                {d.status === 'Lost' && d.lostReason && (
                  <div style={{ padding: '6px 14px', background: 'var(--danger-bg)', fontSize: 11.5, color: 'var(--danger)' }}>
                    <AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                    Lost: <strong>{d.lostReason}</strong>
                  </div>
                )}

                {/* At Risk / Churned advisory */}
                {(health.label === 'At Risk' || health.label === 'Churned') && d.status === 'Active' && days !== null && (
                  <div style={{ padding: '6px 14px', background: health.label === 'Churned' ? 'var(--border-light)' : 'var(--warning-bg)', fontSize: 11.5, color: health.label === 'Churned' ? 'var(--text-muted)' : '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={11} />
                    {days} days since last pickup — {health.label === 'Churned' ? 'urgent follow-up needed' : 'schedule soon'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 600, width: '95vw' }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Donor' : 'Add New Donor'}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Donor full name" autoFocus />
                </div>
                <div className="form-group">
                  <label>Mobile Number <span className="required">*</span></label>
                  <input value={form.mobile} onChange={e => setField('mobile', e.target.value)} placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
                </div>
                <div className="form-group">
                  <label>House / Flat No.</label>
                  <input value={form.house} onChange={e => setField('house', e.target.value)} placeholder="e.g. A-101" />
                </div>
                <div className="form-group">
                  <label>Society</label>
                  <input list="society-list" value={form.society} onChange={e => setField('society', e.target.value)} placeholder="Type or select society" />
                  <datalist id="society-list">
                    {allSocieties.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>City <span className="required">*</span></label>
                  <select value={form.city} onChange={e => setField('city', e.target.value)}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sector / Area</label>
                  <select value={form.sector} onChange={e => setField('sector', e.target.value)}>
                    <option value="">Select Sector</option>
                    {formSectors.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Donor Status</label>
                  <select value={form.status} onChange={e => setField('status', e.target.value)}>
                    {DONOR_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {form.status === 'Lost' && (
                  <div className="form-group">
                    <label>Lost Reason <span className="required">*</span></label>
                    <select value={form.lostReason} onChange={e => setField('lostReason', e.target.value)}>
                      <option value="">Select reason</option>
                      {LOST_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional notes…" style={{ minHeight: 72 }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={save}
                disabled={saving || !form.name.trim() || !form.mobile.trim() || (form.status === 'Lost' && !form.lostReason)}
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Donor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
