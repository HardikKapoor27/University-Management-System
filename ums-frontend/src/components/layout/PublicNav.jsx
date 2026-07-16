import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { GraduationCap, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function PublicNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="public-nav">
      <div className="public-nav-inner">
        <Link to="/" className="public-logo">
          <span className="public-logo-icon"><GraduationCap size={20} /></span>
          <span>Alma<b>UMS</b></span>
        </Link>

        <nav className={`public-nav-links${open ? ' open' : ''}`}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`public-nav-link${location.pathname === l.to ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-sm public-nav-cta">
            {user ? 'Go to Dashboard' : 'Login'}
          </Link>
        </nav>

        <button className="public-nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}
