// Frontend/src/pages/PickupPartners.jsx
// Renamed from Kabadiwala.jsx — "Pickup Partners"
import { useState, useMemo } from 'react'
import {
  Phone, Plus, Edit2, Trash2, X, Star, Mail,
  IndianRupee, TrendingUp, Clock, CheckCircle,
  BarChart3, ChevronDown, ChevronUp, Package, AlertCircle,
  MapPin, ShieldAlert, Eye,
} from 'lucide-react'
import { useApp }  from '../context/AppContext'
import { useRole } from '../context/RoleContext'
import { fmtDate, fmtCurrency } from '../utils/helpers'
import { RATE_CHART_ITEMS, DEFAULT_RATE_CHART, CITY_SECTORS } from '../data/mockData'

const GURGAON_SECTORS = CITY_SECTORS['Gurgaon'] || []

const EMPTY = {
  name: '', mobile: '', email: '',
  sectors: [], societies: [],
  area: '',
  rateChart: { ...DEFAULT_RATE_CHART },
}

// ── Rate Chart mini display ───────────────────────────────────────────────────
function RateChartMini({ rateChart, expanded, onToggle }) {
  if (!rateChart) return null
  const entries = Object.entries(rateChart).filter(([, v]) => v > 0)
  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--secondary)', padding: 0 }}>
        Rate Chart {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {expanded && (
        <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '5px 10px', background: 'var(--secondary-light)', fontSize: 10.5, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Item</span><span style={{ textAlign: 'right' }}>₹ / kg</span>
          </div>
          {entries.map(([item, rate], i) => (
            <div key={item} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '5px 10px', fontSize: 12, borderTop: i > 0 ? '1px solid var(--border-light)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>₹{rate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Rate Chart editor ─────────────────────────────────────────────────────────
function RateChartEditor({ rateChart, onChange }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', padding: '6px 10px', background: 'var(--secondary-light)', borderRadius: '8px 8px 0 0', fontSize: 10.5, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span>Item</span><span style={{ textAlign: 'right' }}>Rate (₹/kg)</span>
      </div>
      <div style={{ border: '1px solid var(--border-light)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        {RATE_CHART_ITEMS.map((item, idx) => (
          <div key={item} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', padding: '8px 10px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none', background: idx % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item}</span>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none' }}>₹</span>
              <input
                type="number" min={0} step={0.5} inputMode="decimal"
                value={rateChart[item] ?? ''}
                onChange={e => onChange({ ...rateChart, [item]: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '5px 8px 5px 20px', fontSize: 13, fontWeight: 700, textAlign: 'right', border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--surface)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Coverage Selector (max 2 sectors, max 5 societies) ────────────────────────
function CoverageSelector({ sectors, societies, onSectors, onSocieties }) {
  const [openSec, setOpenSec] = useState(false)

  const availableSocieties = useMemo(() => {
    if (!sectors.length) return []
    const { GURGAON_SOCIETIES } = require('../data/mockData')
    return sectors.flatMap(s => GURGAON_SOCIETIES[s] || [])
  }, [sectors])

  const toggleSector = (s) => {
    if (sectors.includes(s)) {
      onSectors(sectors.filter(x => x !== s))
      onSocieties(societies.filter(soc => !(require('../data/mockData').GURGAON_SOCIETIES[s] || []).includes(soc)))
    } else {
      if (sectors.length >= 2) return
      onSectors([...sectors, s])
    }
  }

  const toggleSociety = (soc) => {
    if (societies.includes(soc)) {
      onSocieties(societies.filter(s => s !== soc))
    } else {
      if (societies.length >= 5) return
      onSocieties([...societies, soc])
    }
  }

  return (
    <div>
      {/* Sector picker */}
      <div className="form-group" style={{ margin: '0 0 10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Coverage Sectors <span className="required">*</span></span>
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>Max 2 sectors</span>
        </label>
        <div style={{ position: 'relative' }}>
          <div onClick={() => setOpenSec(o => !o)} style={{ padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--surface)', minHeight: 40, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            {sectors.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select up to 2 sectors…</span>
            ) : sectors.map(s => (
              <span key={s} style={{ background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{s}</span>
            ))}
            <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0, transform: openSec ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </div>
          {openSec && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', maxHeight: 220, overflowY: 'auto', padding: 8 }}>
              {GURGAON_SECTORS.map(s => {
                const selected = sectors.includes(s)
                const disabled = !selected && sectors.length >= 2
                return (
                  <button key={s} type="button" onClick={() => !disabled && toggleSector(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: 'none', background: selected ? 'var(--secondary-light)' : 'transparent', color: selected ? 'var(--secondary)' : disabled ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: selected ? 700 : 400, fontSize: 12.5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
                    {s}
                    {selected && ' ✓'}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Society picker */}
      {sectors.length > 0 && (
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Coverage Societies</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>Max 5 societies ({societies.length}/5)</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableSocieties.map(soc => {
              const selected = societies.includes(soc)
              const disabled = !selected && societies.length >= 5
              return (
                <button key={soc} type="button" onClick={() => !disabled && toggleSociety(soc)} style={{ padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${selected ? 'var(--secondary)' : 'var(--border)'}`, background: selected ? 'var(--secondary-light)' : 'transparent', color: selected ? 'var(--secondary)' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)', fontWeight: selected ? 700 : 400, fontSize: 11.5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
                  {soc}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Payment Summary Cards ─────────────────────────────────────────────────────
function PartnerPaymentSummaryCards({ partner, raddiRecords }) {
  const stats = useMemo(() => {
    const records = raddiRecords.filter(r => r.kabadiwalaName === partner.name)
    const totalPickups = records.length
    const totalAmount  = records.reduce((s, r) => s + (r.totalAmount || 0), 0)
    const received     = records.filter(r => r.paymentStatus === 'Received').reduce((s, r) => s + (r.totalAmount || 0), 0)
    const pending      = totalAmount - received
    return { totalPickups, totalAmount, received, pending }
  }, [raddiRecords, partner.name])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
      {[
        { label: 'Pickups',     value: stats.totalPickups,            color: 'var(--text-primary)', icon: Package },
        { label: 'Total (₹)',   value: fmtCurrency(stats.totalAmount), color: 'var(--primary)',     icon: IndianRupee },
        { label: 'Pending (₹)', value: fmtCurrency(stats.pending),    color: stats.pending > 0 ? 'var(--danger)' : 'var(--secondary)', icon: AlertCircle },
      ].map(item => {
        const Icon = item.icon
        return (
          <div key={item.label} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Icon size={13} color={item.color} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Monthly Performance ───────────────────────────────────────────────────────
function PartnerMonthlyReport({ partner, raddiRecords }) {
  const monthly = useMemo(() => {
    const records = raddiRecords.filter(r => r.kabadiwalaName === partner.name)
    const m = {}
    records.forEach(r => {
      const key = (r.pickupDate || '').slice(0, 7)
      if (!key) return
      if (!m[key]) m[key] = { month: key, pickups: 0, amount: 0, received: 0, kg: 0 }
      m[key].pickups++
      m[key].amount   += r.totalAmount || 0
      m[key].received += r.paymentStatus === 'Received' ? (r.totalAmount || 0) : 0
      m[key].kg       += r.totalKg || 0
    })
    return Object.values(m).sort((a, b) => b.month.localeCompare(a.month))
  }, [raddiRecords, partner.name])

  if (!monthly.length) return <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div>

  return (
    <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <table>
        <thead>
          <tr>
            <th>Month</th><th>Pickups</th><th>Kg Collected</th>
            <th>Total (₹)</th><th>Received</th><th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map(m => (
            <tr key={m.month}>
              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.month}</td>
              <td style={{ fontWeight: 600 }}>{m.pickups}</td>
              <td>{m.kg.toFixed(1)} kg</td>
              <td style={{ fontWeight: 700 }}>{fmtCurrency(m.amount)}</td>
              <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{fmtCurrency(m.received)}</td>
              <td style={{ color: m.amount - m.received > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>{fmtCurrency(m.amount - m.received)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function PickupPartners() {
  const { kabadiwalas: partners, raddiRecords, addPartner, updatePartner, deletePartner } = useApp()
  const { can } = useRole()

  const [view,         setView]         = useState('directory')
  const [selectedK,    setSelectedK]    = useState(null)
  const [modal,        setModal]        = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [editing,      setEditing]      = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [expandedRates, setExpandedRates] = useState({})
  const [showRateEditor, setShowRateEditor] = useState(false)

  const open = (k = null) => {
    setEditing(k)
    setForm(k ? {
      name:      k.name      || '',
      mobile:    k.mobile    || '',
      email:     k.email     || '',
      sectors:   k.sectors   || [],
      societies: k.societies || [],
      area:      k.area      || '',
      rateChart: { ...DEFAULT_RATE_CHART, ...(k.rateChart || {}) },
    } : { ...EMPTY, rateChart: { ...DEFAULT_RATE_CHART } })
    setShowRateEditor(false)
    setModal(true)
  }
  const close = () => { setModal(false); setEditing(null) }

  const save = async () => {
    if (!form.name || !form.mobile) return
    setSaving(true)
    try {
      const area = [...form.sectors, ...form.societies].filter(Boolean).join(', ') || form.area
      if (editing) {
        await updatePartner(editing.id, { ...form, area })
      } else {
        await addPartner({ ...form, area })
      }
      close()
    } finally { setSaving(false) }
  }

  const removeK = async (id) => {
    if (!can.deletePartner) return
    if (!confirm('Remove this pickup partner?')) return
    await deletePartner(id)
    if (selectedK?.id === id) setSelectedK(null)
  }

  const toggleRate = (id) => setExpandedRates(prev => ({ ...prev, [id]: !prev[id] }))

  const totalEarnings   = partners.reduce((s, k) => s + (k.amountReceived || 0), 0)
  const totalPending    = partners.reduce((s, k) => s + (k.pendingAmount  || 0), 0)
  const totalPickups    = partners.reduce((s, k) => s + (k.totalPickups   || 0), 0)
  const totalScrapValue = partners.reduce((s, k) => s + (k.totalValue     || 0), 0)

  return (
    <div className="page-body">
      {/* Role notice for executive */}
      {!can.viewPartnerReports && (
        <div className="alert-strip alert-info" style={{ marginBottom: 16 }}>
          <Eye size={14} />
          <span>You can add pickup partners. Contact your manager to view reports or delete partners.</span>
        </div>
      )}

      {/* View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${view === 'directory' ? 'active' : ''}`} onClick={() => setView('directory')}>
            Directory
          </button>
          {can.viewPartnerReports && (
            <button className={`tab ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
              <BarChart3 size={13} style={{ marginRight: 4 }} /> Reports
            </button>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => open()}>
          <Plus size={14} /> Add Pickup Partner
        </button>
      </div>

      {/* ══ DIRECTORY VIEW ══ */}
      {view === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {partners.map(k => (
            <div key={k.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--secondary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--secondary)', flexShrink: 0 }}>
                    {k.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--secondary)', padding: '2px 8px', borderRadius: 5 }}>{k.id}</span>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{k.name}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Phone size={11} /> {k.mobile}
                    </div>
                    {k.email && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Mail size={11} /> {k.email}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Star size={11} fill="var(--accent)" color="var(--accent)" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{k.rating}</span>
                    </div>
                  </div>
                  <div className="td-actions">
                    {can.viewPartnerReports && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Reports" onClick={() => { setSelectedK(k); setView('reports') }}><BarChart3 size={13} /></button>
                    )}
                    {can.editPartner && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => open(k)}><Edit2 size={13} /></button>
                    )}
                    {can.deletePartner && (
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => removeK(k.id)}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>

                {/* Sector / Coverage */}
                {(k.sectors?.length > 0 || k.area) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <MapPin size={11} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(k.sectors || []).map(s => (
                        <span key={s} style={{ background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{s}</span>
                      ))}
                      {!k.sectors?.length && k.area && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.area}</span>}
                    </div>
                  </div>
                )}

                <PartnerPaymentSummaryCards partner={k} raddiRecords={raddiRecords} />
                <RateChartMini rateChart={k.rateChart} expanded={!!expandedRates[k.id]} onToggle={() => toggleRate(k.id)} />
              </div>
            </div>
          ))}

          {partners.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon"><Phone size={22} /></div>
              <h3>No pickup partners added</h3>
              <p>Add your first pickup partner to start assigning pickups.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ REPORTS VIEW (Admin/Manager only) ══ */}
      {view === 'reports' && can.viewPartnerReports && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card green"><div className="stat-icon"><IndianRupee size={18} /></div><div className="stat-value">{fmtCurrency(totalEarnings)}</div><div className="stat-label">Total Received</div></div>
            <div className="stat-card red"><div className="stat-icon"><Clock size={18} /></div><div className="stat-value">{fmtCurrency(totalPending)}</div><div className="stat-label">Total Pending</div></div>
            <div className="stat-card orange"><div className="stat-icon"><TrendingUp size={18} /></div><div className="stat-value">{fmtCurrency(totalScrapValue)}</div><div className="stat-label">Total Scrap Value</div></div>
            <div className="stat-card blue"><div className="stat-icon"><CheckCircle size={18} /></div><div className="stat-value">{totalPickups}</div><div className="stat-label">Total Pickups</div></div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className={`btn btn-sm ${!selectedK ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedK(null)}>All Partners</button>
            {partners.map(k => (
              <button key={k.id} className={`btn btn-sm ${selectedK?.id === k.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedK(k)}>{k.name}</button>
            ))}
          </div>

          {(selectedK ? [selectedK] : partners).map(k => {
            const liveRecords  = raddiRecords.filter(r => r.kabadiwalaName === k.name)
            const livePickups  = liveRecords.length
            const liveTotal    = liveRecords.reduce((s, r) => s + (r.totalAmount || 0), 0)
            const liveReceived = liveRecords.filter(r => r.paymentStatus === 'Received').reduce((s, r) => s + (r.totalAmount || 0), 0)
            const livePending  = liveTotal - liveReceived

            return (
              <div key={k.id} className="card" style={{ marginBottom: 20 }}>
                <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--secondary)', padding: '2px 8px', borderRadius: 5 }}>{k.id}</span>
                      <div className="card-title">{k.name}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {k.mobile}
                      {k.email && ` · ${k.email}`}
                      {k.area && ` · ${k.area}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'right', marginLeft: 'auto' }}>
                    <div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(liveReceived)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Received</div></div>
                    <div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(livePending)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div></div>
                    <div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{livePickups}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pickups</div></div>
                  </div>
                  {can.editPartner && <button className="btn btn-ghost btn-sm" onClick={() => open(k)}><Edit2 size={12} /> Edit</button>}
                </div>

                {/* Monthly breakdown */}
                <div style={{ padding: '0' }}>
                  <div style={{ padding: '10px 20px 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Breakdown</div>
                  <PartnerMonthlyReport partner={k} raddiRecords={raddiRecords} />
                </div>

                {k.rateChart && (
                  <div style={{ padding: '8px 20px 0' }}>
                    <RateChartMini
                      rateChart={k.rateChart}
                      expanded={!!expandedRates[`report-${k.id}`]}
                      onToggle={() => setExpandedRates(prev => ({ ...prev, [`report-${k.id}`]: !prev[`report-${k.id}`] }))}
                    />
                  </div>
                )}

                {/* Transactions */}
                <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0, marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr><th>Pickup ID</th><th>Date</th><th>Donor</th><th>RST Value</th><th>Paid to FP</th><th>Due</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {!(k.transactions?.length) ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No transactions yet</td></tr>
                      ) : (k.transactions || []).map((tx, i) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{tx.pickupId}</span></td>
                          <td style={{ fontSize: 12.5 }}>{fmtDate(tx.date)}</td>
                          <td style={{ fontWeight: 600 }}>{tx.donor}</td>
                          <td style={{ fontWeight: 600 }}>{fmtCurrency(tx.value)}</td>
                          <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{fmtCurrency(tx.paid)}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{tx.value > tx.paid ? fmtCurrency(tx.value - tx.paid) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                          <td><span className={`badge ${tx.status === 'Paid' ? 'badge-success' : tx.status === 'Partially Paid' ? 'badge-warning' : 'badge-danger'}`}>{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal modal-lg" style={{ maxWidth: 700, width: '95vw' }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Pickup Partner' : 'Add Pickup Partner'}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '72vh' }}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Partner full name" autoFocus />
                </div>
                <div className="form-group">
                  <label>Mobile <span className="required">*</span></label>
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit number" maxLength={10} inputMode="numeric" />
                </div>
                <div className="form-group full">
                  <label>Email <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>(optional)</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="partner@example.com" />
                </div>
              </div>

              {/* Coverage selector */}
              <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>Coverage Area</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Select up to 2 sectors and 5 societies this partner covers.</div>
                <CoverageSelector
                  sectors={form.sectors}
                  societies={form.societies}
                  onSectors={s => setForm(f => ({ ...f, sectors: s }))}
                  onSocieties={s => setForm(f => ({ ...f, societies: s }))}
                />
              </div>

              {/* Rate Chart */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Rate Chart</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Set per-kg rates for each RST item type</div>
                  </div>
                  <button type="button" onClick={() => setShowRateEditor(v => !v)} className={`btn btn-sm ${showRateEditor ? 'btn-outline' : 'btn-ghost'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {showRateEditor ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showRateEditor ? 'Hide Rates' : 'Edit Rates'}
                  </button>
                </div>
                {!showRateEditor && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px', background: 'var(--secondary-light)', borderRadius: 8 }}>
                    {RATE_CHART_ITEMS.map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--surface)', borderRadius: 20, fontSize: 11.5, border: '1px solid var(--border-light)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{form.rateChart[item] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showRateEditor && <RateChartEditor rateChart={form.rateChart} onChange={rc => setForm(f => ({ ...f, rateChart: rc }))} />}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim() || !form.mobile.trim()}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Pickup Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}