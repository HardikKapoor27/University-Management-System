import { useState, useEffect } from 'react'
import { examAPI, courseAPI } from '../services/api'
import { Plus, Send, Trash2, FileText, Calendar, Clock, Lock } from 'lucide-react'
import { Modal, ConfirmModal, EmptyState, Loader } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../utils/helpers'

const EMPTY = { title:'', type:'MIDTERM', scheduledAt:'', venue:'', maxMarks:100, durationMinutes:180 }

export default function ExamsPage() {
  const { user }   = useAuth()
  const isStudent  = user?.role === 'STUDENT'
  const canManage  = ['FACULTY','ADMIN'].includes(user?.role)
  const [exams, setExams]     = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')   // ALL | published | draft
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      // ALL roles call getAll() — backend decides what to return
      const r = await examAPI.getAll()
      setExams(Array.isArray(r.data) ? r.data : [])
    } catch(_) { setExams([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    courseAPI.getAll({ page:0, size:100 }).then(r => setCourses(r.data.content || r.data || [])).catch(() => {})
  }, [])

  const filtered = exams.filter(e => {
    if (filter === 'published') return e.isPublished
    if (filter === 'draft')     return !e.isPublished
    return true
  })

  const publish = async (id) => {
    try { await examAPI.publish(id); load() }
    catch(e) { alert(e.response?.data?.message || 'Error') }
  }

  const save = async () => {
    if (!form.title || !courseId) return alert('Title and course are required')
    setSaving(true)
    try { await examAPI.create(form, courseId); setShowForm(false); load() }
    catch(e) { alert(e.response?.data?.message || 'Error scheduling exam') }
    finally { setSaving(false) }
  }

  const fv = (k, v) => setForm(p => ({ ...p, [k]:v }))

  const typeBadge = {
    MIDTERM:'badge-warning', FINAL:'badge-danger', QUIZ:'badge-info',
    ASSIGNMENT:'badge-muted', PRACTICAL:'badge-teal', VIVA:'badge-accent'
  }

  return (
    <>
      <Topbar title="Exams"/>
      <div className="page animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Exams</h1>
            <p className="page-subtitle">
              {isStudent ? 'Your upcoming and past examinations' : 'Manage examinations and assessments'}
            </p>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setCourseId(''); setShowForm(true) }}>
              <Plus size={15}/> Schedule Exam
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[['ALL','All Exams'],['published','Published'],['draft','Drafts']].map(([val, label]) => (
            (!isStudent || val !== 'draft') && (
              <button key={val} onClick={() => setFilter(val)}
                className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}>
                {label}
                <span style={{ marginLeft:4, fontSize:11, opacity:0.7 }}>
                  ({val === 'ALL' ? exams.length : exams.filter(e => val==='published' ? e.isPublished : !e.isPublished).length})
                </span>
              </button>
            )
          ))}
        </div>

        {loading
          ? <Loader full/>
          : filtered.length === 0
          ? <EmptyState icon={FileText} title="No exams found" subtitle={
              isStudent ? 'No published exams yet — check back later' : 'Schedule an exam to get started'
            }/>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:16 }}>
              {filtered.map(e => (
                <div key={e.id} style={{
                  background:'var(--bg-card)', border:'1px solid var(--border)',
                  borderRadius:14, overflow:'hidden', transition:'border-color 0.15s, transform 0.15s'
                }}
                  onMouseEnter={ev => { ev.currentTarget.style.borderColor='var(--border-hi)'; ev.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={ev => { ev.currentTarget.style.borderColor='var(--border)';   ev.currentTarget.style.transform='' }}
                >
                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
                      <span className={`badge ${typeBadge[e.type] || 'badge-muted'}`}>{e.type}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {e.isPublished
                          ? <span className="badge badge-success">Published</span>
                          : <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-3)' }}>
                              <Lock size={10}/> Draft
                            </span>
                        }
                        {canManage && !e.isPublished && (
                          <button className="btn btn-ghost btn-sm" onClick={() => publish(e.id)}
                            style={{ color:'var(--accent)', padding:'3px 9px', fontSize:11 }}>
                            <Send size={10}/> Publish
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:5, letterSpacing:'-0.2px' }}>{e.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:14 }}>
                      {e.course?.title || '—'}
                      {e.course?.courseCode && <span style={{ fontFamily:'var(--mono)', marginLeft:6, fontSize:11,
                        background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4, color:'var(--accent)' }}>
                        {e.course.courseCode}
                      </span>}
                    </div>
                  </div>

                  <div style={{ padding:'12px 20px', background:'var(--bg-elevated)',
                    borderTop:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      [Calendar, 'Date', formatDateTime(e.scheduledAt)],
                      [FileText, 'Venue', e.venue || '—'],
                      [FileText, 'Max Marks', `${e.maxMarks} marks`],
                      [Clock,    'Duration', e.durationMinutes ? `${e.durationMinutes} min` : 'Open'],
                    ].map(([Icon, label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:12, fontWeight:500 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {canManage && (
                    <div style={{ padding:'10px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => setDelTarget(e)}>
                        <Trash2 size={12}/> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>

      {showForm && (
        <Modal title="Schedule Exam" onClose={() => setShowForm(false)} wide>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Exam Title *</label>
              <input className="form-input" value={form.title} onChange={e => fv('title', e.target.value)} placeholder="e.g. Midterm — CS301"/></div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => fv('type', e.target.value)}>
                {['MIDTERM','FINAL','QUIZ','ASSIGNMENT','PRACTICAL','VIVA'].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Course *</label>
              <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Scheduled At</label>
              <input className="form-input" type="datetime-local" value={form.scheduledAt} onChange={e => fv('scheduledAt', e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Venue</label>
              <input className="form-input" value={form.venue} onChange={e => fv('venue', e.target.value)} placeholder="Hall A, Lab 3…"/></div>
            <div className="form-group"><label className="form-label">Max Marks</label>
              <input className="form-input" type="number" value={form.maxMarks} onChange={e => fv('maxMarks', +e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" value={form.durationMinutes} onChange={e => fv('durationMinutes', +e.target.value)}/>
              <p className="form-hint">Leave 0 for open-duration assignments</p></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Loader/> : 'Schedule Exam'}</button>
          </div>
        </Modal>
      )}

      {delTarget && (
        <ConfirmModal title="Delete Exam" message={`Delete "${delTarget.title}"? All results for this exam will also be removed.`}
          onConfirm={async () => { await examAPI.delete(delTarget.id); setDelTarget(null); load() }}
          onCancel={() => setDelTarget(null)} danger/>
      )}
    </>
  )
}
