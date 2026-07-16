import { useState, useEffect } from 'react'
import { enrollAPI, studentAPI, courseAPI } from '../services/api'
import { Plus, Trash2, ClipboardList } from 'lucide-react'
import { Badge, Modal, ConfirmModal, EmptyState, Loader, SectionCard } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import { pctColor } from '../utils/helpers'

export default function EnrollmentsPage() {
  const { user } = useAuth()
  const canManage = ['FACULTY','ADMIN'].includes(user?.role)
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selStudent, setSelStudent] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formStudent, setFormStudent] = useState('')
  const [formCourse, setFormCourse] = useState('')
  const [saving, setSaving] = useState(false)
  const [dropTarget, setDropTarget] = useState(null)

  useEffect(() => {
    studentAPI.getAll({page:0,size:200}).then(r=>setStudents(r.data.content||r.data||[])).catch(()=>{})
    courseAPI.getAll({page:0,size:100}).then(r=>setCourses(r.data.content||r.data||[])).catch(()=>{})
  }, [])

  const load = async () => {
    if (!selStudent) return
    setLoading(true)
    try { const r = await enrollAPI.getByStudent(selStudent); setEnrollments(r.data) }
    catch(_) { setEnrollments([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [selStudent])

  const enroll = async () => {
    if (!formStudent||!formCourse) return alert('Select student and course')
    setSaving(true)
    try {
      await enrollAPI.enroll(formStudent, formCourse)
      setShowForm(false)
      if (formStudent===selStudent) load()
    } catch(e) { alert(e.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }

  const drop = async () => {
    try { await enrollAPI.drop(dropTarget.id); setDropTarget(null); load() }
    catch(e) { alert(e.response?.data?.message||'Error') }
  }

  const active = enrollments.filter(e=>e.status==='ENROLLED')
  const completed = enrollments.filter(e=>e.status==='COMPLETED')
  const dropped = enrollments.filter(e=>e.status==='DROPPED')

  return (
    <>
      <Topbar title="Enrollments"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Enrollments</h1>
            <p className="page-subtitle">Manage course enrollments for students</p>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={()=>{setFormStudent(selStudent||'');setFormCourse('');setShowForm(true)}}>
              <Plus size={15}/> New Enrollment
            </button>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20,alignItems:'start'}}>
          {/* Student selector */}
          <SectionCard title="Select Student">
            <div className="form-group">
              <label className="form-label">Student</label>
              <select className="form-select" value={selStudent} onChange={e=>setSelStudent(e.target.value)}>
                <option value="">Choose student…</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            {selStudent && enrollments.length>0 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:8}}>
                {[['Active',active.length,'var(--success)'],['Done',completed.length,'var(--accent)'],['Dropped',dropped.length,'var(--danger)']].map(([l,v,c])=>(
                  <div key={l} style={{background:'var(--bg-elevated)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Enrollments list */}
          <SectionCard title={selStudent ? `Enrollments (${enrollments.length})` : 'Enrollments'}>
            {!selStudent
              ? <EmptyState icon={ClipboardList} title="Select a student" subtitle="Choose a student to view their course enrollments"/>
              : loading ? <Loader full/>
              : enrollments.length===0
              ? <EmptyState icon={ClipboardList} title="No enrollments" subtitle="This student is not enrolled in any courses"/>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Course</th><th>Code</th><th>Credits</th>
                      <th>Attendance</th><th>Status</th><th>Grade</th>
                      {canManage && <th>Action</th>}
                    </tr></thead>
                    <tbody>
                      {enrollments.map(e=>{
                        const pct = e.attendancePercentage||0
                        return (
                          <tr key={e.id}>
                            <td style={{fontWeight:600,fontSize:13}}>{e.course?.title||'—'}</td>
                            <td><span className="mono" style={{fontSize:11,background:'var(--bg-elevated)',
                              padding:'2px 7px',borderRadius:5,color:'var(--accent)'}}>{e.course?.courseCode||'—'}</span></td>
                            <td style={{color:'var(--text-2)'}}>{e.course?.credits||'—'}</td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:50,height:4,background:'var(--bg-elevated)',borderRadius:99,overflow:'hidden'}}>
                                  <div style={{height:'100%',width:`${Math.min(pct,100)}%`,background:pctColor(pct),borderRadius:99}}/>
                                </div>
                                <span style={{fontSize:12,fontWeight:600,color:pctColor(pct)}}>{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td><Badge value={e.status}/></td>
                            <td>{e.grade
                              ? <span className={`badge badge-info`}>{e.grade}</span>
                              : <span style={{color:'var(--text-3)',fontSize:12}}>—</span>}
                            </td>
                            {canManage && <td>
                              {e.status==='ENROLLED' && (
                                <button className="btn btn-danger btn-sm" onClick={()=>setDropTarget(e)}>Drop</button>
                              )}
                            </td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </SectionCard>
        </div>
      </div>

      {showForm && (
        <Modal title="Enroll Student in Course" onClose={()=>setShowForm(false)}>
          <div className="form-group"><label className="form-label">Student *</label>
            <select className="form-select" value={formStudent} onChange={e=>setFormStudent(e.target.value)}>
              <option value="">Select student</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Course *</label>
            <select className="form-select" value={formCourse} onChange={e=>setFormCourse(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>)}
            </select></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={enroll} disabled={saving}>{saving?<Loader/>:'Enroll'}</button>
          </div>
        </Modal>
      )}
      {dropTarget && <ConfirmModal title="Drop Enrollment"
        message={`Drop ${dropTarget.course?.title} for this student? This cannot be undone.`}
        onConfirm={drop} onCancel={()=>setDropTarget(null)} danger/>}
    </>
  )
}
