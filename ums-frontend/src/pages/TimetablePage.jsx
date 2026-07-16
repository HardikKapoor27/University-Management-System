import { useState, useEffect } from 'react'
import { timetableAPI, courseAPI, facultyAPI } from '../services/api'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { Modal, ConfirmModal, EmptyState, Loader } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import { DAYS_ORDER, DAY_LABELS } from '../utils/helpers'

export default function TimetablePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [sem, setSem] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ dayOfWeek:'MONDAY', startTime:'09:00', endTime:'10:00', room:'' })
  const [courseId, setCourseId] = useState('')
  const [facId, setFacId] = useState('')
  const [saving, setSaving] = useState(false)
  const [delTarget, setDelTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const r = await timetableAPI.getBySem(sem); setSlots(r.data) }
    catch(_) { setSlots([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [sem])
  useEffect(() => {
    courseAPI.getAll({page:0,size:100}).then(r=>setCourses(r.data.content||r.data||[])).catch(()=>{})
    facultyAPI.getAll({page:0,size:100}).then(r=>setFaculty(r.data.content||r.data||[])).catch(()=>{})
  }, [])

  const save = async () => {
    if (!courseId) return alert('Course is required')
    setSaving(true)
    try {
      await timetableAPI.create({...form, semester:sem}, courseId, facId)
      setShowForm(false); load()
    } catch(e) { alert(e.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }

  const fv = (k,v) => setForm(p=>({...p,[k]:v}))
  const byDay = DAYS_ORDER.reduce((acc,d) => { acc[d]=slots.filter(s=>s.dayOfWeek===d); return acc }, {})

  const SLOT_COLORS = ['#7c6af7','#22d3c8','#f59e0b','#f43f5e','#22c55e','#3b82f6','#a855f7','#ec4899']
  const courseColorMap = {}
  let colorIdx = 0
  slots.forEach(s => {
    if (s.course?.id && !courseColorMap[s.course.id]) {
      courseColorMap[s.course.id] = SLOT_COLORS[colorIdx % SLOT_COLORS.length]
      colorIdx++
    }
  })

  return (
    <>
      <Topbar title="Timetable"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Timetable</h1>
            <p className="page-subtitle">Weekly class schedule for Semester {sem}</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={()=>{setForm({dayOfWeek:'MONDAY',startTime:'09:00',endTime:'10:00',room:''});setCourseId('');setFacId('');setShowForm(true)}}>
              <Plus size={15}/> Add Slot
            </button>
          )}
        </div>

        {/* Semester tabs */}
        <div style={{display:'flex',gap:4,marginBottom:22,flexWrap:'wrap'}}>
          {[1,2,3,4,5,6,7,8].map(s=>(
            <button key={s} onClick={()=>setSem(s)}
              className={`btn btn-sm ${s===sem?'btn-primary':'btn-ghost'}`}>
              Sem {s}
            </button>
          ))}
        </div>

        {loading ? <Loader full/> : slots.length===0
          ? <EmptyState icon={Calendar} title={`No classes for Semester ${sem}`} subtitle={isAdmin ? 'Add class slots using the button above' : 'No timetable set yet'}/>
          : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,minWidth:0}}>
              {DAYS_ORDER.map(day=>(
                <div key={day} style={{minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                    color:'var(--text-2)',marginBottom:10,textAlign:'center',paddingBottom:6,
                    borderBottom:'2px solid var(--border)'}}>{DAY_LABELS[day]}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {byDay[day].length===0
                      ? <div style={{height:56,border:'1px dashed var(--border)',borderRadius:10,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:11,color:'var(--text-3)'}}>Free</div>
                      : [...byDay[day]].sort((a,b)=>a.startTime>b.startTime?1:-1).map(s=>{
                          const color = courseColorMap[s.course?.id] || 'var(--accent)'
                          return (
                            <div key={s.id} style={{background:`${color}12`,border:`1px solid ${color}30`,
                              borderRadius:10,padding:'10px',position:'relative'}}>
                              <div style={{fontSize:10,color,fontWeight:700,marginBottom:3}}>
                                {s.startTime?.slice(0,5)}–{s.endTime?.slice(0,5)}
                              </div>
                              <div style={{fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:3}}
                                className="truncate">{s.course?.title||'—'}</div>
                              <div style={{fontSize:10,color:'var(--text-3)'}}>
                                <div className="truncate">{s.faculty?.name||'—'}</div>
                                <div>{s.room||'—'}</div>
                              </div>
                              {isAdmin && (
                                <button className="btn btn-danger btn-icon"
                                  style={{position:'absolute',top:6,right:6,width:20,height:20,padding:0}}
                                  onClick={()=>setDelTarget(s)}>
                                  <Trash2 size={10}/>
                                </button>
                              )}
                            </div>
                          )
                        })
                    }
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {showForm && (
        <Modal title="Add Class Slot" onClose={()=>setShowForm(false)}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Day</label>
              <select className="form-select" value={form.dayOfWeek} onChange={e=>fv('dayOfWeek',e.target.value)}>
                {DAYS_ORDER.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Room</label>
              <input className="form-input" value={form.room} onChange={e=>fv('room',e.target.value)} placeholder="Room 101"/></div>
            <div className="form-group"><label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.startTime} onChange={e=>fv('startTime',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.endTime} onChange={e=>fv('endTime',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Course *</label>
              <select className="form-select" value={courseId} onChange={e=>setCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Faculty</label>
              <select className="form-select" value={facId} onChange={e=>setFacId(e.target.value)}>
                <option value="">Select faculty</option>
                {faculty.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Loader/>:'Add Slot'}</button>
          </div>
        </Modal>
      )}
      {delTarget && <ConfirmModal title="Remove Slot" message="Remove this timetable slot?"
        onConfirm={async()=>{await timetableAPI.delete(delTarget.id);setDelTarget(null);load()}}
        onCancel={()=>setDelTarget(null)} danger/>}
    </>
  )
}
