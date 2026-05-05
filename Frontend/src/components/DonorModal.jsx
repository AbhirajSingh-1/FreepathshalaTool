// Frontend/src/components/DonorModal.jsx
import { useState, useEffect, useRef } from 'react'
import { X, User, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SocietyInput from './SocietyInput'
import SectorSearchSelect from './SectorSearchSelect'
import { checkDonorByMobile } from '../services/api'

const EMPTY = {
  name: '', mobile: '', city: 'Gurgaon', sector: '', society: '', address: '',
}

export default function DonorModal({ onClose, onAdd }) {
  const { CITIES, CITY_SECTORS, upsertLocation } = useApp()
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  // Mobile dedup state
  const [mobileCheck, setMobileCheck] = useState({
    status: 'idle', // 'idle' | 'checking' | 'found' | 'clear'
    existing: null,
  })
  const debounceRef = useRef(null)

  const sectors = CITY_SECTORS[form.city] || []

  const setField = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'city')   { next.sector = ''; next.society = '' }
      if (key === 'sector') { next.society = '' }
      return next
    })
    setErrors(e => ({ ...e, [key]: '' }))
  }

  // ── Debounced mobile lookup ──────────────────────────────────────────────
  useEffect(() => {
    const mobile = form.mobile.replace(/\D/g, '').slice(-10)
    if (mobile.length < 10) {
      setMobileCheck({ status: 'idle', existing: null })
      return
    }

    setMobileCheck(prev => ({ ...prev, status: 'checking' }))
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await checkDonorByMobile(mobile)
        const list = Array.isArray(results) ? results : []
        if (list.length > 0) {
          setMobileCheck({ status: 'found', existing: list[0] })
        } else {
          setMobileCheck({ status: 'clear', existing: null })
        }
      } catch {
        setMobileCheck({ status: 'clear', existing: null })
      }
    }, 500)

    return () => clearTimeout(debounceRef.current)
  }, [form.mobile])

  // ── Use the existing donor directly ──────────────────────────────────────
  const handleUseExisting = () => {
    onAdd(mobileCheck.existing) // parent receives the existing donor as the "added" record
    onClose()
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name   = 'Name is required'
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, '').length < 10)
      e.mobile = 'Valid 10-digit mobile required'
    if (!form.city)          e.city   = 'City is required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      await onAdd({ ...form, house: form.address })
      setSaving(false)
    } catch {
      setSaving(false)
    }
  }

  const { status: mStatus, existing } = mobileCheck

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, width: '95vw' }}>
        {/* Header */}
        <div className="modal-header">
          <User size={18} color="var(--primary)" />
          <div className="modal-title">Add New Donor</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── Duplicate alert ── */}
          {mStatus === 'found' && existing && (
            <div style={{
              marginBottom: 14, padding: '12px 14px', borderRadius: 10,
              background: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                  A donor with this mobile already exists
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#92400E', paddingLeft: 23 }}>
                <strong>{existing.name}</strong>
                {existing.society && ` · ${existing.society}`}
                {existing.sector && `, ${existing.sector}`}
                {existing.city && `, ${existing.city}`}
                <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11,
                  background: 'rgba(245,158,11,0.2)', padding: '1px 6px', borderRadius: 4 }}>
                  {existing.id}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 23 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleUseExisting}
                  style={{ fontSize: 12 }}
                >
                  <CheckCircle size={12} /> Use This Donor
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setMobileCheck({ status: 'idle', existing: null })}
                  style={{ fontSize: 12 }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="form-grid">
            {/* Name */}
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Anjali Sharma"
                autoFocus
              />
              {errors.name && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 3 }}>{errors.name}</div>}
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label>Mobile Number <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  value={form.mobile}
                  onChange={e => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                  style={{ paddingRight: mStatus === 'checking' ? 36 : undefined }}
                />
                {mStatus === 'checking' && (
                  <Loader size={14} style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
                {mStatus === 'clear' && (
                  <CheckCircle size={14} style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--secondary)',
                  }} />
                )}
              </div>
              {errors.mobile && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 3 }}>{errors.mobile}</div>}
            </div>

            {/* City */}
            <div className="form-group">
              <label>City <span className="required">*</span></label>
              <input
                list="donor-modal-cities"
                value={form.city}
                onChange={e => setField('city', e.target.value)}
                placeholder="Type or choose city"
              />
              <datalist id="donor-modal-cities">
                {CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
              {errors.city && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 3 }}>{errors.city}</div>}
            </div>

            {/* Sector */}
            <div className="form-group">
              <label>Sector / Area</label>
              <SectorSearchSelect
                options={sectors}
                value={form.sector}
                onChange={(val) => setField('sector', val)}
                disabled={!form.city}
                placeholder={form.city ? 'Search or select sector' : 'Select city first'}
                onAddOption={async (sectorName) => {
                  await upsertLocation({ city: form.city, sector: sectorName })
                  return sectorName
                }}
                addLabel="Add sector"
              />
            </div>

            {/* Society */}
            <div className="form-group full">
              <label>Society / Colony</label>
              <SocietyInput
                city={form.city}
                sector={form.sector}
                value={form.society}
                onChange={val => setField('society', val)}
                id="donor-modal"
              />
            </div>

            {/* Address */}
            <div className="form-group">
              <label>House / Flat No. <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                value={form.address}
                onChange={e => setField('address', e.target.value)}
                placeholder="e.g. A-101, Flat 3B"
              />
            </div>
          </div>

          {/* Preview chip */}
          {(form.sector || form.society) && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'var(--secondary-light)', borderRadius: 8,
              fontSize: 12.5, color: 'var(--secondary)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <MapPin size={13} />
              {[form.society, form.sector, form.city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.mobile.trim() || mStatus === 'checking'}
          >
            {saving ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%' }} />
                Adding…
              </>
            ) : '+ Add Donor'}
          </button>
        </div>
      </div>
    </div>
  )
}