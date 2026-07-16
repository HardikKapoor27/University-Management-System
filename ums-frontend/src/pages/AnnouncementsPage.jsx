import { useState, useEffect } from 'react'
import { announcementAPI } from '../services/api'
import { Plus, Trash2, X, Megaphone, Bell } from 'lucide-react'
import { Modal, ConfirmModal, EmptyState, Loader } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../utils/helpers'

const EMPTY = { title:'', message:'', targetRole:'ALL', priority:'MEDIUM', expiresAt:'' }

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const canPost  = ['FACULTY','ADMIN'].includes(user?.role)
  const isAdmin  = user?.role === 'ADMIN'
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      // ALL roles call getMine() — backend filters by their role
      // Admin can also call getAll() for management view
      const res = isAdmin ? await announcementAPI.getAll() : await announcementAPI.getMine()
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch(_) { setItems([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title || !form.message) return alert('Title and message are required')
    setSaving(true)
    try {
      await announcementAPI.create({ ...form, expiresAt: form.expiresAt || null })
      setShowForm(false); setForm(EMPTY); load()
    } catch(e) { alert(e.response?.data?.message || 'Error posting announcement') }
    finally { setSaving(false) }
  }

  const fv = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const priorityStyle = {
    LOW:    { badge:'badge-muted',   bar:'var(--text-3)' },
    MEDIUM: { badge:'badge-accent',  bar:'var(--accent)' },
    HIGH:   { badge:'badge-warning', bar:'var(--warning)' },
    URGENT: { badge:'badge-danger',  bar:'var(--danger)' },
  }
  const targetBadge = { ALL:'badge-accent', STUDENT:'badge-success', FACULTY:'badge-info', ADMIN:'badge-muted' }

  const pageTitle = 'Announcements'

  return (
    <>
      <Topbar title={pageTitle}/>
      <div className="page animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {user?.role === 'STUDENT' && 'Notices from your university and faculty'}
              {user?.role === 'FACULTY' && 'Notices from administration and department'}
              {user?.role === 'ADMIN'   && 'Manage all university announcements'}
            </p>
          </div>
          {canPost && (
            <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setShowForm(true) }}>
              <Plus size={15}/> Post Announcement
            </button>
          )}
        </div>

        {loading
          ? <Loader full/>
          : items.length === 0
          ? (
            <EmptyState icon={Megaphone} title="No announcements yet"
              subtitle={canPost ? 'Post an announcement to notify your audience' : 'Nothing posted yet — check back later'}/>
          )
          : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {items.map(a => {
                const ps = priorityStyle[a.priority] || priorityStyle.MEDIUM
                return (
                  <div key={a.id} style={{
                    background:'var(--bg-card)', border:'1px solid var(--border)',
                    borderRadius:14, display:'flex', overflow:'hidden',
                    transition:'border-color 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {/* Priority bar */}
                    <div style={{ width:4, background:ps.bar, flexShrink:0 }}/>
                    <div style={{ flex:1, padding:'16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15, marginBottom:7, letterSpacing:'-0.2px' }}>{a.title}</div>
                          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                            <span className={`badge ${ps.badge}`}>{a.priority}</span>
                            <span className={`badge ${targetBadge[a.targetRole] || 'badge-muted'}`}>
                              {a.targetRole === 'ALL' ? 'Everyone' : `${a.targetRole} only`}
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button className="btn btn-ghost btn-icon btn-sm"
                              onClick={async () => { await announcementAPI.deactivate(a.id); load() }} title="Deactivate">
                              <X size={13}/>
                            </button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDelTarget(a)}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65, marginBottom:10 }}>{a.message}</p>
                      <div style={{ fontSize:11, color:'var(--text-3)', display:'flex', gap:16, flexWrap:'wrap' }}>
                        <span>By <strong style={{ color:'var(--text-2)' }}>{a.postedBy}</strong></span>
                        <span>{formatDateTime(a.createdAt)}</span>
                        {a.expiresAt && <span>Expires {formatDateTime(a.expiresAt)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {showForm && (
        <Modal title="Post Announcement" onClose={() => setShowForm(false)}>
          <div className="form-group"><label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => fv('title', e.target.value)} placeholder="Announcement title"/></div>
          <div className="form-group"><label className="form-label">Message *</label>
            <textarea className="form-textarea" value={form.message} onChange={e => fv('message', e.target.value)}
              placeholder="Write your announcement here…" rows={4}/></div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Target Audience</label>
              <select className="form-select" value={form.targetRole} onChange={e => fv('targetRole', e.target.value)}>
                <option value="ALL">Everyone</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="ADMIN">Admin Only</option>
              </select></div>
            <div className="form-group"><label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => fv('priority', e.target.value)}>
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
              </select></div>
          </div>
          <div className="form-group"><label className="form-label">Expires At (optional)</label>
            <input className="form-input" type="datetime-local" value={form.expiresAt} onChange={e => fv('expiresAt', e.target.value)}/>
            <p className="form-hint">Leave empty for no expiry</p></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Loader/> : 'Post Announcement'}</button>
          </div>
        </Modal>
      )}

      {delTarget && (
        <ConfirmModal title="Delete Announcement" message={`Permanently delete "${delTarget.title}"?`}
          onConfirm={async () => { await announcementAPI.delete(delTarget.id); setDelTarget(null); load() }}
          onCancel={() => setDelTarget(null)} danger/>
      )}
    </>
  )
}
