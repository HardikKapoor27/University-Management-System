import { useState, useEffect, useCallback } from 'react'
import { facultyAPI, deptAPI } from '../services/api'
import { Plus, Search, Trash2, Edit, Eye, Users } from 'lucide-react'
import { Badge, Modal, ConfirmModal, Pagination, EmptyState, Loader, SectionCard } from '../components/ui/index'
import { getInitials } from '../utils/helpers'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'

const EMPTY = { employeeId:'', name:'', email:'', phone:'', gender:'MALE',
  designation:'ASSISTANT_PROFESSOR', qualification:'', specialization:'', status:'ACTIVE', isMentor:false }

export default function FacultyPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [faculty, setFaculty] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [depts, setDepts] = useState([])
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
      const res = await facultyAPI.getAll({ page, size:10, search: search||undefined })
      const d = res.data
      setFaculty(d.content || [])
      setTotalPages(d.totalPages || 1)
      setTotalCount(d.totalElements || 0)
    } catch(_) { setFaculty([]) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { deptAPI.getAll().then(r => setDepts(r.data)).catch(()=>{}) }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDeptId(''); setShowForm(true) }
  const openEdit = f => {
    setEditing(f)
    setForm({ employeeId:f.employeeId, name:f.name, email:f.email, phone:f.phone||'',
      gender:f.gender||'MALE', designation:f.designation, qualification:f.qualification||'',
      specialization:f.specialization||'', status:f.status, isMentor:f.isMentor||false })
    setDeptId(f.department?.id||'')
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await facultyAPI.update(editing.id, form)
      else await facultyAPI.create(form, deptId)
      setShowForm(false); load()
    } catch(e) { alert(e.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }

  const fv = (k,v) => setForm(p => ({...p,[k]:v}))

  return (
    <>
      <Topbar title="Faculty"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Faculty</h1>
            <p className="page-subtitle">{totalCount} faculty members across all departments</p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Faculty</button>}
        </div>

        <div className="toolbar">
          <div className="toolbar-l">
            <div className="search-wrap" style={{width:280}}>
              <Search size={15}/>
              <input placeholder="Search faculty…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/>
            </div>
          </div>
        </div>

        <SectionCard>
          {loading ? <Loader full/> : faculty.length===0
            ? <EmptyState icon={Users} title="No faculty found"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Name</th><th>Employee ID</th><th>Department</th>
                    <th>Designation</th><th>Mentor</th><th>Status</th><th style={{width:100}}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {faculty.map(f => (
                      <tr key={f.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div className="avatar">{getInitials(f.name)}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:13}}>{f.name}</div>
                              <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{f.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="mono" style={{fontSize:12,color:'var(--text-2)'}}>{f.employeeId}</span></td>
                        <td style={{color:'var(--text-2)',fontSize:13}}>{f.department?.name||'—'}</td>
                        <td><Badge value={f.designation}/></td>
                        <td>{f.isMentor
                          ? <span className="badge badge-success">Yes</span>
                          : <span className="badge badge-muted">No</span>}
                        </td>
                        <td><Badge value={f.status}/></td>
                        <td>
                          <div style={{display:'flex',gap:5}}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setViewing(f)}><Eye size={14}/></button>
                            {isAdmin && <>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(f)}><Edit size={14}/></button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setDelTarget(f)}><Trash2 size={14}/></button>
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
        <Modal title={editing?'Edit Faculty':'Add Faculty'} onClose={()=>setShowForm(false)} wide>
          <div className="form-grid">
            {[['Full Name','name','text','Dr. Jane Smith'],['Employee ID','employeeId','text','FAC-2024-001'],
              ['Email','email','email','faculty@uni.edu'],['Phone','phone','text','9876543210'],
              ['Qualification','qualification','text','Ph.D Computer Science'],
              ['Specialization','specialization','text','Machine Learning']].map(([label,key,type,ph])=>(
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input className="form-input" type={type} placeholder={ph}
                  value={form[key]} onChange={e=>fv(key,e.target.value)}/></div>
            ))}
            <div className="form-group"><label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e=>fv('gender',e.target.value)}>
                <option>MALE</option><option>FEMALE</option><option>OTHER</option></select></div>
            <div className="form-group"><label className="form-label">Designation</label>
              <select className="form-select" value={form.designation} onChange={e=>fv('designation',e.target.value)}>
                {['PROFESSOR','ASSOCIATE_PROFESSOR','ASSISTANT_PROFESSOR','LECTURER','VISITING'].map(d=>
                  <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-select" value={deptId} onChange={e=>setDeptId(e.target.value)}>
                <option value="">Select department</option>
                {depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e=>fv('status',e.target.value)}>
                <option>ACTIVE</option><option>INACTIVE</option><option>ON_LEAVE</option></select></div>
          </div>
          <div className="form-group">
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14}}>
              <input type="checkbox" checked={form.isMentor} onChange={e=>fv('isMentor',e.target.checked)}
                style={{width:16,height:16,accentColor:'var(--accent)'}}/>
              <span>Can mark attendance (Mentor / Class teacher)</span>
            </label>
            <p className="form-hint">Enable this for faculty who are assigned as mentors or class teachers</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Loader/>:editing?'Save Changes':'Add Faculty'}</button>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title="Faculty Profile" onClose={()=>setViewing(null)}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div className="avatar avatar-xl" style={{margin:'0 auto 14px'}}>{getInitials(viewing.name)}</div>
            <div style={{fontSize:20,fontWeight:800}}>{viewing.name}</div>
            <div style={{fontSize:13,color:'var(--text-2)',marginTop:4}}>{viewing.email}</div>
            <div style={{marginTop:10,display:'flex',justifyContent:'center',gap:8}}>
              <Badge value={viewing.designation}/>
              {viewing.isMentor && <span className="badge badge-success">Mentor</span>}
            </div>
          </div>
          <div className="info-grid">
            {[['Employee ID',viewing.employeeId],['Department',viewing.department?.name||'—'],
              ['Qualification',viewing.qualification||'—'],['Specialization',viewing.specialization||'—'],
              ['Phone',viewing.phone||'—'],['Status',viewing.status]].map(([l,v])=>(
              <div key={l} className="info-item"><label>{l}</label><span>{v}</span></div>))}
          </div>
        </Modal>
      )}

      {delTarget && <ConfirmModal title="Delete Faculty"
        message={`Delete ${delTarget.name}? This cannot be undone.`}
        onConfirm={async()=>{await facultyAPI.delete(delTarget.id);setDelTarget(null);load()}}
        onCancel={()=>setDelTarget(null)} danger/>}
    </>
  )
}
