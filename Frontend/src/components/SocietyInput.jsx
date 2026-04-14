// Frontend/src/components/SocietyInput.jsx
// Reusable input that shows known societies as suggestions (datalist)
// but always allows typing a completely custom name.
import { useMemo } from 'react'
import { GURGAON_SOCIETIES, CITY_SECTORS } from '../data/mockData'

const DATALIST_ID_PREFIX = 'society-suggestions'
let _uid = 0

/**
 * SocietyInput
 * Props:
 *  city     — selected city string
 *  sector   — selected sector string
 *  value    — current society value
 *  onChange — (value: string) => void
 *  id       — optional unique id suffix (auto-generated if omitted)
 *  style    — optional extra input style
 */
export default function SocietyInput({ city, sector, value, onChange, id, style }) {
  const uid = useMemo(() => id || `soc-${++_uid}`, [id])
  const listId = `${DATALIST_ID_PREFIX}-${uid}`

  // Gather suggestions: sector-specific societies first, then all city societies
  const suggestions = useMemo(() => {
    if (city !== 'Gurgaon') return []
    if (sector && GURGAON_SOCIETIES[sector]) {
      return GURGAON_SOCIETIES[sector]
    }
    // If no sector selected, show all Gurgaon societies
    return Object.values(GURGAON_SOCIETIES).flat()
  }, [city, sector])

  const placeholder = sector
    ? 'Select or type society / colony…'
    : 'e.g. Green Park Residency'

  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={style}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {suggestions.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          {suggestions.length} known societies — or type a custom name
        </div>
      )}
    </>
  )
}