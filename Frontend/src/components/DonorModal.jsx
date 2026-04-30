// Frontend/src/components/DonorModal.jsx
import { useState } from 'react'
import { X, User, MapPin } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SocietyInput from './SocietyInput'

const EMPTY = {
  name: '', mobile: '', city: 'Gurgaon', sector: '', society: '', address: '',
}

export default function DonorModal({ onClose, onAdd }) {
  const { CITIES, CITY_SECTORS } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

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

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name   = 'Name is required'
    if (!form.mobile.trim() || form.mobile.length < 10) e.mobile = 'Valid 10-digit mobile required'
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
              <input
                value={form.mobile}
                onChange={e => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
              />
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
              <input
                list="donor-modal-sectors"
                value={form.sector}
                onChange={e => setField('sector', e.target.value)}
                disabled={!form.city}
                placeholder={form.city ? 'Type or choose sector' : 'Select city first'}
              />
              <datalist id="donor-modal-sectors">
                {sectors.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {/* Society — always allows custom via datalist */}
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
            disabled={saving || !form.name.trim() || !form.mobile.trim()}
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
