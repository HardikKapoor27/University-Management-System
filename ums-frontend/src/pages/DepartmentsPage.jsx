import { useState, useEffect } from 'react'
import { deptAPI } from '../services/api'
import { Plus, Trash2, Edit, Building2, Users, BookOpen } from 'lucide-react'
import { Modal, ConfirmModal, EmptyState, Loader } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name:'', code:'', description:'' }

export default function DepartmentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [delTarget, setDelTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await deptAPI.getAll(); setDepts(r.data) }
    catch(_) { setDepts([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = d => { setEditing(d); setForm({name:d.name,code:d.code,description:d.description||''}); setShowForm(true) }
  const save = async () => {
    if (!form.name||!form.code) return alert('Name and code are required')
    setSaving(true)
    try {
      if (editing) await deptAPI.update(editing.id, form)
      else await deptAPI.create(form)
      setShowForm(false); load()
    } catch(e) { alert(e.response?.data?.message||'Error') }
    finally { setSaving(false) }
  }
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const DEPT_COLORS = ['#7c6af7','#22d3c8','#f59e0b','#f43f5e','#22c55e','#3b82f6','#a855f7','#ec4899']

  return (
    <>
      <Topbar title="Departments"/>
      <div className="page animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">{depts.length} departments in the university</p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Department</button>}
        </div>

        {loading ? <Loader full/> : depts.length===0
          ? <EmptyState icon={Building2} title="No departments yet" subtitle="Create your first department to get started"/>
          : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
              {depts.map((d,i) => {
                const color = DEPT_COLORS[i % DEPT_COLORS.length]
                return (
                  <div key={d.id} style={{background:'var(--bg-card)',border:'1px solid var(--border)',
                    borderRadius:16,overflow:'hidden',transition:'transform 0.15s,border-color 0.15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor=`${color}40`}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='var(--border)'}}>
                    {/* Top accent */}
                    <div style={{height:3,background:color}}/>
                    <div style={{padding:'20px 22px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
                        <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,
                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Building2 size={20} style={{color}}/>
                        </div>
                        {isAdmin && (
                          <div style={{display:'flex',gap:5}}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(d)}><Edit size={13}/></button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setDelTarget(d)}><Trash2 size={13}/></button>
                          </div>
                        )}
                      </div>
                      <div style={{marginBottom:6}}>
                        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',
                          letterSpacing:'0.8px',color,marginBottom:4,display:'block'}}>{d.code}</span>
                        <div style={{fontSize:17,fontWeight:800,letterSpacing:'-0.3px'}}>{d.name}</div>
                      </div>
                      <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6,marginBottom:16,minHeight:38}}>
                        {d.description||'No description provided.'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {showForm && (
        <Modal title={editing?'Edit Department':'Add Department'} onClose={()=>setShowForm(false)}>
          <div className="form-group"><label className="form-label">Department Name *</label>
            <input className="form-input" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="e.g. Computer Science"/></div>
          <div className="form-group"><label className="form-label">Code *</label>
            <input className="form-input" value={form.code} onChange={e=>f('code',e.target.value.toUpperCase())} placeholder="e.g. CS" maxLength={10}/>
            <p className="form-hint">Short unique code for this department (2–10 characters)</p></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>f('description',e.target.value)} rows={3} placeholder="Brief description…"/></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<Loader/>:editing?'Save Changes':'Add Department'}</button>
          </div>
        </Modal>
      )}
      {delTarget && <ConfirmModal title="Delete Department"
        message={`Delete "${delTarget.name}"? All associated students, courses and faculty will be unlinked.`}
        onConfirm={async()=>{await deptAPI.delete(delTarget.id);setDelTarget(null);load()}}
        onCancel={()=>setDelTarget(null)} danger/>}
    </>
  )
}
