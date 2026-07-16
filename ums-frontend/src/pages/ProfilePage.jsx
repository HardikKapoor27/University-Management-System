import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Phone, MapPin, Calendar, GraduationCap, Building2, Cake, User as UserIcon,
  ClipboardList, FileText, CalendarDays, Wallet, Settings as SettingsIcon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { studentAPI, facultyAPI } from '../services/api'
import { formatDate } from '../utils/helpers'
import { Loader, Badge, EmptyState } from '../components/ui'

export default function ProfilePage() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.profileId) { setLoading(false); return }
    const call = isStudent ? studentAPI.getById(user.profileId) : facultyAPI.getById(user.profileId)
    call.then(res => setProfile(res.data)).finally(() => setLoading(false))
  }, [user, isStudent])

  if (loading) return <Loader full />
  if (!profile) return <EmptyState icon={UserIcon} title="No profile found" subtitle="Your account isn't linked to a student/faculty profile." />

  const quickLinks = isStudent
    ? [
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/results', icon: FileText, label: 'Results' },
        { to: '/calendar', icon: CalendarDays, label: 'Academic Calendar' },
        { to: '/fees', icon: Wallet, label: 'My Fees' },
      ]
    : [
        { to: '/courses', icon: GraduationCap, label: 'My Courses' },
        { to: '/gradebook', icon: FileText, label: 'Gradebook' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/calendar', icon: CalendarDays, label: 'Academic Calendar' },
      ]

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your personal and academic details</p>
        </div>
        <Link to="/settings" className="btn btn-secondary btn-sm"><SettingsIcon size={14} /> Account Settings</Link>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar">{profile.name?.charAt(0) || '?'}</div>
        <div className="profile-hero-info">
          <h2>{profile.name}</h2>
          <div className="profile-hero-meta">
            <span>{isStudent ? profile.rollNumber : profile.employeeId}</span>
            <span>·</span>
            <span>{profile.department?.name || 'No department'}</span>
            <span>·</span>
            <Badge value={profile.status} />
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="section-card">
          <div className="sc-header"><div className="sc-title">Contact Information</div></div>
          <div className="profile-detail-list">
            <div className="profile-detail-row"><Mail size={15} /><span>{profile.email}</span></div>
            <div className="profile-detail-row"><Phone size={15} /><span>{profile.phone || 'Not provided'}</span></div>
            {isStudent && (
              <div className="profile-detail-row"><MapPin size={15} /><span>{profile.address || 'Not provided'}</span></div>
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="sc-header"><div className="sc-title">Academic Information</div></div>
          <div className="profile-detail-list">
            <div className="profile-detail-row"><Building2 size={15} /><span>{profile.department?.name || '—'}</span></div>
            {isStudent ? (
              <>
                <div className="profile-detail-row"><GraduationCap size={15} /><span>Semester {profile.semester}</span></div>
                <div className="profile-detail-row"><Calendar size={15} /><span>Admission Year: {profile.admissionYear || '—'}</span></div>
              </>
            ) : (
              <>
                <div className="profile-detail-row"><GraduationCap size={15} /><span>{profile.designation} · {profile.qualification || 'N/A'}</span></div>
                <div className="profile-detail-row"><Calendar size={15} /><span>Joined {profile.joiningDate ? formatDate(profile.joiningDate) : '—'}</span></div>
              </>
            )}
            {profile.dateOfBirth && (
              <div className="profile-detail-row"><Cake size={15} /><span>Born {formatDate(profile.dateOfBirth)}</span></div>
            )}
            {!isStudent && profile.isMentor != null && (
              <div className="profile-detail-row">
                <ClipboardList size={15} />
                <span>{profile.isMentor ? 'Mentor — can mark attendance' : 'Not a mentor — view-only attendance access'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="sc-header"><div className="sc-title">Quick Links</div></div>
        <div className="profile-quicklinks">
          {quickLinks.map(l => (
            <Link key={l.to} to={l.to} className="profile-quicklink">
              <l.icon size={16} /> {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
