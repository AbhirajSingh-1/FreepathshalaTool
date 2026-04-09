import { useState, useEffect } from 'react'
import {
  IndianRupee, X, Clock, CheckCircle, AlertCircle,
  Download, History, TrendingUp, Plus, Copy, Check,
  Hash, FileText, CreditCard, Smartphone,
} from 'lucide-react'
import { fetchPickups, updatePickup } from '../services/api'
import { fmtDate, fmtCurrency, paymentStatusColor, exportToExcel } from '../utils/helpers'
import { CITIES, CITY_SECTORS } from '../data/mockData'

const calcPayStatus = (total, paid) => {
  const t = Number(total) || 0
  const p = Number(paid)  || 0
  if (t === 0) return 'Not Paid'
  if (p >= t)  return 'Paid'
  if (p > 0)   return 'Partially Paid'
  return 'Not Paid'
}

const REF_MODES = [
  { value: 'upi',    label: 'UPI',        icon: Smartphone,  placeholder: 'UPI transaction ID (12-digit)' },
  { value: 'cash',   label: 'Cash',       icon: IndianRupee, placeholder: 'Receipt number (optional)' },
  { value: 'neft',   label: 'NEFT/IMPS',  icon: CreditCard,  placeholder: 'NEFT/IMPS reference number' },
  { value: 'cheque', label: 'Cheque',     icon: FileText,    placeholder: 'Cheque number' },
  { value: 'other',  label: 'Other',      icon: Hash,        placeholder: 'Reference / transaction ID' },
]

const refModeLabel = (mode) => REF_MODES.find(r => r.value === mode)?.label || mode || '—'

export default function Payments() {
  const [pickups,     setPickups]    = useState([])
  const [loading,     setLoading]    = useState(true)
  const [modal,       setModal]      = useState(null)
  const [histModal,   setHistModal]  = useState(null)
  const [saving,      setSaving]     = useState(false)
  const [highlightId, setHighlight]  = useState(null)
  const [copied,      setCopied]     = useState(null)

  const [editAdditional, setEditAdditional] = useState('')
  const [editDate,       setEditDate]       = useState('')
  const [editNotes,      setEditNotes]      = useState('')
  const [editRefMode,    setEditRefMode]    = useState('upi')
  const [editRefValue,   setEditRefValue]   = useState('')
  const [refError,       setRefError]       = useState('')

  const [filterKab,    setFilterKab]    = useState('All')
  const [filterCity,   setFilterCity]   = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')

  useEffect(() => {
    fetchPickups().then(d => { setPickups(d); setLoading(false) })
  }, [])

  const kabNames      = [...new Set(pickups.map(p => p.kabadiwala).filter(Boolean))]
  const filterSectors = CITY_SECTORS[filterCity] || []

  const filtered = pickups.filter(p => {
    if (p.totalValue === 0 && p.status !== 'Completed') return false
    const matchKab    = filterKab === 'All' || p.kabadiwala === filterKab
    const matchCity   = !filterCity   || p.city === filterCity
    const matchSector = !filterSector || p.sector === filterSector
    const matchStatus = filterStatus === 'All' || p.paymentStatus === filterStatus
    const matchFrom   = !dateFrom || p.date >= dateFrom
    const matchTo     = !dateTo   || p.date <= dateTo
    return matchKab && matchCity && matchSector && matchStatus && matchFrom && matchTo
  }).sort((a, b) => b.date.localeCompare(a.date))

  const totalValue   = filtered.reduce((s, p) => s + (p.totalValue  || 0), 0)
  const totalPaid    = filtered.reduce((s, p) => s + (p.amountPaid  || 0), 0)
  const totalPending = totalValue - totalPaid

  const openEdit = (p) => {
    setModal(p)
    const rem = Math.max(0, (p.totalValue || 0) - (p.amountPaid || 0))
    setEditAdditional(rem > 0 ? String(rem) : '')
    setEditDate(new Date().toISOString().slice(0, 10))
    setEditNotes('')
    setEditRefMode('upi')
    setEditRefValue('')
    setRefError('')
  }
  const closeEdit = () => { setModal(null); setRefError('') }

  const validate = () => {
    if (!editAdditional || Number(editAdditional) <= 0) return 'Enter a valid payment amount.'
    if (editRefMode !== 'cash' && !editRefValue.trim())
      return `Please enter the ${refModeLabel(editRefMode)} reference number.`
    if (editRefMode === 'upi' && editRefValue.trim().length < 6)
      return 'UPI transaction ID should be at least 6 characters.'
    return ''
  }

  const savePayment = async () => {
    const err = validate()
    if (err) { setRefError(err); return }
    setSaving(true)
    try {
      const additional   = Number(editAdditional) || 0
      const prevPaid     = modal.amountPaid || 0
      const newTotalPaid = Math.min(prevPaid + additional, modal.totalValue || 0)
      const status       = calcPayStatus(modal.totalValue, newTotalPaid)

      const newEntry = {
        date: editDate, amount: additional, cumulative: newTotalPaid,
        notes: editNotes.trim(), prev: prevPaid,
        refMode: editRefMode, refValue: editRefValue.trim(),
      }

      const payHistory = [...(modal.payHistory || []), newEntry]
      const updated    = await updatePickup(modal.id, { amountPaid: newTotalPaid, paymentStatus: status, payHistory })

      setPickups(ps => ps.map(p => p.id === modal.id ? updated : p))
      setHighlight(modal.id)
      setTimeout(() => setHighlight(null), 2500)
      closeEdit()
    } finally { setSaving(false) }
  }

  const handleExport = () => {
    exportToExcel(filtered.map(p => ({
      'Pickup ID': p.id, 'Donor': p.donorName, 'Kabadiwala': p.kabadiwala || '—',
      'Date': p.date, 'Total Value (₹)': p.totalValue,
      'Amount Paid (₹)': p.amountPaid, 'Remaining (₹)': (p.totalValue||0)-(p.amountPaid||0),
      'Payment Status': p.paymentStatus,
      'Last Ref': (p.payHistory||[]).slice(-1)[0]?.refValue || '—',
      'Last Ref Mode': refModeLabel((p.payHistory||[]).slice(-1)[0]?.refMode),
    })), 'Payments_Report')
  }

  const copyRef = (val) => {
    navigator.clipboard.writeText(val).catch(() => {})
    setCopied(val); setTimeout(() => setCopied(null), 1500)
  }

  const previewAdditional = Number(editAdditional) || 0
  const previewNewTotal   = modal ? Math.min((modal.amountPaid||0)+previewAdditional, modal.totalValue||0) : 0
  const previewRemaining  = modal ? Math.max(0, (modal.totalValue||0)-previewNewTotal) : 0
  const previewStatus     = modal ? calcPayStatus(modal.totalValue, previewNewTotal) : ''
  const selectedRefMode   = REF_MODES.find(r => r.value === editRefMode)

  return (
    <div className="page-body">

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background:'var(--primary-light)',color:'var(--primary)' }}><TrendingUp size={18}/></div>
          <div className="stat-value">{fmtCurrency(totalValue)}</div>
          <div className="stat-label">Total RST Value</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background:'var(--secondary-light)',color:'var(--secondary)' }}><CheckCircle size={18}/></div>
          <div className="stat-value">{fmtCurrency(totalPaid)}</div>
          <div className="stat-label">Total Received</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background:'var(--danger-bg)',color:'var(--danger)' }}><Clock size={18}/></div>
          <div className="stat-value">{fmtCurrency(totalPending)}</div>
          <div className="stat-label">Total Pending</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon" style={{ background:'var(--info-bg)',color:'var(--info)' }}><AlertCircle size={18}/></div>
          <div className="stat-value">{filtered.filter(p => p.paymentStatus !== 'Paid').length}</div>
          <div className="stat-label">Unpaid Entries</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap:'wrap',gap:10 }}>
        <select value={filterKab} onChange={e => setFilterKab(e.target.value)} style={{ flex:'1 1 160px' }}>
          <option value="All">All Kabadiwalas</option>
          {kabNames.map(k => <option key={k}>{k}</option>)}
        </select>
        <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterSector('') }} style={{ flex:'1 1 130px' }}>
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} disabled={!filterCity} style={{ flex:'1 1 150px' }}>
          <option value="">{filterCity ? 'All Sectors' : 'Select City First'}</option>
          {filterSectors.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex:'1 1 160px' }}>
          <option value="All">All Payment Status</option>
          <option>Paid</option><option>Not Paid</option><option>Partially Paid</option>
        </select>
        <div className="form-group" style={{ margin:0,flex:'1 1 130px' }}>
          <label style={{ fontSize:11,fontWeight:600 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin:0,flex:'1 1 130px' }}>
          <label style={{ fontSize:11,fontWeight:600 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ marginLeft:'auto' }}>
          <Download size={13}/> Export
        </button>
      </div>

      <div style={{ fontSize:12.5,color:'var(--text-muted)',margin:'12px 0' }}>
        <strong>{filtered.length}</strong> payment records
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><IndianRupee size={24}/></div>
          <h3>No records found</h3>
          <p>Adjust filters to see payment records.</p>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14 }}>
          {filtered.map(p => {
            const rem     = (p.totalValue||0) - (p.amountPaid||0)
            const lastPay = (p.payHistory||[]).slice(-1)[0]
            const pct     = p.totalValue > 0 ? Math.min(100,Math.round(((p.amountPaid||0)/p.totalValue)*100)) : 0
            return (
              <div key={p.id} className="card" style={{
                transition:'box-shadow 0.3s',
                boxShadow: highlightId===p.id ? '0 0 0 2px var(--secondary)' : undefined,
              }}>
                <div className="card-body">
                  {/* Header */}
                  <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:12 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:14 }}>{p.donorName}</div>
                      <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:2 }}>
                        {fmtDate(p.date)} · {p.kabadiwala || 'No kabadiwala'}
                      </div>
                      <div style={{ fontSize:11.5,color:'var(--text-muted)',marginTop:1 }}>
                        {p.society}{p.sector&&`, ${p.sector}`}, {p.city}
                      </div>
                    </div>
                    <span className={`badge ${paymentStatusColor(p.paymentStatus)}`} style={{ flexShrink:0,fontSize:11 }}>
                      {p.paymentStatus}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div style={{ display:'flex',gap:8,marginBottom:12 }}>
                    {[
                      { val:fmtCurrency(p.totalValue),   label:'Total',  bg:'var(--bg)',                col:'var(--text-primary)' },
                      { val:fmtCurrency(p.amountPaid||0),label:'Paid',   bg:'var(--secondary-light)',   col:'var(--secondary)' },
                      { val:rem>0?fmtCurrency(rem):'✓',  label:'Due',    bg:rem>0?'var(--danger-bg)':'var(--bg)', col:rem>0?'var(--danger)':'var(--text-muted)' },
                    ].map(item => (
                      <div key={item.label} style={{ flex:'1 1 80px',background:item.bg,borderRadius:8,padding:'8px 12px',textAlign:'center' }}>
                        <div style={{ fontWeight:700,fontSize:14,color:item.col }}>{item.val}</div>
                        <div style={{ fontSize:10,color:'var(--text-muted)',textTransform:'uppercase' }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {p.totalValue > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ height:5,background:'var(--border)',borderRadius:3,overflow:'hidden' }}>
                        <div style={{
                          height:'100%',borderRadius:3,transition:'width 0.4s',width:`${pct}%`,
                          background: pct===100?'var(--secondary)':pct>0?'var(--warning)':'var(--danger)',
                        }}/>
                      </div>
                      <div style={{ fontSize:10.5,color:'var(--text-muted)',marginTop:4 }}>{pct}% paid</div>
                    </div>
                  )}

                  {/* Last reference badge */}
                  {lastPay?.refValue && (
                    <div style={{
                      marginBottom:12,padding:'7px 10px',background:'var(--bg)',
                      borderRadius:8,display:'flex',alignItems:'center',gap:8,
                    }}>
                      <Hash size={11} color="var(--text-muted)"/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600,letterSpacing:'0.04em' }}>
                          {refModeLabel(lastPay.refMode)} ref
                        </div>
                        <div style={{ fontSize:12,fontFamily:'monospace',color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {lastPay.refValue}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyRef(lastPay.refValue)} title="Copy">
                        {copied===lastPay.refValue ? <Check size={12} color="var(--secondary)"/> : <Copy size={12}/>}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display:'flex',gap:8 }}>
                    {(p.payHistory||[]).length > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setHistModal(p)}>
                        <History size={12}/> History ({p.payHistory.length})
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}
                      style={{ flex:1 }} disabled={p.paymentStatus==='Paid'}>
                      <Plus size={12}/>
                      {p.paymentStatus==='Paid' ? 'Fully Paid ✓' : 'Record Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════ RECORD PAYMENT MODAL ═══════ */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && closeEdit()}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <IndianRupee size={18} color="var(--primary)"/>
              <div className="modal-title">Record Payment — {modal.donorName}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeEdit}><X size={16}/></button>
            </div>
            <div className="modal-body">
              {/* Summary */}
              <div style={{ background:'var(--bg)',borderRadius:10,padding:16,marginBottom:20 }}>
                <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
                  {[
                    {label:'Total Value',     val:fmtCurrency(modal.totalValue),                                      col:'var(--text-primary)'},
                    {label:'Already Paid',    val:fmtCurrency(modal.amountPaid||0),                                   col:'var(--secondary)'},
                    {label:'Still Remaining', val:fmtCurrency(Math.max(0,(modal.totalValue||0)-(modal.amountPaid||0))),col:'var(--danger)'},
                  ].map(item => (
                    <div key={item.label} style={{ flex:'1 1 80px' }}>
                      <div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600 }}>{item.label}</div>
                      <div style={{ fontWeight:700,fontSize:17,fontFamily:'var(--font-display)',color:item.col }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                {/* Amount */}
                <div className="form-group full">
                  <label>
                    Amount Received Now (₹) <span className="required">*</span>
                    <span style={{ fontSize:11,fontWeight:400,color:'var(--text-muted)',marginLeft:6 }}>
                      — kabadiwala payment today
                    </span>
                  </label>
                  <input type="number" min={0}
                    max={Math.max(0,(modal.totalValue||0)-(modal.amountPaid||0))}
                    inputMode="numeric" value={editAdditional}
                    onChange={e => { setEditAdditional(e.target.value); setRefError('') }}
                    placeholder={`Max ₹${Math.max(0,(modal.totalValue||0)-(modal.amountPaid||0))}`}
                    autoFocus
                  />
                  {editAdditional !== '' && (
                    <div style={{ marginTop:10,padding:'10px 14px',background:'var(--bg)',borderRadius:8,
                      display:'flex',gap:16,flexWrap:'wrap',fontSize:13 }}>
                      <div>New total: <strong style={{ color:'var(--secondary)' }}>{fmtCurrency(previewNewTotal)}</strong></div>
                      <div>Remaining: <strong style={{ color:previewRemaining>0?'var(--danger)':'var(--secondary)' }}>
                        {previewRemaining>0?fmtCurrency(previewRemaining):'₹0 ✓'}
                      </strong></div>
                      <div>Status: <span className={`badge ${paymentStatusColor(previewStatus)}`}>{previewStatus}</span></div>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="form-group">
                  <label>Payment Date <span className="required">*</span></label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}/>
                </div>

                {/* Reference mode */}
                <div className="form-group full">
                  <label>Payment Method <span className="required">*</span></label>
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    {REF_MODES.map(r => {
                      const Icon = r.icon
                      return (
                        <button key={r.value} type="button"
                          onClick={() => { setEditRefMode(r.value); setRefError('') }}
                          style={{
                            display:'flex',alignItems:'center',gap:5,padding:'7px 14px',
                            borderRadius:8,fontSize:12.5,cursor:'pointer',
                            fontWeight:editRefMode===r.value?700:400,
                            border:`1.5px solid ${editRefMode===r.value?'var(--primary)':'var(--border)'}`,
                            background:editRefMode===r.value?'var(--primary-light)':'transparent',
                            color:editRefMode===r.value?'var(--primary)':'var(--text-secondary)',
                            transition:'all 0.15s',
                          }}>
                          <Icon size={13}/>{r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Reference value */}
                <div className="form-group full">
                  <label>
                    {selectedRefMode?.label} Reference
                    {editRefMode !== 'cash' ? <span className="required"> *</span>
                      : <span style={{ fontSize:11,fontWeight:400,color:'var(--text-muted)',marginLeft:4 }}>(optional)</span>}
                  </label>
                  <div style={{ position:'relative' }}>
                    <Hash size={14} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                      color:'var(--text-muted)',pointerEvents:'none' }}/>
                    <input value={editRefValue}
                      onChange={e => { setEditRefValue(e.target.value); setRefError('') }}
                      placeholder={selectedRefMode?.placeholder||'Reference number'}
                      style={{ paddingLeft:34 }}/>
                  </div>
                  {refError && (
                    <div style={{ fontSize:12,color:'var(--danger)',marginTop:5,display:'flex',alignItems:'center',gap:5 }}>
                      <AlertCircle size={12}/>{refError}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    placeholder="Additional notes about this payment…" style={{ minHeight:60 }}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={savePayment}
                disabled={saving || editAdditional==='' || Number(editAdditional)<=0}>
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PAYMENT HISTORY MODAL ═══════ */}
      {histModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setHistModal(null)}>
          <div className="modal" style={{ maxWidth:540 }}>
            <div className="modal-header">
              <History size={18} color="var(--info)"/>
              <div className="modal-title">Payment History — {histModal.donorName}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setHistModal(null)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              {/* Summary */}
              <div style={{ display:'flex',gap:16,padding:'10px 0',marginBottom:16,
                borderBottom:'1px solid var(--border-light)',flexWrap:'wrap',alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600 }}>Total</div>
                  <div style={{ fontWeight:700,fontSize:17,fontFamily:'var(--font-display)' }}>{fmtCurrency(histModal.totalValue)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600 }}>Paid</div>
                  <div style={{ fontWeight:700,fontSize:17,fontFamily:'var(--font-display)',color:'var(--secondary)' }}>
                    {fmtCurrency(histModal.amountPaid||0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:600 }}>Remaining</div>
                  <div style={{ fontWeight:700,fontSize:17,fontFamily:'var(--font-display)',color:'var(--danger)' }}>
                    {fmtCurrency(Math.max(0,(histModal.totalValue||0)-(histModal.amountPaid||0)))}
                  </div>
                </div>
                <span className={`badge ${paymentStatusColor(histModal.paymentStatus)}`}
                  style={{ fontSize:12,marginLeft:'auto' }}>{histModal.paymentStatus}</span>
              </div>

              {(histModal.payHistory||[]).length === 0 ? (
                <div className="empty-state" style={{ padding:32 }}><p>No payment history yet.</p></div>
              ) : (
                <div>
                  {[...(histModal.payHistory||[])].reverse().map((h, i, arr) => {
                    const RefIcon = REF_MODES.find(r => r.value===h.refMode)?.icon || Hash
                    return (
                      <div key={i} style={{
                        display:'flex',alignItems:'flex-start',gap:14,padding:'14px 0',
                        borderBottom: i<arr.length-1 ? '1px solid var(--border-light)' : 'none',
                      }}>
                        <div style={{ width:38,height:38,borderRadius:10,flexShrink:0,background:'var(--secondary-light)',
                          display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <RefIcon size={16} color="var(--secondary)"/>
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                            <span style={{ fontWeight:700,fontSize:15,color:'var(--secondary)' }}>
                              +{fmtCurrency(h.amount)}
                            </span>
                            <span className="badge badge-muted" style={{ fontSize:10 }}>{refModeLabel(h.refMode)}</span>
                            {h.cumulative !== undefined && (
                              <span style={{ fontSize:12,color:'var(--text-muted)' }}>
                                total: {fmtCurrency(h.cumulative)}
                              </span>
                            )}
                          </div>
                          {h.refValue && (
                            <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:6,
                              padding:'5px 10px',background:'var(--bg)',borderRadius:6,
                              border:'1px solid var(--border-light)' }}>
                              <Hash size={11} color="var(--text-muted)"/>
                              <span style={{ fontSize:12,fontFamily:'monospace',color:'var(--text-secondary)',
                                flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                                {h.refValue}
                              </span>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyRef(h.refValue)}>
                                {copied===h.refValue ? <Check size={11} color="var(--secondary)"/> : <Copy size={11}/>}
                              </button>
                            </div>
                          )}
                          {h.notes && (
                            <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:5,fontStyle:'italic' }}>
                              {h.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign:'right',fontSize:12.5,color:'var(--text-muted)',flexShrink:0 }}>
                          {fmtDate(h.date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setHistModal(null)}>Close</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setHistModal(null); openEdit(histModal) }}>
                <Plus size={12}/> Record Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}