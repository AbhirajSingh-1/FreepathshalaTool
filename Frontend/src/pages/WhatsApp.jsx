import { useState } from 'react'
import { MessageCircle, Edit2, Save, X, Send } from 'lucide-react'
import { waTemplates, donors, pickups } from '../data/mockData'
import { parseWATemplate, fmtDate } from '../utils/helpers'

export default function WhatsApp() {
  const [templates, setTemplates] = useState(waTemplates)
  const [editing, setEditing]     = useState(null)
  const [editMsg, setEditMsg]     = useState('')
  const [preview, setPreview]     = useState({ donorId:'', pickupId:'' })

  const previewDonor  = donors.find(d => d.id === preview.donorId)  || donors[0]
  const previewPickup = pickups.find(p => p.id === preview.pickupId) || pickups[0]

  const openEdit = (t) => { setEditing(t.id); setEditMsg(t.message) }
  const saveEdit = (id) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, message: editMsg } : t))
    setEditing(null)
  }

  return (
    <div className="page-body">
      <div className="alert-strip alert-info" style={{ marginBottom:20 }}>
        <MessageCircle size={15} style={{ flexShrink:0 }}/>
        <div>
          WhatsApp messages are sent via <strong>API / Firebase SMS</strong>.
          Templates use placeholders: <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:4 }}>{'{Donor Name}'}</code>{' '}
          <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:4 }}>{'{Amount}'}</code>{' '}
          <code style={{ background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:4 }}>{'{Next Pickup Date}'}</code>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header">
          <MessageCircle size={17} color="var(--secondary)"/>
          <div className="card-title">Preview With Donor Data</div>
        </div>
        <div className="card-body">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div className="form-group" style={{ flex:1, minWidth:200 }}>
              <label>Donor</label>
              <select value={preview.donorId} onChange={e => setPreview(p => ({...p, donorId:e.target.value}))}>
                {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex:1, minWidth:200 }}>
              <label>Pickup Record</label>
              <select value={preview.pickupId} onChange={e => setPreview(p => ({...p, pickupId:e.target.value}))}>
                {pickups.filter(p => p.status === 'Completed').map(p => <option key={p.id} value={p.id}>{p.donorName} — {fmtDate(p.date)}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div style={{ display:'grid', gap:20 }}>
        {templates.map(t => {
          const isEditing = editing === t.id
          const rendered  = parseWATemplate(t.message, previewDonor, previewPickup)

          return (
            <div key={t.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{t.name}</div>
                  <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:2 }}>Trigger: {t.trigger}</div>
                </div>
                {!isEditing ? (
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>
                    <Edit2 size={12}/> Edit Template
                  </button>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(t.id)}><Save size={12}/> Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}><X size={12}/></button>
                  </div>
                )}
              </div>
              <div className="card-body">
                <div className="two-col" style={{ gap:24, alignItems:'start' }}>
                  {/* Editor */}
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Template</div>
                    {isEditing ? (
                      <textarea
                        value={editMsg}
                        onChange={e => setEditMsg(e.target.value)}
                        style={{ minHeight:160, fontFamily:'monospace', fontSize:13 }}
                      />
                    ) : (
                      <pre style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', whiteSpace:'pre-wrap', lineHeight:1.65, background:'var(--bg)', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)' }}>
                        {t.message}
                      </pre>
                    )}
                  </div>

                  {/* WhatsApp Preview */}
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Preview</div>
                    <div className="wa-preview">
                      <div className="wa-bubble">
                        {rendered}
                        <div className="wa-time">{new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })} ✓✓</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop:12, width:'100%' }}>
                      <Send size={12}/> Send via WhatsApp API
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}