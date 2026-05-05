import { AlertCircle, CheckCircle, MapPin, Phone } from 'lucide-react'

/**
 * DonorDuplicateAlert — shown when mobile matches an existing donor.
 *
 * Props:
 *   donor         — existing donor object
 *   onUseExisting — () => void  — "Use This Donor" action
 *   onDismiss     — () => void  — dismiss / continue creating
 *   message       — optional override headline text
 */
export default function DonorDuplicateAlert({
  donor,
  onUseExisting,
  onDismiss,
  message,
}) {
  if (!donor) return null

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, marginBottom: 12,
      background: 'var(--warning-bg)',
      border: '1px solid rgba(245,158,11,0.35)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* headline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertCircle size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
          {message || 'A donor with this mobile already exists'}
        </span>
      </div>

      {/* donor summary */}
      <div style={{ fontSize: 12.5, color: '#92400E', paddingLeft: 23, lineHeight: 1.6 }}>
        <strong>{donor.name}</strong>

        {(donor.society || donor.sector || donor.city) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
            <MapPin size={10} />
            {[donor.society, donor.sector, donor.city].filter(Boolean).join(', ')}
          </span>
        )}

        {donor.mobile && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <Phone size={10} /> {donor.mobile}
          </span>
        )}

        <span style={{
          marginLeft: 8, fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          background: 'rgba(245,158,11,0.2)', padding: '1px 6px', borderRadius: 4,
        }}>
          {donor.id}
        </span>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 8, paddingLeft: 23, flexWrap: 'wrap' }}>
        {onUseExisting && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onUseExisting}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <CheckCircle size={12} /> Use This Donor
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onDismiss}
            style={{ fontSize: 12 }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}