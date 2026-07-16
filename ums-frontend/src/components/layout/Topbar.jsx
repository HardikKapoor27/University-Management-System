import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon, Bell, X, Megaphone } from 'lucide-react'
import { getInitials, formatDateTime } from '../../utils/helpers'
import { announcementAPI } from '../../services/api'

export default function Topbar({ title }) {
  const { user }        = useAuth()
  const { theme, toggle } = useTheme()
  const navigate        = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  // Load announcements when bell is opened
  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const r = await announcementAPI.getMine()
      setItems(Array.isArray(r.data) ? r.data.slice(0, 8) : [])
    } catch(_) { setItems([]) }
    finally { setLoading(false) }
  }

  const toggleBell = () => {
    if (!open) loadAnnouncements()
    setOpen(v => !v)
  }

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const priorityColor = { LOW:'var(--text-3)', MEDIUM:'var(--accent)', HIGH:'var(--warning)', URGENT:'var(--danger)' }

  return (
    <div className="topbar">
      <div className="topbar-bc">
        <span>UniManage</span>
        <span className="topbar-bc-sep">/</span>
        <span>{title}</span>
      </div>

      <div className="topbar-actions">
        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
        </button>

        {/* Bell with dropdown panel */}
        <div style={{ position:'relative' }} ref={panelRef}>
          <button className="btn btn-ghost btn-icon"
            onClick={toggleBell}
            style={{ position:'relative' }}
            title="Announcements">
            <Bell size={15}/>
            {items.length > 0 && !open && (
              <span style={{
                position:'absolute', top:5, right:5,
                width:7, height:7, borderRadius:'50%',
                background:'var(--danger)',
                border:'1.5px solid var(--bg-surface)'
              }}/>
            )}
          </button>

          {open && (
            <div style={{
              position:'absolute', top:'calc(100% + 10px)', right:0,
              width:340, background:'var(--bg-surface)',
              border:'1px solid var(--border)', borderRadius:14,
              boxShadow:'var(--shadow-lg)', zIndex:999,
              animation:'fadeIn 0.15s ease',
              overflow:'hidden'
            }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Megaphone size={15} style={{ color:'var(--accent)' }}/>
                  <span style={{ fontWeight:700, fontSize:14 }}>Announcements</span>
                  {items.length > 0 && (
                    <span style={{ fontSize:11, background:'var(--accent-soft)', color:'var(--accent)',
                      padding:'1px 7px', borderRadius:99, fontWeight:600 }}>{items.length}</span>
                  )}
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)}>
                  <X size={14}/>
                </button>
              </div>

              {/* List */}
              <div style={{ maxHeight:360, overflowY:'auto' }}>
                {loading ? (
                  <div style={{ padding:24, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
                    Loading…
                  </div>
                ) : items.length === 0 ? (
                  <div style={{ padding:24, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
                    No announcements right now
                  </div>
                ) : (
                  items.map((a, i) => (
                    <div key={a.id} style={{
                      display:'flex', gap:12, padding:'12px 16px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor:'pointer', transition:'background 0.12s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { setOpen(false); navigate('/announcements') }}
                    >
                      <div style={{ width:3, borderRadius:3, flexShrink:0, alignSelf:'stretch',
                        background: priorityColor[a.priority] || 'var(--accent)' }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, marginBottom:3 }}
                          className="truncate">{a.title}</div>
                        <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:4 }}
                          className="truncate">{a.message}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)' }}>
                          {formatDateTime(a.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)',
                textAlign:'center' }}>
                <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center' }}
                  onClick={() => { setOpen(false); navigate('/announcements') }}>
                  View all announcements
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="topbar-user">
          <div className="avatar avatar-sm">{getInitials(user?.profileName || user?.username)}</div>
          <div style={{ lineHeight:1.3 }}>
            <div className="topbar-user-name">{user?.profileName || user?.username}</div>
            <div className="topbar-user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
