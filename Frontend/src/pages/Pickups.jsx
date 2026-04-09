import { useState, useEffect } from 'react'
import {
  Search, Plus, Edit2, Trash2, X, Truck, Download,
  ChevronDown, ChevronUp, Filter, IndianRupee, CheckSquare, Square, Package,
} from 'lucide-react'
import { fetchPickups, fetchDonors, fetchKabadiwalas, createPickup, updatePickup, deletePickup } from '../services/api'
import {
  RST_ITEMS, SKS_ITEMS, PICKUP_STATUSES, PAYMENT_STATUSES,
  POSTPONE_REASONS, PICKUP_MODES, CITIES, CITY_SECTORS,
} from '../data/mockData'
import { fmtDate, fmtCurrency, pickupStatusColor, paymentStatusColor, exportToExcel } from '../utils/helpers'
import DonorSearchSelect from '../components/DonorSearchSelect'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM = {
  donorId: '', donorName: '', society: '', sector: '', city: '',
  date: today(), status: 'Pending', pickupMode: 'Individual',
  type: 'RST',
  rstItems: [],
  sksItems: [],
  sksItemDetails: {},
  rstTotalWeight: '',
  rstWeightUnit: 'kg',
  totalValue: '', amountPaid: '', paymentStatus: 'Not Paid',
  kabadiwala: '', kabadiMobile: '',
  nextDate: '', postponeReason: '', notes: '',
}

const SKS_PACKAGING_OPTIONS = [
  { value: 'individual', label: 'Individual items' },
  { value: 'small_bag',  label: 'Small bag'        },
  { value: 'large_bag',  label: 'Large bag'        },
  { value: 'small_box',  label: 'Small box'        },
  { value: 'large_box',  label: 'Large box'        },
]

function RSTItemSelector({ rstItems, onChangeItems }) {
  const toggle = (item) => {
    if (rstItems.includes(item)) onChangeItems(rstItems.filter(i => i !== item))
    else onChangeItems([...rstItems, item])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {RST_ITEMS.map(item => {
        const checked = rstItems.includes(item)
        return (
          <button key={item} type="button" onClick={() => toggle(item)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20, fontSize: 12,
              border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
              background: checked ? 'var(--primary-light)' : 'transparent',
              color: checked ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: checked ? 600 : 400, transition: 'all 0.15s',
            }}>
            {checked ? <CheckSquare size={12} /> : <Square size={12} />}
            {item}
          </button>
        )
      })}
    </div>
  )
}

function SKSItemSelector({ sksItems, sksItemDetails, onChangeItems, onChangeDetail }) {
  const toggle = (item) => {
    if (sksItems.includes(item)) onChangeItems(sksItems.filter(i => i !== item))
    else onChangeItems([...sksItems, item])
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: sksItems.length > 0 ? 14 : 0 }}>
        {SKS_ITEMS.map(item => {
          const checked = sksItems.includes(item)
          return (
            <button key={item} type="button" onClick={() => toggle(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20, fontSize: 12,
                border: `1.5px solid ${checked ? 'var(--info)' : 'var(--border)'}`,
                background: checked ? 'var(--info-bg)' : 'transparent',
                color: checked ? 'var(--info)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: checked ? 600 : 400, transition: 'all 0.15s',
              }}>
              {checked ? <CheckSquare size={12} /> : <Square size={12} />}
              {item}
            </button>
          )
        })}
      </div>
      {sksItems.length > 0 && (
        <div style={{ background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', padding: '7px 12px', background: 'var(--border-light)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Item</span><span>Count</span><span>Packaging</span>
          </div>
          {sksItems.map((item, idx) => {
            const detail = sksItemDetails[item] || { quantity: '', packaging: 'individual' }
            return (
              <div key={item} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', padding: '8px 12px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item}</span>
                <input type="number" min={1} step={1} inputMode="numeric" placeholder="1" value={detail.quantity}
                  onChange={e => onChangeDetail(item, { ...detail, quantity: e.target.value })}
                  style={{ width: '100%', padding: '5px 8px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--surface)' }} />
                <select value={detail.packaging} onChange={e => onChangeDetail(item, { ...detail, packaging: e.target.value })}
                  style={{ padding: '5px 8px', fontSize: 12, marginLeft: 8, border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--surface)' }}>
                  {SKS_PACKAGING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )
          })}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-secondary)', background: 'var(--info-bg)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Total: <strong style={{ color: 'var(--info)' }}>{sksItems.reduce((s, item) => s + (Number(sksItemDetails[item]?.quantity) || 0), 0)}</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Pickups({ triggerAddPickup, onAddPickupDone }) {
  const [pickups, setPickups]         = useState([])
  const [donors, setDonors]           = useState([])
  const [kabadiwalas, setKabadiwalas] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  // Filters
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterMode, setFilterMode]     = useState('All')
  const [filterCity, setFilterCity]     = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [filterKab, setFilterKab]       = useState('All')
  const [filterPayment, setFilterPayment] = useState('All')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [showFilters, setShowFilters]   = useState(false)
  const [expandedId, setExpandedId]     = useState(null)

  const filterSectors = filterCity ? (CITY_SECTORS[filterCity] || []) : []
  const formSectors   = CITY_SECTORS[form.city] || []
  const kabNames      = kabadiwalas.map(k => k.name)
  const selectedDonor = donors.find(d => d.id === form.donorId) || null

  useEffect(() => {
    Promise.all([fetchPickups(), fetchDonors(), fetchKabadiwalas()])
      .then(([p, d, k]) => { setPickups(p); setDonors(d); setKabadiwalas(k); setLoading(false) })
  }, [])

  useEffect(() => {
    if (triggerAddPickup) { openModal(); onAddPickupDone?.() }
  }, [triggerAddPickup, onAddPickupDone])

  const openModal = (pickup = null) => {
    setEditing(pickup)
    setForm(pickup ? { ...EMPTY_FORM, ...pickup } : EMPTY_FORM)
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const setField = (key, val) => setForm(f => {
    const next = { ...f, [key]: val }
    if (key === 'city') next.sector = ''
    if (key === 'donorId') {
      if (!val) { next.donorName = ''; next.society = ''; next.sector = ''; next.city = '' }
      const donor = donors.find(d => d.id === val)
      if (donor) { next.donorName = donor.name; next.society = donor.society || ''; next.sector = donor.sector || ''; next.city = donor.city || '' }
    }
    if (key === 'kabadiwala') {
      const kab = kabadiwalas.find(k => k.name === val)
      next.kabadiMobile = kab?.mobile || ''
    }
    if (key === 'amountPaid' || key === 'totalValue') {
      const total = Number(key === 'totalValue' ? val : next.totalValue) || 0
      const paid  = Number(key === 'amountPaid'  ? val : next.amountPaid)  || 0
      if (total === 0)        next.paymentStatus = 'Not Paid'
      else if (paid >= total) next.paymentStatus = 'Paid'
      else if (paid > 0)      next.paymentStatus = 'Partially Paid'
      else                    next.paymentStatus = 'Not Paid'
    }
    return next
  })

  const setRSTItems = (items) => setForm(f => ({ ...f, rstItems: items }))
  const setSKSItems = (items) => setForm(f => ({ ...f, sksItems: items }))
  const setSKSDetail = (item, detail) => setForm(f => ({ ...f, sksItemDetails: { ...f.sksItemDetails, [item]: detail } }))

  const save = async () => {
    if (!form.donorId || !form.date) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        totalValue: Number(form.totalValue) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        type: form.rstItems.length > 0 && form.sksItems.length > 0 ? 'RST+SKS'
            : form.rstItems.length > 0 ? 'RST'
            : form.sksItems.length > 0 ? 'SKS' : 'RST',
      }
      if (editing) {
        const updated = await updatePickup(editing.id, payload)
        setPickups(ps => ps.map(p => p.id === editing.id ? updated : p))
      } else {
        const newP = await createPickup(payload)
        setPickups(ps => [newP, ...ps])
      }
      closeModal()
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this pickup record?')) return
    await deletePickup(id)
    setPickups(ps => ps.filter(p => p.id !== id))
  }

  const handleExport = () => {
    exportToExcel(filtered.map(p => ({
      'Pickup ID': p.id, Donor: p.donorName, Date: p.date,
      City: p.city, Sector: p.sector, Society: p.society,
      Mode: p.pickupMode, Type: p.type, Status: p.status,
      'RST Items': (p.rstItems || []).join(', '),
      'SKS Items': (p.sksItems || []).join(', '),
      'Weight': p.rstTotalWeight ? `${p.rstTotalWeight} ${p.rstWeightUnit || 'kg'}` : '',
      'Total Value (₹)': p.totalValue,
      'Amount Paid (₹)': p.amountPaid,
      'Payment Status': p.paymentStatus,
      Kabadiwala: p.kabadiwala,
      'Next Date': p.nextDate,
      Notes: p.notes,
    })), 'Pickups_Export')
  }

  const q = search.toLowerCase()
  const filtered = pickups.filter(p => {
    const matchQ      = !q || p.donorName?.toLowerCase().includes(q) || p.society?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All'  || p.status === filterStatus
    const matchCity   = !filterCity   || p.city === filterCity
    const matchSector = !filterSector || p.sector === filterSector
    const matchKab    = filterKab === 'All'     || p.kabadiwala === filterKab
    const matchMode   = filterMode === 'All'    || p.pickupMode === filterMode
    const matchPay    = filterPayment === 'All' || p.paymentStatus === filterPayment
    const matchFrom   = !dateFrom || p.date >= dateFrom
    const matchTo     = !dateTo   || p.date <= dateTo
    return matchQ && matchStatus && matchCity && matchSector && matchKab && matchMode && matchPay && matchFrom && matchTo
  }).sort((a, b) => b.date.localeCompare(a.date))

  const hasAdvFilters = filterCity || filterSector || filterKab !== 'All' || filterPayment !== 'All' || dateFrom || dateTo

  return (
    <div className="page-body">

      {/* ── Primary Filter Row ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {/* Row 1: Search + status + mode + buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '2 1 180px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              placeholder="Search donor, society, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 13, width: '100%' }}
            />
          </div>
          {/* Status */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ flex: '1 1 120px', minWidth: 0, fontSize: 13 }}>
            <option value="All">All Status</option>
            {PICKUP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {/* Mode */}
          <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
            style={{ flex: '1 1 110px', minWidth: 0, fontSize: 13 }}>
            <option value="All">All Modes</option>
            <option value="Individual">Individual</option>
            <option value="Drive">Drive</option>
          </select>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className={`btn btn-sm ${showFilters ? 'btn-outline' : 'btn-ghost'}`}
              onClick={() => setShowFilters(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 12 }}
            >
              <Filter size={13} />
              {hasAdvFilters
                ? <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {[filterCity, filterSector, filterKab !== 'All' ? filterKab : '', filterPayment !== 'All' ? filterPayment : '', dateFrom, dateTo].filter(Boolean).length}
                  </span>
                : 'More'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ padding: '6px 10px', fontSize: 12 }}>
              <Download size={13} />
              <span className="hide-xs">Export</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal()} style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
              <Plus size={13} /> Record
            </button>
          </div>
        </div>

        {/* Row 2: Advanced filters (collapsible) */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
            padding: 12,
            background: 'var(--bg)',
            borderRadius: 10,
            border: '1px solid var(--border-light)',
          }}>
            <select value={filterKab} onChange={e => setFilterKab(e.target.value)} style={{ fontSize: 12 }}>
              <option value="All">All Kabadiwalas</option>
              {kabNames.map(k => <option key={k}>{k}</option>)}
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} style={{ fontSize: 12 }}>
              <option value="All">All Payments</option>
              {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterSector('') }} style={{ fontSize: 12 }}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterSector} onChange={e => setFilterSector(e.target.value)} disabled={!filterCity} style={{ fontSize: 12 }}>
              <option value="">{filterCity ? 'All Sectors' : 'City First'}</option>
              {filterSectors.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 10.5, fontWeight: 600 }}>From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ fontSize: 12 }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 10.5, fontWeight: 600 }}>To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ fontSize: 12 }} />
            </div>
            {hasAdvFilters && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 34 }}
                onClick={() => { setFilterCity(''); setFilterSector(''); setFilterKab('All'); setFilterPayment('All'); setDateFrom(''); setDateTo('') }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        <strong>{filtered.length}</strong> pickup record{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Truck size={24} /></div>
          <h3>No pickups found</h3>
          <p>Adjust search or filters, or record a new pickup.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(p => {
            const isExpanded = expandedId === p.id
            const isOverdue  = p.status === 'Pending' && p.date < today()

            return (
              <div key={p.id} className="card" style={{ overflow: 'hidden', borderLeft: isOverdue ? '4px solid var(--danger)' : undefined }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', flexWrap: 'nowrap' }}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={15} color="var(--info)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }} className="truncate">{p.donorName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }} className="truncate">
                      {fmtDate(p.date)} · {p.society || p.sector || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className={`badge ${p.type === 'RST' ? 'badge-success' : p.type === 'SKS' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>{p.type}</span>
                    <span className={`badge ${pickupStatusColor(p.status)}`} style={{ fontSize: 10 }}>{isOverdue ? 'Overdue' : p.status}</span>
                    {p.totalValue > 0 && (
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{fmtCurrency(p.totalValue)}</span>
                    )}
                    {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 12.5 }}>
                      {p.pickupMode && (
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Mode</div>
                          <span className="badge badge-muted" style={{ fontSize: 11 }}>{p.pickupMode}</span>
                        </div>
                      )}
                      {p.kabadiwala && (
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Kabadiwala</div>
                          <div style={{ fontWeight: 600 }}>{p.kabadiwala}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Payment</div>
                        <span className={`badge ${paymentStatusColor(p.paymentStatus)}`} style={{ fontSize: 11 }}>{p.paymentStatus}</span>
                      </div>
                      {p.rstTotalWeight && (
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Weight</div>
                          <div style={{ fontWeight: 600 }}>{p.rstTotalWeight} {p.rstWeightUnit || 'kg'}</div>
                        </div>
                      )}
                      {p.nextDate && (
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Next Pickup</div>
                          <div style={{ fontWeight: 600 }}>{fmtDate(p.nextDate)}</div>
                        </div>
                      )}
                    </div>

                    {p.rstItems?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: 6 }}>RST Items</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {p.rstItems.map(item => (
                            <span key={item} style={{ background: 'var(--secondary-light)', color: 'var(--secondary)', fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{item}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.sksItems?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', marginBottom: 6 }}>SKS Items</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {p.sksItems.map(item => {
                            const d = p.sksItemDetails?.[item]
                            const pkg = SKS_PACKAGING_OPTIONS.find(o => o.value === d?.packaging)?.label
                            return (
                              <span key={item} style={{ background: 'var(--info-bg)', color: 'var(--info)', fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                {item}{d?.quantity && ` · ${d.quantity}`}{pkg && ` (${pkg})`}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {p.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>{p.notes}</div>}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openModal(p)}><Edit2 size={12} /> Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth: 680, width: '96vw' }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Pickup' : 'Record Pickup'}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-grid">
                {/* Donor */}
                <div className="form-group full">
                  <label>Donor <span className="required">*</span></label>
                  <DonorSearchSelect
                    donors={donors.filter(d => d.status !== 'Lost')}
                    selectedDonor={selectedDonor}
                    onSelect={(donor) => setField('donorId', donor?.id || '')}
                  />
                  {selectedDonor && (
                    <div style={{ padding: '10px 14px', background: 'var(--secondary-light)', borderRadius: 8, fontSize: 12.5, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <Package size={13} />
                      {[selectedDonor.society, selectedDonor.sector, selectedDonor.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Pickup Date <span className="required">*</span></label>
                  <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Next Pickup Date</label>
                  <input type="date" value={form.nextDate} onChange={e => setField('nextDate', e.target.value)} />
                </div>
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
                      <option value="">Select reason</option>
                      {POSTPONE_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {/* RST Items */}
                <div className="form-group full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="badge badge-success" style={{ fontSize: 10 }}>RST</span>
                    Raddi Se Tarakki Items
                  </label>
                  <RSTItemSelector rstItems={form.rstItems} onChangeItems={setRSTItems} />
                </div>

                {/* SKS Items */}
                <div className="form-group full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="badge badge-info" style={{ fontSize: 10 }}>SKS</span>
                    Sammaan Ka Saaman Items
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(count + packaging)</span>
                  </label>
                  <SKSItemSelector sksItems={form.sksItems} sksItemDetails={form.sksItemDetails} onChangeItems={setSKSItems} onChangeDetail={setSKSDetail} />
                </div>

                {/* Payment Section */}
                <div className="form-group full">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IndianRupee size={14} color="var(--warning)" /> Payment Details
                  </label>
                  <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--border-light)' }}>
                    <div className="form-grid">
                      {/* Weight */}
                      <div className="form-group full" style={{ margin: 0 }}>
                        <label>Total RST Weight</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="text" inputMode="decimal" placeholder="0"
                            value={form.rstTotalWeight}
                            onChange={e => setField('rstTotalWeight', e.target.value.replace(/[^0-9.]/g, ''))}
                            style={{ width: 100 }}
                          />
                          <select value={form.rstWeightUnit} onChange={e => setField('rstWeightUnit', e.target.value)}
                            style={{ minWidth: 70 }}>
                            <option value="kg">kg</option>
                            <option value="gm">gm</option>
                          </select>
                        </div>
                      </div>
                      {/* Total Value */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Total Value (₹) <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(Kabadiwala → FP)</span></label>
                        <input type="text" inputMode="numeric" placeholder="0" value={form.totalValue}
                          onChange={e => setField('totalValue', e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                      {/* Amount Paid */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Amount Paid (₹)</label>
                        <input type="text" inputMode="numeric" placeholder="0" value={form.amountPaid}
                          onChange={e => setField('amountPaid', e.target.value.replace(/[^0-9]/g, ''))} />
                      </div>
                      {/* Payment Status */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Payment Status</label>
                        <select value={form.paymentStatus} onChange={e => setField('paymentStatus', e.target.value)}>
                          {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                        <span className={`badge ${form.paymentStatus === 'Paid' ? 'badge-success' : form.paymentStatus === 'Partially Paid' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 12 }}>
                          {form.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kabadiwala */}
                <div className="form-group">
                  <label>Kabadiwala</label>
                  <select value={form.kabadiwala} onChange={e => setField('kabadiwala', e.target.value)}>
                    <option value="">None / Unassigned</option>
                    {kabadiwalas.map(k => <option key={k.id} value={k.name}>{k.name} — {k.area}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kabadiwala Mobile</label>
                  <input value={form.kabadiMobile} onChange={e => setField('kabadiMobile', e.target.value)} placeholder="Auto-filled" maxLength={10} inputMode="numeric" />
                </div>
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
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional notes…" style={{ minHeight: 64 }} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save}
                disabled={saving || !form.donorId || !form.date || (form.status === 'Postponed' && !form.postponeReason)}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Record Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}