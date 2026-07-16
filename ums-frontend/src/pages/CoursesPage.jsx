import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { courseAPI, deptAPI, facultyAPI } from '../services/api'
import { Plus, Search, Trash2, Edit, BookOpen, Layers } from 'lucide-react'
import { Badge, Modal, ConfirmModal, Pagination, EmptyState, Loader, SectionCard } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'

const EMPTY = { courseCode:'', title:'', description:'', credits:3, semester:1, type:'THEORY', maxStudents:60, syllabus:'' }

export default function CoursesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isFaculty = user?.role === 'FACULTY'
  const canEdit = (c) => isAdmin || (isFaculty && c.faculty?.id === user?.profileId)
  const [courses, setCourses] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [depts, setDepts] = useState([])
  const [faculty, setFaculty] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deptId, setDeptId] = useState('')
  const [facId, setFacId] = useState('')
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await courseAPI.getAll({ page, size:10, search: search||undefined })
      const d = res.data
      setCourses(d.content || [])
      setTotalPages(d.totalPages || 1)
    } catch(_) { setCourses([]) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    deptAPI.getAll().then(r=>setDepts(r.data)).catch(()=>{})
    facultyAPI.getAll({page:0,size:200}).then(r=>setFaculty(r.data.content||r.data||[])).catch(()=>{})
  }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDeptId(''); setFacId(''); setShowForm(true) }
  const openEdit = c => {
    setEditing(c)
    setForm({ courseCode:c.courseCode, title:c.title, description:c.description||'',
      credits:c.credits||3, semester:c.semester||1, type:c.type||'THEORY',
      maxStudents:c.maxStudents||60, syllabus:c.syllabus||'' })
    setDeptId(c.department?.id||''); setFacId(c.faculty?.id||'')
    setShowForm(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      if (editing) await courseAPI.update(editing.id, form)
      else await courseAPI.create(form, deptId, facId)
      setShowForm(false); load()
    } catch(e) { alert(e.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }
  const fv = (k,v) => setForm(p=>({...p,[k]:v}))

  return (
    <>
      <Topbar title="Courses"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Courses</h1>
            <p className="page-subtitle">All courses offered by the university</p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Course</button>}
        </div>
        <div className="toolbar">
          <div className="toolbar-l">
            <div className="search-wrap" style={{width:280}}>
              <Search size={15}/>
              <input placeholder="Search courses…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/>
            </div>
          </div>
        </div>
        <SectionCard>
          {loading ? <Loader full/> : courses.length===0
            ? <EmptyState icon={BookOpen} title="No courses found"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Course</th><th>Code</th><th>Department</th>
                    <th>Faculty</th><th>Credits</th><th>Sem</th><th>Type</th><th>Content</th>
                    {(isAdmin || isFaculty) && <th>Actions</th>}
                  </tr></thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{fontWeight:600,fontSize:13}}>{c.title}</div>
                          <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{c.maxStudents} max seats</div>
                        </td>
                        <td><span className="mono" style={{fontSize:12,background:'var(--bg-elevated)',padding:'2px 7px',borderRadius:5,color:'var(--accent)'}}>{c.courseCode}</span></td>
                        <td style={{color:'var(--text-2)',fontSize:13}}>{c.department?.name||'—'}</td>
                        <td style={{color:'var(--text-2)',fontSize:13}}>{c.faculty?.name||'—'}</td>
                        <td><span className="badge badge-info">{c.credits} cr</span></td>
                        <td><span className="badge badge-accent">Sem {c.semester}</span></td>
                        <td><Badge value={c.type}/></td>
                        <td>
                          <Link to={`/courses/${c.id}/content`} className="btn btn-ghost btn-sm">
                            <Layers size={13}/> Modules
                          </Link>
                        </td>
                        {(isAdmin || isFaculty) && <td>
                          <div style={{display:'flex',gap:5}}>
                            {canEdit(c) && <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(c)}><Edit size={14}/></button>}
                            {isAdmin && <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setDelTarget(c)}><Trash2 size={14}/></button>}
                          </div>
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
              </div>
            )
          }
        </SectionCard>
      </div>

      {showForm && (
        <Modal title={editing?'Edit Course':'Add Course'} onClose={()=>setShowForm(false)} wide>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Course Title *</label>
              <input className="form-input" value={form.title} onChange={e=>fv('title',e.target.value)} placeholder="Database Management Systems"/></div>
            <div className="form-group"><label className="form-label">Course Code *</label>
              <input className="form-input" value={form.courseCode} onChange={e=>fv('courseCode',e.target.value.toUpperCase())} placeholder="CS301"/></div>
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-select" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                <option value="">Select department</option>
                {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Faculty</label>
              <select className="form-select" value={facId} onChange={e=>setFacId(e.target.value)}>
                <option value="">Select faculty</option>
                {faculty.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Credits</label>
              <input className="form-input" type="number" value={form.credits} onChange={e=>fv('credits',+e.target.value)} min={1} max={6}/></div>
            <div className="form-group"><label className="form-label">Semester</label>
              <select className="form-select" value={form.semester} onChange={e=>fv('semester',+e.target.value)}>
                {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e=>fv('type',e.target.value)}>
                <option>THEORY</option><option>PRACTICAL</option><option>LAB</option><option>ELECTIVE</option></select></div>
            <div className="form-group"><label className="form-label">Max Students</label>
              <input className="form-input" type="number" value={form.maxStudents} onChange={e=>fv('maxStudents',+e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>fv('description',e.target.value)} rows={2}/></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Loader/>:editing?'Save':'Add Course'}</button>
          </div>
        </Modal>
      )}
      {delTarget && <ConfirmModal title="Delete Course" message={`Delete "${delTarget.title}"?`}
        onConfirm={async()=>{await courseAPI.delete(delTarget.id);setDelTarget(null);load()}}
        onCancel={()=>setDelTarget(null)} danger/>}
    </>
  )
}
