// Frontend/src/pages/Kabadiwala.jsx
import { useState, useMemo } from 'react'
import {
  Phone, Plus, Edit2, Trash2, X, Star,
  IndianRupee, TrendingUp, Clock, CheckCircle,
  BarChart3, ChevronDown, ChevronUp, Package, AlertCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fmtDate, fmtCurrency } from '../utils/helpers'
import { RATE_CHART_ITEMS, DEFAULT_RATE_CHART } from '../data/mockData'

const EMPTY = {
  name: '', mobile: '', area: '', sector: '', society: '',
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

// ── FEATURE 3: Payment Summary Cards from raddiRecords ────────────────────────
function KabPaymentSummaryCards({ kabadiwala, raddiRecords }) {
  const stats = useMemo(() => {
    const records = raddiRecords.filter(r => r.kabadiwalaName === kabadiwala.name)
    const totalPickups = records.length
    const totalAmount  = records.reduce((s, r) => s + (r.totalAmount || 0), 0)
    const received     = records.filter(r => r.paymentStatus === 'Received').reduce((s, r) => s + (r.totalAmount || 0), 0)
    const pending      = totalAmount - received
    return { totalPickups, totalAmount, received, pending }
  }, [raddiRecords, kabadiwala.name])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8, marginTop: 12,
      padding: '10px', background: 'var(--bg)',
      borderRadius: 10, border: '1px solid var(--border-light)',
    }}>
      {[
        { label: 'Pickups',      value: stats.totalPickups,           color: 'var(--text-primary)',  icon: Package },
        { label: 'Total (₹)',    value: fmtCurrency(stats.totalAmount), color: 'var(--primary)',      icon: IndianRupee },
        { label: 'Pending (₹)', value: fmtCurrency(stats.pending),    color: stats.pending > 0 ? 'var(--danger)' : 'var(--secondary)', icon: AlertCircle },
      ].map(item => {
        const Icon = item.icon
        return (
          <div key={item.label} style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Icon size={13} color={item.color} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: item.color, lineHeight: 1 }}>
              {item.value}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function Kabadiwala() {
  const { kabadiwalas, raddiRecords, addKabadiwala, updateKabadiwala, deleteKabadiwala } = useApp()

  const [view, setView]           = useState('directory')
  const [selectedK, setSelectedK] = useState(null)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editing, setEditing]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [expandedRates, setExpandedRates] = useState({})
  const [showRateEditor, setShowRateEditor] = useState(false)

  const open = (k = null) => {
    setEditing(k)
    setForm(k ? {
      name: k.name || '', mobile: k.mobile || '',
      area: k.area || '', sector: k.sector || '', society: k.society || '',
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
      if (editing) {
        await updateKabadiwala(editing.id, { name: form.name, mobile: form.mobile, area: form.area, sector: form.sector, society: form.society, rateChart: form.rateChart })
      } else {
        await addKabadiwala({ name: form.name, mobile: form.mobile, area: form.area, sector: form.sector, society: form.society, rateChart: form.rateChart })
      }
      close()
    } finally { setSaving(false) }
  }

  const removeK = async (id) => {
    if (!confirm('Remove this kabadiwala?')) return
    await deleteKabadiwala(id)
    if (selectedK?.id === id) setSelectedK(null)
  }

  const toggleRate = (id) => setExpandedRates(prev => ({ ...prev, [id]: !prev[id] }))

  // Overall financial summary
  const totalEarnings   = kabadiwalas.reduce((s, k) => s + (k.amountReceived || 0), 0)
  const totalPending    = kabadiwalas.reduce((s, k) => s + (k.pendingAmount  || 0), 0)
  const totalPickups    = kabadiwalas.reduce((s, k) => s + (k.totalPickups   || 0), 0)
  const totalScrapValue = kabadiwalas.reduce((s, k) => s + (k.totalValue     || 0), 0)

  return (
    <div className="page-body">
      {/* View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${view === 'directory' ? 'active' : ''}`} onClick={() => setView('directory')}>
            Directory
          </button>
          <button className={`tab ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
            <BarChart3 size={13} style={{ marginRight: 4 }} /> Financial Reports
          </button>
        </div>
        {view === 'directory' && (
          <button className="btn btn-primary btn-sm" onClick={() => open()}>
            <Plus size={14} /> Add Kabadiwala
          </button>
        )}
      </div>

      {/* ══ DIRECTORY VIEW ══ */}
      {view === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {kabadiwalas.map(k => (
            <div key={k.id} className="card">
              <div className="card-body">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--secondary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--secondary)', flexShrink: 0 }}>
                    {k.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    {/* Kabadiwala ID badge + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'white', background: 'var(--secondary)', padding: '2px 8px', borderRadius: 5 }}>
                        {k.id}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{k.name}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Phone size={11} /> {k.mobile}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Star size={11} fill="var(--accent)" color="var(--accent)" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{k.rating}</span>
                    </div>
                  </div>
                  <div className="td-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" title="Financial report" onClick={() => { setSelectedK(k); setView('reports') }}><BarChart3 size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => open(k)}><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => removeK(k.id)}><Trash2 size={13} /></button>
                  </div>
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4 }}>{k.area}</div>

                {/* FEATURE 3: Payment summary from raddiRecords */}
                <KabPaymentSummaryCards kabadiwala={k} raddiRecords={raddiRecords} />

                {/* Expandable rate chart */}
                <RateChartMini
                  rateChart={k.rateChart}
                  expanded={!!expandedRates[k.id]}
                  onToggle={() => toggleRate(k.id)}
                />
              </div>
            </div>
          ))}

          {kabadiwalas.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon"><Phone size={22} /></div>
              <h3>No kabadiwalas added</h3>
              <p>Add your first kabadiwala to start assigning pickups.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ FINANCIAL REPORTS VIEW ══ */}
      {view === 'reports' && (
        <div>
          {/* Overall Summary */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card green">
              <div className="stat-icon"><IndianRupee size={18} /></div>
              <div className="stat-value">{fmtCurrency(totalEarnings)}</div>
              <div className="stat-label">Total Received from Kabadiwalas</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon"><Clock size={18} /></div>
              <div className="stat-value">{fmtCurrency(totalPending)}</div>
              <div className="stat-label">Total Pending Payments</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon"><TrendingUp size={18} /></div>
              <div className="stat-value">{fmtCurrency(totalScrapValue)}</div>
              <div className="stat-label">Total RST Scrap Value</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon"><CheckCircle size={18} /></div>
              <div className="stat-value">{totalPickups}</div>
              <div className="stat-label">Total Pickups Completed</div>
            </div>
          </div>

          {/* Kabadiwala selector */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className={`btn btn-sm ${!selectedK ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedK(null)}>
              All Kabadiwalas
            </button>
            {kabadiwalas.map(k => (
              <button key={k.id} className={`btn btn-sm ${selectedK?.id === k.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedK(k)}>
                {k.name}
              </button>
            ))}
          </div>

          {/* Per-kabadiwala cards */}
          {(selectedK ? [selectedK] : kabadiwalas).map(k => {
            // Compute live stats from raddiRecords for this kabadiwala
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.area} · {k.mobile}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'right', marginLeft: 'auto' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(liveReceived)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Received</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(livePending)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{livePickups}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pickups</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => open(k)}>
                    <Edit2 size={12} /> Edit Rates
                  </button>
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

                {/* Transaction table */}
                <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0, marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Pickup ID</th><th>Date</th><th>Donor</th>
                        <th>RST Value</th><th>Paid to FP</th><th>Due</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(k.transactions || []).length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No transactions yet</td></tr>
                      ) : (k.transactions || []).map((tx, i) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{tx.pickupId}</span></td>
                          <td style={{ fontSize: 12.5 }}>{fmtDate(tx.date)}</td>
                          <td style={{ fontWeight: 600 }}>{tx.donor}</td>
                          <td style={{ fontWeight: 600 }}>{fmtCurrency(tx.value)}</td>
                          <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{fmtCurrency(tx.paid)}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>
                            {tx.value > tx.paid ? fmtCurrency(tx.value - tx.paid) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>
                            <span className={`badge ${tx.status === 'Paid' ? 'badge-success' : tx.status === 'Partially Paid' ? 'badge-warning' : 'badge-danger'}`}>
                              {tx.status}
                            </span>
                          </td>
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
          <div className="modal modal-lg" style={{ maxWidth: 680, width: '95vw' }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Kabadiwala' : 'Add Kabadiwala'}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '72vh' }}>
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" autoFocus />
                </div>
                <div className="form-group">
                  <label>Mobile <span className="required">*</span></label>
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit number" maxLength={10} inputMode="numeric" />
                </div>
                <div className="form-group full">
                  <label>Area / Coverage Zone</label>
                  <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Sector 22, DLF Phase 1-2, Gurgaon" />
                </div>
                <div className="form-group">
                  <label>Sector</label>
                  <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Society</label>
                  <input value={form.society} onChange={e => setForm(f => ({ ...f, society: e.target.value }))} />
                </div>
              </div>

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
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Kabadiwala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}