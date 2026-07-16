import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2,
  ClipboardList, FileText, Calendar, Megaphone, Settings,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Award, Wallet,
  CalendarDays, Mail, User
} from 'lucide-react'

const NAV = {
  ADMIN: [
    { section: 'Overview', links: [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { section: 'People', links: [
      { to: '/students',    icon: GraduationCap,   label: 'Students' },
      { to: '/faculty',     icon: Users,           label: 'Faculty' },
    ]},
    { section: 'Academic', links: [
      { to: '/departments', icon: Building2,       label: 'Departments' },
      { to: '/courses',     icon: BookOpen,        label: 'Courses' },
      { to: '/enrollments', icon: ClipboardList,   label: 'Enrollments' },
      { to: '/timetable',   icon: Calendar,        label: 'Timetable' },
      { to: '/gradebook',   icon: Award,           label: 'Gradebook' },
      { to: '/calendar',    icon: CalendarDays,    label: 'Academic Calendar' },
    ]},
    { section: 'Assessment', links: [
      { to: '/exams',       icon: FileText,        label: 'Exams' },
      { to: '/results',     icon: FileText,        label: 'Results' },
      { to: '/attendance',  icon: ClipboardList,   label: 'Attendance' },
    ]},
    { section: 'Finance', links: [
      { to: '/fees',        icon: Wallet,          label: 'Fee Management' },
    ]},
    { section: 'Communication', links: [
      { to: '/announcements', icon: Megaphone,     label: 'Announcements' },
      { to: '/contact-messages', icon: Mail,       label: 'Contact Messages' },
    ]},
  ],
  FACULTY: [
    { section: 'Overview', links: [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/profile',     icon: User,            label: 'My Profile' },
    ]},
    { section: 'Teaching', links: [
      { to: '/courses',     icon: BookOpen,        label: 'My Courses' },
      { to: '/students',    icon: GraduationCap,   label: 'Students' },
      { to: '/timetable',   icon: Calendar,        label: 'Timetable' },
      { to: '/gradebook',   icon: Award,           label: 'Gradebook' },
      { to: '/calendar',    icon: CalendarDays,    label: 'Academic Calendar' },
    ]},
    { section: 'Assessment', links: [
      { to: '/attendance',  icon: ClipboardList,   label: 'Attendance' },
      { to: '/exams',       icon: FileText,        label: 'Exams' },
      { to: '/results',     icon: FileText,        label: 'Results' },
    ]},
    { section: 'Communication', links: [
      { to: '/announcements', icon: Megaphone,     label: 'Announcements' },
    ]},
  ],
  STUDENT: [
    { section: 'Overview', links: [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/profile',     icon: User,            label: 'My Profile' },
    ]},
    { section: 'My Academic', links: [
      { to: '/courses',     icon: BookOpen,        label: 'My Courses' },
      { to: '/timetable',   icon: Calendar,        label: 'Timetable' },
      { to: '/attendance',  icon: ClipboardList,   label: 'Attendance' },
      { to: '/results',     icon: FileText,        label: 'Results' },
      { to: '/calendar',    icon: CalendarDays,    label: 'Academic Calendar' },
      { to: '/fees',        icon: Wallet,          label: 'My Fees' },
    ]},
    { section: 'Communication', links: [
      { to: '/announcements', icon: Megaphone,     label: 'Announcements' },
    ]},
  ],
  ACCOUNTS: [
    { section: 'Overview', links: [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { section: 'Finance', links: [
      { to: '/fees',        icon: Wallet,          label: 'Fee Management' },
      { to: '/students',    icon: GraduationCap,   label: 'Students' },
    ]},
    { section: 'Communication', links: [
      { to: '/announcements', icon: Megaphone,     label: 'Announcements' },
      { to: '/calendar',    icon: CalendarDays,    label: 'Academic Calendar' },
    ]},
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sections = NAV[user?.role] || []
  const allLinks = sections.flatMap(s => s.links)

  const handleLogout = () => { logout(); navigate('/login') }
  const close = () => setMobileOpen(false)

  return (
    <>
      <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Menu">
        <Menu size={18} />
      </button>
      {mobileOpen && <div className="sidebar-overlay" onClick={close} />}

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">U</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-name">UniManage</div>
              <div className="sidebar-role">{user?.role}</div>
            </div>
          )}
          <button className="sidebar-close" onClick={close}><X size={15} /></button>
          <button className="sidebar-coll-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {collapsed ? (
            // Collapsed: just icons no sections
            allLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={close}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                title={label}>
                <Icon size={17} />
              </NavLink>
            ))
          ) : (
            sections.map(({ section, links }) => (
              <div key={section}>
                <div className="nav-section-lbl">{section}</div>
                {links.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} onClick={close}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <Icon size={17} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            ))
          )}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <NavLink to="/settings" onClick={close}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            title={collapsed ? 'Settings' : undefined}>
            <Settings size={17} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <button className="nav-link logout" onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}>
            <LogOut size={17} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
