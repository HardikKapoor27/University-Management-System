import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, GraduationCap, AlertCircle } from 'lucide-react'

const DEMOS = [
  { role: 'Admin',   u: 'admin',        p: 'admin123',   color: 'var(--danger)' },
  { role: 'Faculty', u: 'anjali.sharma', p: 'faculty123', color: 'var(--warning)' },
  { role: 'Student', u: 'arjun.mehta',  p: 'student123', color: 'var(--success)' },
]

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(form.username, form.password)
    if (res.success) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left panel - decorative */}
      <div style={{
        flex: 1,
        display: 'none',
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '60px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-panel">
        {/* Glow orbs */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)',
          top:-100, left:-100, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(34,211,200,0.1) 0%, transparent 70%)',
          bottom:0, right:-50, pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:60 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:18, color:'white' }}>U</div>
            <span style={{ fontSize:20, fontWeight:700, color:'white' }}>UniManage</span>
          </div>
          <h2 style={{ fontSize:36, fontWeight:800, color:'white', lineHeight:1.2, marginBottom:16,
            letterSpacing:'-0.5px' }}>
            Manage your<br/>university smarter
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>
            A unified platform for students, faculty, and administrators to manage academics efficiently.
          </p>
        </div>

        <div style={{ display:'flex', gap:24, position:'relative', zIndex:1 }}>
          {['Students','Courses','Faculty'].map((label, i) => (
            <div key={label}>
              <div style={{ fontSize:28, fontWeight:800, color:'white' }}>{[320,48,24][i]}+</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 65%)',
          top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', position:'relative', zIndex:1 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 24px var(--accent-glow)' }}>
              <GraduationCap size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.3px' }}>UniManage</div>
              <div style={{ fontSize:11, color:'var(--text-2)', marginTop:1 }}>University Management System</div>
            </div>
          </div>

          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:30 }}>Sign in to continue to your dashboard</p>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom:20 }}>
              <AlertCircle size={16} style={{ flexShrink:0 }} />
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" placeholder="Enter your username"
                value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required />
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  style={{ paddingRight:42 }}
                  value={form.password}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))}
                  required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', color:'var(--text-3)', cursor:'pointer',
                    display:'flex', alignItems:'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:14, fontWeight:700 }}>
              {loading ? <div className="spinner" style={{width:16,height:16,borderTopColor:'white'}} /> : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.7px',
              color:'var(--text-3)', marginBottom:12 }}>Quick demo access</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {DEMOS.map(a => (
                <button key={a.role} onClick={() => setForm({ username: a.u, password: a.p })}
                  style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)',
                    borderRadius:10, padding:'10px 12px', cursor:'pointer', textAlign:'left',
                    transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `${a.color}14`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:a.color, marginBottom:3 }}>{a.role}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', fontFamily:'var(--font-mono)' }}>{a.u}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(min-width:900px){ .login-panel{ display:flex !important; } }
      `}</style>
    </div>
  )
}
