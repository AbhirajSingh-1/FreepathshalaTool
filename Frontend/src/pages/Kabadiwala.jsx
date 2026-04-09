import { useState, useEffect } from 'react'
import { Phone, Plus, Edit2, Trash2, X, Star, IndianRupee, TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react'
import { fetchKabadiwalas, createKabadiwala, updateKabadiwala, deleteKabadiwala } from '../services/api'
import { fmtDate, fmtCurrency } from '../utils/helpers'

const EMPTY = { name: '', mobile: '', area: '', sector: '', society: '' }

export default function Kabadiwala() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('directory') // 'directory' | 'reports'
  const [selectedK, setSelectedK] = useState(null)    // for financial detail modal
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchKabadiwalas().then(data => { setList(data); setLoading(false) })
  }, [])

  const open = (k = null) => {
    setEditing(k)
    setForm(k ? { ...k } : EMPTY)
    setModal(true)
  }
  const close = () => { setModal(false); setEditing(null) }

  const save = async () => {
    if (!form.name || !form.mobile) return
    if (editing) {
      const updated = await updateKabadiwala(editing.id, form)
      setList(l => l.map(k => k.id === editing.id ? updated : k))
    } else {
      const newK = await createKabadiwala(form)
      setList(l => [...l, newK])
    }
    close()
  }

  const removeK = async (id) => {
    if (!confirm('Remove this kabadiwala?')) return
    await deleteKabadiwala(id)
    setList(l => l.filter(k => k.id !== id))
  }

  // Summary stats for reports view
  const totalEarnings   = list.reduce((s, k) => s + (k.amountReceived || 0), 0)
  const totalPending    = list.reduce((s, k) => s + (k.pendingAmount || 0), 0)
  const totalPickups    = list.reduce((s, k) => s + (k.totalPickups || 0), 0)
  const totalScrapValue = list.reduce((s, k) => s + (k.totalValue || 0), 0)

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
        <>
          {loading ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {list.map(k => (
                <div key={k.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 48, height: 48, background: 'var(--secondary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--secondary)', flexShrink: 0 }}>
                        {k.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{k.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Phone size={11} /> {k.mobile}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Star size={11} fill="var(--accent)" color="var(--accent)" />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{k.rating}</span>
                        </div>
                      </div>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedK(k); setView('reports') }}><BarChart3 size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => open(k)}><Edit2 size={13} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeK(k.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>{k.area}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{k.totalPickups}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pickups</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{fmtCurrency(k.totalValue)}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scrap Value</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{fmtCurrency(k.pendingAmount || 0)}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {list.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                  <div className="empty-icon"><Phone size={22} /></div>
                  <h3>No kabadiwalas added</h3>
                  <p>Add your first kabadiwala to start assigning pickups.</p>
                </div>
              )}
            </div>
          )}
        </>
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

          {/* Per-Kabadiwala cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className={`btn btn-sm ${!selectedK ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedK(null)}>
              All Kabadiwalas
            </button>
            {list.map(k => (
              <button key={k.id} className={`btn btn-sm ${selectedK?.id === k.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedK(k)}>
                {k.name}
              </button>
            ))}
          </div>

          {/* Transaction table */}
          {(selectedK ? [selectedK] : list).map(k => (
            <div key={k.id} className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">{k.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.area} · {k.mobile}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(k.amountReceived || 0)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Received</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>{fmtCurrency(k.pendingAmount || 0)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{k.totalPickups}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pickups</div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Pickup ID</th>
                      <th>Date</th>
                      <th>Donor</th>
                      <th>RST Value</th>
                      <th>Paid to FP</th>
                      <th>Due</th>
                      <th>Status</th>
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
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Kabadiwala' : 'Add Kabadiwala'}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label>Mobile <span className="required">*</span></label>
                  <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit number" maxLength={10} />
                </div>
                <div className="form-group full">
                  <label>Area / Coverage Zone</label>
                  <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Sector 22, Delhi" />
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}