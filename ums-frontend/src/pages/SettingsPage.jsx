import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../utils/helpers'
import { LogOut, Key, Sun, Moon, Shield, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import { Modal, Loader } from '../components/ui/index'
import api, { authAPI } from '../services/api'

// ── Change Password Modal ──────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [show, setShow]   = useState({ cur:false, new:false, con:false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState({ text:'', type:'' })

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const s = (k)    => setShow(p => ({ ...p, [k]: !p[k] }))

  const submit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword)
      return setMsg({ text:'All fields are required', type:'danger' })
    if (form.newPassword.length < 6)
      return setMsg({ text:'New password must be at least 6 characters', type:'danger' })
    if (form.newPassword !== form.confirmPassword)
      return setMsg({ text:'New passwords do not match', type:'danger' })
    if (form.currentPassword === form.newPassword)
      return setMsg({ text:'New password must be different from current password', type:'danger' })

    setSaving(true)
    setMsg({ text:'', type:'' })
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      })
      setMsg({ text:'Password changed successfully!', type:'success' })
      setTimeout(onClose, 1800)
    } catch(e) {
      setMsg({ text: e.response?.data?.message || 'Error changing password', type:'danger' })
    } finally { setSaving(false) }
  }

  const PwField = ({ label, field, showKey }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position:'relative' }}>
        <input
          className="form-input"
          type={show[showKey] ? 'text' : 'password'}
          style={{ paddingRight:42 }}
          value={form[field]}
          onChange={e => f(field, e.target.value)}
          placeholder="••••••••"
        />
        <button type="button" onClick={() => s(showKey)}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', color:'var(--text-3)', cursor:'pointer',
            display:'flex', alignItems:'center' }}>
          {show[showKey] ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
      </div>
    </div>
  )

  return (
    <Modal title="Change Password" onClose={onClose}>
      <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:20, lineHeight:1.6 }}>
        Enter your current password and choose a new one. Your session will remain active after the change.
      </p>

      <PwField label="Current Password"  field="currentPassword" showKey="cur"/>
      <PwField label="New Password"      field="newPassword"     showKey="new"/>
      <PwField label="Confirm New Password" field="confirmPassword" showKey="con"/>

      {/* Password strength indicator */}
      {form.newPassword && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>Password strength</div>
          <div style={{ display:'flex', gap:4 }}>
            {[
              form.newPassword.length >= 6,
              /[A-Z]/.test(form.newPassword),
              /[0-9]/.test(form.newPassword),
              /[^A-Za-z0-9]/.test(form.newPassword),
            ].map((met, i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:99,
                background: met
                  ? (i < 2 ? 'var(--warning)' : 'var(--success)')
                  : 'var(--bg-elevated)',
                transition:'background 0.2s' }}/>
            ))}
          </div>
          <div style={{ fontSize:10, color:'var(--text-3)', marginTop:5 }}>
            {[
              [form.newPassword.length >= 6,          '6+ characters'],
              [/[A-Z]/.test(form.newPassword),         'Uppercase letter'],
              [/[0-9]/.test(form.newPassword),         'Number'],
              [/[^A-Za-z0-9]/.test(form.newPassword),  'Special character'],
            ].map(([met, label]) => (
              <span key={label} style={{ marginRight:10, color: met ? 'var(--success)' : 'var(--text-3)' }}>
                {met ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom:14, fontSize:13 }}>
          {msg.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
          {msg.text}
        </div>
      )}

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? <Loader/> : 'Change Password'}
        </button>
      </div>
    </Modal>
  )
}

// ── Main Settings Page ─────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate          = useNavigate()
  const [profile, setProfile]           = useState(null)
  const [showChangePw, setShowChangePw] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm]           = useState({ username:'', password:'', id:'', role:'STUDENT' })
  const [saving, setSaving]             = useState(false)
  const [msg, setMsg]                   = useState({ text:'', type:'' })

  useEffect(() => {
    api.get('/auth/me').then(r => setProfile(r.data)).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const createAccount = async () => {
    if (!regForm.username || !regForm.password)
      return setMsg({ text:'Username and password are required', type:'danger' })
    if (regForm.password.length < 6)
      return setMsg({ text:'Password must be at least 6 characters', type:'danger' })
    setSaving(true)
    setMsg({ text:'', type:'' })
    try {
      await api.post('/auth/register', {
        username:  regForm.username,
        password:  regForm.password,
        role:      regForm.role,
        studentId: regForm.role === 'STUDENT' && regForm.id ? parseInt(regForm.id) : null,
        facultyId: regForm.role === 'FACULTY' && regForm.id ? parseInt(regForm.id) : null,
      })
      setMsg({ text:`Account "${regForm.username}" created successfully!`, type:'success' })
      setShowRegister(false)
      setRegForm({ username:'', password:'', id:'', role:'STUDENT' })
    } catch(e) {
      setMsg({ text: e.response?.data?.message || 'Error creating account', type:'danger' })
    } finally { setSaving(false) }
  }

  const rf = (k, v) => setRegForm(p => ({ ...p, [k]: v }))

  const profileFields = profile ? [
    ['Username',   profile.username],
    ['Email',      profile.email],
    ...(profile.rollNumber   ? [['Roll Number',    profile.rollNumber]]   : []),
    ...(profile.employeeId   ? [['Employee ID',    profile.employeeId]]   : []),
    ...(profile.department   ? [['Department',     profile.department]]   : []),
    ...(profile.semester     ? [['Semester',       `Semester ${profile.semester}`]] : []),
    ...(profile.designation  ? [['Designation',    profile.designation.replace(/_/g,' ')]] : []),
    ...(profile.isMentor !== undefined
      ? [['Can Mark Attendance', profile.isMentor ? 'Yes (Mentor)' : 'No']] : []),
  ] : []

  return (
    <>
      <Topbar title="Settings"/>
      <div className="page animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account and preferences</p>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18, maxWidth:960 }}>

          {/* Profile card */}
          <div className="section-card">
            <div className="sc-header"><div className="sc-title">My Profile</div></div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20,
              padding:'14px 16px', background:'var(--bg-elevated)', borderRadius:10 }}>
              <div className="avatar avatar-lg">{getInitials(profile?.name || user?.username)}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.2px' }}>
                  {profile?.name || user?.username}
                </div>
                <div style={{ fontSize:10, color:'var(--accent)', textTransform:'uppercase',
                  letterSpacing:'0.7px', fontWeight:700, marginTop:3 }}>{user?.role}</div>
              </div>
            </div>
            {profileFields.map(([label, value]) => (
              <div key={label} className="info-row">
                <span className="info-row-label">{label}</span>
                <span className="info-row-value" style={{ fontSize:13 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Account actions */}
          <div className="section-card">
            <div className="sc-header"><div className="sc-title">Account & Preferences</div></div>

            {/* Theme toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'13px 14px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {theme === 'dark'
                  ? <Moon size={15} style={{ color:'var(--accent)' }}/>
                  : <Sun  size={15} style={{ color:'var(--warning)' }}/>}
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>Appearance</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
                    Currently {theme} mode
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={toggle}>
                {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Change password */}
            <button
              onClick={() => setShowChangePw(true)}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'13px 14px', background:'var(--bg-elevated)', borderRadius:10,
                marginBottom:10, border:'1px solid var(--border)', cursor:'pointer',
                textAlign:'left', transition:'border-color 0.15s, background 0.15s',
                color:'inherit', fontFamily:'var(--font)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-bdr)'; e.currentTarget.style.background='var(--accent-soft)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-elevated)' }}>
              <Key size={15} style={{ color:'var(--accent)', flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Change Password</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
                  Update your login password
                </div>
              </div>
            </button>

            {/* Role info */}
            <div style={{ display:'flex', alignItems:'center', gap:10,
              padding:'13px 14px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:10 }}>
              <Shield size={15} style={{ color:'var(--text-3)', flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Role: {user?.role}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
                  Permissions are managed by your administrator
                </div>
              </div>
            </div>

            {/* Admin: create login account */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowRegister(true)}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                  padding:'13px 14px', background:'var(--bg-elevated)', borderRadius:10,
                  marginBottom:10, border:'1px solid var(--border)', cursor:'pointer',
                  textAlign:'left', transition:'border-color 0.15s, background 0.15s',
                  color:'inherit', fontFamily:'var(--font)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-bdr)'; e.currentTarget.style.background='var(--accent-soft)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-elevated)' }}>
                <Key size={15} style={{ color:'var(--warning)', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>Create Login Account</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
                    Create credentials for a student or faculty member
                  </div>
                </div>
              </button>
            )}

            {msg.text && (
              <div className={`alert alert-${msg.type}`} style={{ fontSize:12, marginBottom:10 }}>
                {msg.type === 'success' ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                {msg.text}
              </div>
            )}

            <button className="btn btn-danger" style={{ width:'100%', justifyContent:'center', marginTop:4 }}
              onClick={handleLogout}>
              <LogOut size={14}/> Sign Out
            </button>
          </div>

          {/* System info */}
          <div className="section-card">
            <div className="sc-header"><div className="sc-title">System Info</div></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                ['Application','UniManage v1.0'],
                ['Backend','Spring Boot 3.2.2'],
                ['Database','MySQL 8.x'],
                ['Frontend','React 18 + Vite'],
                ['Auth','JWT / Bearer'],
                ['API Base','/api/v1'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase',
                    letterSpacing:'0.5px', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--accent)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)}/>}

      {/* Create Account Modal */}
      {showRegister && (
        <Modal title="Create Login Account" onClose={() => setShowRegister(false)}>
          <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, marginBottom:18 }}>
            Create login credentials for an existing student or faculty member.
            They must already be added to the system first.
          </p>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-select" value={regForm.role} onChange={e => rf('role', e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
              <option value="ACCOUNTS">Accounts</option>
            </select>
          </div>
          {!['ADMIN', 'ACCOUNTS'].includes(regForm.role) && (
            <div className="form-group">
              <label className="form-label">{regForm.role === 'STUDENT' ? 'Student' : 'Faculty'} ID</label>
              <input className="form-input" type="number" placeholder="e.g. 3 (from the list page)"
                value={regForm.id} onChange={e => rf('id', e.target.value)}/>
              <p className="form-hint">Find the numeric ID in the {regForm.role === 'STUDENT' ? 'Students' : 'Faculty'} list</p>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" placeholder="e.g. priya.nair"
              value={regForm.username} onChange={e => rf('username', e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Minimum 6 characters"
              value={regForm.password} onChange={e => rf('password', e.target.value)}/>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowRegister(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createAccount} disabled={saving}>
              {saving ? <Loader/> : 'Create Account'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
