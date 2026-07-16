import { useState, useEffect, useCallback } from 'react'
import { studentAPI, deptAPI } from '../services/api'
import { Plus, Search, Trash2, Edit, Eye, GraduationCap, Filter } from 'lucide-react'
import { Badge, Modal, ConfirmModal, Pagination, EmptyState, Loader, SectionCard } from '../components/ui/index'
import { formatDate, getInitials } from '../utils/helpers'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'

const EMPTY = { rollNumber:'', name:'', email:'', phone:'', gender:'MALE',
  semester:1, admissionYear:new Date().getFullYear(), status:'ACTIVE', address:'' }

export default function StudentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [students, setStudents] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [depts, setDepts] = useState([])
  const [filterDept, setFilterDept] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deptId, setDeptId] = useState('')
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentAPI.getAll({ page, size:10, search: search||undefined })
      const d = res.data
      setStudents(d.content || [])
      setTotalPages(d.totalPages || 1)
      setTotalCount(d.totalElements || 0)
    } catch(_) { setStudents([]) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { deptAPI.getAll().then(r => setDepts(r.data)).catch(()=>{}) }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDeptId(''); setShowForm(true) }
  const openEdit = s => {
    setEditing(s)
    setForm({ rollNumber:s.rollNumber, name:s.name, email:s.email, phone:s.phone||'',
      gender:s.gender||'MALE', semester:s.semester||1,
      admissionYear:s.admissionYear||new Date().getFullYear(),
      status:s.status||'ACTIVE', address:s.address||'' })
    setDeptId(s.department?.id||'')
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name||!form.rollNumber||!form.email) return alert('Name, roll number and email are required')
    setSaving(true)
    try {
      if (editing) await studentAPI.update(editing.id, form)
      else await studentAPI.create(form, deptId)
      setShowForm(false); load()
    } catch(e) { alert(e.response?.data?.message||'Error saving student') }
    finally { setSaving(false) }
  }

  const f = (k,v) => setForm(p => ({...p,[k]:v}))
  const filtered = filterDept ? students.filter(s => s.department?.id == filterDept) : students

  return (
    <>
      <Topbar title="Students"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Students</h1>
            <p className="page-subtitle">{totalCount} students enrolled across all departments</p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Student</button>}
        </div>

        <div className="toolbar">
          <div className="toolbar-l">
            <div className="search-wrap" style={{width:280}}>
              <Search size={15}/>
              <input placeholder="Search by name…" value={search}
                onChange={e=>{setSearch(e.target.value);setPage(0)}}/>
            </div>
            <select className="form-select" style={{width:180}} value={filterDept}
              onChange={e=>setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <SectionCard>
          {loading ? <Loader full/> : filtered.length===0
            ? <EmptyState icon={GraduationCap} title="No students found" subtitle="Try adjusting your search or add a new student"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th><th>Roll No.</th><th>Department</th>
                      <th>Semester</th><th>Status</th><th style={{width:100}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div className="avatar">{getInitials(s.name)}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:13}}>{s.name}</div>
                              <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="mono" style={{fontSize:12,color:'var(--text-2)'}}>{s.rollNumber}</span></td>
                        <td style={{color:'var(--text-2)',fontSize:13}}>{s.department?.name||'—'}</td>
                        <td><span className="badge badge-info">Sem {s.semester}</span></td>
                        <td><Badge value={s.status}/></td>
                        <td>
                          <div style={{display:'flex',gap:5}}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setViewing(s)}><Eye size={14}/></button>
                            {isAdmin && <>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(s)}><Edit size={14}/></button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setDelTarget(s)}><Trash2 size={14}/></button>
                            </>}
                          </div>
                        </td>
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
        <Modal title={editing?'Edit Student':'Add New Student'} onClose={()=>setShowForm(false)} wide>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Student full name"/></div>
            <div className="form-group"><label className="form-label">Roll Number *</label>
              <input className="form-input" value={form.rollNumber} onChange={e=>f('rollNumber',e.target.value)} placeholder="CS-2024-001"/></div>
            <div className="form-group"><label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="student@uni.edu"/></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="9876543210"/></div>
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e=>f('gender',e.target.value)}>
                <option>MALE</option><option>FEMALE</option><option>OTHER</option></select></div>
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-select" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                <option value="">Select department</option>
                {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Semester</label>
              <select className="form-select" value={form.semester} onChange={e=>f('semester',+e.target.value)}>
                {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Admission Year</label>
              <input className="form-input" type="number" value={form.admissionYear} onChange={e=>f('admissionYear',+e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e=>f('status',e.target.value)}>
                <option>ACTIVE</option><option>INACTIVE</option><option>GRADUATED</option><option>SUSPENDED</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label>
            <textarea className="form-textarea" value={form.address} onChange={e=>f('address',e.target.value)} rows={2} placeholder="Residential address"/></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Loader/>:editing?'Save Changes':'Add Student'}</button>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title="Student Profile" onClose={()=>setViewing(null)}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div className="avatar avatar-xl" style={{margin:'0 auto 14px'}}>{getInitials(viewing.name)}</div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.3px'}}>{viewing.name}</div>
            <div style={{fontSize:13,color:'var(--text-2)',marginTop:4}}>{viewing.email}</div>
            <div style={{marginTop:10,display:'flex',justifyContent:'center',gap:8}}>
              <Badge value={viewing.status}/> <span className="badge badge-info">Sem {viewing.semester}</span>
            </div>
          </div>
          <div className="info-grid">
            {[['Roll Number',viewing.rollNumber],['Department',viewing.department?.name||'—'],
              ['Gender',viewing.gender],['Phone',viewing.phone||'—'],
              ['Admission Year',viewing.admissionYear||'—'],['Address',viewing.address||'—']].map(([l,v])=>(
              <div key={l} className="info-item"><label>{l}</label><span>{v}</span></div>))}
          </div>
        </Modal>
      )}

      {delTarget && <ConfirmModal title="Delete Student"
        message={`Delete ${delTarget.name}? All their records will be permanently removed.`}
        onConfirm={async()=>{await studentAPI.delete(delTarget.id);setDelTarget(null);load()}}
        onCancel={()=>setDelTarget(null)} danger/>}
    </>
  )
}
