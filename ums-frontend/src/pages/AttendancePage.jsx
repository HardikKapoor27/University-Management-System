import { useState, useEffect, useCallback } from 'react'
import { attendanceAPI, courseAPI, studentAPI } from '../services/api'
import { Badge, EmptyState, Loader } from '../components/ui/index'
import { CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import { useAuth } from '../context/AuthContext'
import { formatDate, pctColor } from '../utils/helpers'

export default function AttendancePage() {
  const { user, refreshUser } = useAuth()
  const isStudent  = user?.role === 'STUDENT'
  const isAdmin    = user?.role === 'ADMIN'
  const isFaculty  = user?.role === 'FACULTY'
  const canMark    = isAdmin || (isFaculty && user?.isMentor)
  // Faculty who cannot mark can still VIEW (but not the student-picker — they pick course+student)
  const canView    = isAdmin || isFaculty

  const [courses, setCourses]     = useState([])
  const [students, setStudents]   = useState([])
  const [selCourse, setSelCourse] = useState('')
  // For student: auto-set to their own ID; for others: selectable
  const [selStudent, setSelStudent] = useState('')
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks]     = useState('')
  const [records, setRecords]     = useState([])
  const [pct, setPct]             = useState(null)
  const [loading, setLoading]     = useState(false)
  const [marking, setMarking]     = useState(false)
  const [msg, setMsg]             = useState({ text: '', type: '' })
  const [checkingStatus, setCheckingStatus] = useState(isFaculty)

  // Auto-set student ID for student role
  useEffect(() => {
    if (isStudent && user?.profileId) {
      setSelStudent(String(user.profileId))
    }
  }, [isStudent, user])

  // BUGFIX: a faculty member's mentor ("can mark attendance") status is cached
  // in localStorage at login time. If an admin toggles it afterwards, this
  // page would keep showing the stale value. Always pull the current value
  // fresh from the server the moment this page is opened.
  useEffect(() => {
    if (isFaculty) {
      refreshUser().finally(() => setCheckingStatus(false))
    }
  }, [isFaculty, refreshUser])

  useEffect(() => {
    courseAPI.getAll({ page:0, size:100 })
      .then(r => setCourses(r.data.content || r.data || []))
      .catch(() => {})
    if (canView) {
      studentAPI.getAll({ page:0, size:200 })
        .then(r => setStudents(r.data.content || r.data || []))
        .catch(() => {})
    }
  }, [canView])

  const loadAtt = useCallback(async () => {
    if (!selStudent || !selCourse) return
    setLoading(true)
    try {
      const r = await attendanceAPI.getForCourse(selStudent, selCourse)
      setRecords(r.data.records || [])
      setPct(r.data.attendancePercentage)
    } catch(_) { setRecords([]); setPct(null) }
    finally { setLoading(false) }
  }, [selStudent, selCourse])

  useEffect(() => { loadAtt() }, [loadAtt])

  const mark = async (status) => {
    if (!selStudent || !selCourse || !date) return
    setMarking(true)
    try {
      await attendanceAPI.mark({
        studentId: selStudent, courseId: selCourse, date, status,
        remarks: remarks.trim() || undefined,
      })
      setMsg({ text: `Marked as ${status} for ${date}`, type: 'success' })
      setRemarks('')
      loadAtt()
    } catch(e) {
      setMsg({ text: e.response?.data?.message || 'Error marking attendance', type: 'danger' })
    } finally {
      setMarking(false)
      setTimeout(() => setMsg({ text:'', type:'' }), 4000)
    }
  }

  const attPctColor = pct !== null ? pctColor(pct) : 'var(--text-3)'

  // ── Student view ──────────────────────────────────────────
  if (isStudent) {
    return (
      <>
        <Topbar title="My Attendance"/>
        <div className="page animate-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Attendance</h1>
              <p className="page-subtitle">Select a course to view your attendance records</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>
            {/* Course selector */}
            <div className="section-card">
              <div className="sc-header"><div className="sc-title">Select Course</div></div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-select" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                  <option value="">Choose a course…</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>
                  ))}
                </select>
              </div>

              {pct !== null && selCourse && (
                <div style={{ marginTop:12, padding:'16px', background:'var(--bg-elevated)',
                  borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase',
                    letterSpacing:'0.6px', marginBottom:8 }}>Overall Attendance</div>
                  <div style={{ fontSize:36, fontWeight:800, color:attPctColor, letterSpacing:'-1px' }}>
                    {pct?.toFixed(1)}%
                  </div>
                  <div style={{ marginTop:10 }}>
                    <div className="progress-bar">
                      <div className="progress-fill"
                        style={{ width:`${Math.min(pct, 100)}%`, background:attPctColor }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color: pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)',
                    marginTop:8, fontWeight:600 }}>
                    {pct >= 75 ? '✓ Good standing' : pct >= 60 ? '⚠ Warning — below 75%' : '✗ Critical — below 60%'}
                  </div>
                </div>
              )}
            </div>

            {/* Records */}
            <div className="section-card">
              <div className="sc-header">
                <div className="sc-title">
                  {selCourse ? `Attendance Records (${records.length})` : 'Attendance Records'}
                </div>
              </div>
              {!selCourse
                ? <EmptyState icon={Eye} title="Select a course" subtitle="Choose a course from the left to view your attendance"/>
                : loading ? <Loader full/>
                : records.length === 0
                ? <EmptyState title="No records yet" subtitle="Attendance hasn't been marked for this course yet"/>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
                      <tbody>
                        {records.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{formatDate(r.date)}</td>
                            <td><Badge value={r.status}/></td>
                            <td style={{ color:'var(--text-3)', fontSize:12 }}>{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Faculty / Admin view ───────────────────────────────────
  return (
    <>
      <Topbar title="Attendance"/>
      <div className="page animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance</h1>
            <p className="page-subtitle">
              {canMark ? 'Mark and view student attendance' : 'View student attendance records'}
            </p>
          </div>
        </div>

        {isFaculty && !canMark && !checkingStatus && (
          <div className="alert alert-warning" style={{ marginBottom:20, maxWidth:600 }}>
            <AlertCircle size={15}/>
            You have view-only access to attendance. Only faculty designated as mentors can mark attendance.
            Contact your administrator to update your mentor status.
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:20, alignItems:'start' }}>
          {/* Left filters */}
          <div className="section-card">
            <div className="sc-header"><div className="sc-title">Filters</div></div>

            <div className="form-group">
              <label className="form-label">Course</label>
              <select className="form-select" value={selCourse} onChange={e => setSelCourse(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} — {c.title}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Student</label>
              <select className="form-select" value={selStudent} onChange={e => setSelStudent(e.target.value)}>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>

            {/* Attendance % display */}
            {pct !== null && selStudent && selCourse && (
              <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:9,
                marginBottom:14, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase',
                  letterSpacing:'0.5px', marginBottom:6 }}>Attendance</div>
                <div style={{ fontSize:28, fontWeight:800, color:attPctColor }}>{pct?.toFixed(1)}%</div>
                <div className="progress-bar" style={{ marginTop:8 }}>
                  <div className="progress-fill"
                    style={{ width:`${Math.min(pct, 100)}%`, background:attPctColor }}/>
                </div>
              </div>
            )}

            {/* Mark attendance — only for canMark */}
            {canMark && selStudent && selCourse && (
              <>
                <div className="divider"/>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={date}
                    onChange={e => setDate(e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks (optional)</label>
                  <textarea className="form-textarea" rows={2} placeholder="e.g. Left early, Medical leave, Late by 10 min…"
                    value={remarks} onChange={e => setRemarks(e.target.value)}/>
                </div>
                {msg.text && (
                  <div className={`alert alert-${msg.type}`} style={{ marginBottom:12, fontSize:12 }}>
                    <AlertCircle size={13}/> {msg.text}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { s:'PRESENT', label:'Present', icon:CheckCircle, cls:'btn-success' },
                    { s:'ABSENT',  label:'Absent',  icon:XCircle,     cls:'btn-danger'  },
                    { s:'LATE',    label:'Late',     icon:Clock,       cls:'btn-ghost'   },
                    { s:'EXCUSED', label:'Excused',  icon:AlertCircle, cls:'btn-ghost'   },
                  ].map(({ s, label, icon: Icon, cls }) => (
                    <button key={s} className={`btn ${cls} btn-sm`}
                      style={{ justifyContent:'center' }}
                      onClick={() => mark(s)} disabled={marking}>
                      <Icon size={13}/> {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Records */}
          <div className="section-card">
            <div className="sc-header">
              <div className="sc-title">
                {selStudent && selCourse ? `Records (${records.length})` : 'Attendance Records'}
              </div>
            </div>
            {!selStudent || !selCourse
              ? <EmptyState icon={Eye} title="Select course and student"
                  subtitle="Choose a course and student from the left to view attendance"/>
              : loading ? <Loader full/>
              : records.length === 0
              ? <EmptyState title="No records yet"
                  subtitle={canMark ? 'Start marking attendance using the buttons on the left' : 'No attendance has been recorded yet'}/>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Status</th><th>Remarks</th><th>Marked By</th></tr></thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{formatDate(r.date)}</td>
                          <td><Badge value={r.status}/></td>
                          <td style={{ color:'var(--text-3)', fontSize:12 }}>{r.remarks || '—'}</td>
                          <td style={{ color:'var(--text-3)', fontSize:12 }}>{r.markedBy?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </>
  )
}
