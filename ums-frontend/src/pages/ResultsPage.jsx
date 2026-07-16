import { useState, useEffect } from 'react'
import { resultAPI, examAPI, studentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, FileText, Award, TrendingUp } from 'lucide-react'
import { EmptyState, Loader, Modal } from '../components/ui/index'
import Topbar from '../components/layout/Topbar'
import { gradeColor } from '../utils/helpers'

// ── Shared grade badge ─────────────────────────────────────
function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color:'var(--text-3)' }}>—</span>
  return <span className={`badge ${gradeColor(grade)}`}>{grade}</span>
}

// ── Admin / Faculty view: pick exam → see class results ────
function ExamResultsView() {
  const [exams, setExams]     = useState([])
  const [students, setStudents] = useState([])
  const [selExam, setSelExam] = useState('')
  const [results, setResults] = useState([])
  const [avg, setAvg]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ studentId:'', marks:'', remarks:'' })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    examAPI.getAll().then(r => setExams(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    studentAPI.getAll({ page:0, size:200 }).then(r => setStudents(r.data.content || r.data || [])).catch(() => {})
  }, [])

  const load = async () => {
    if (!selExam) return
    setLoading(true)
    try {
      const r = await resultAPI.getByExam(selExam)
      setResults(r.data.results || [])
      setAvg(r.data.averageMarks)
    } catch(_) { setResults([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [selExam])

  const enter = async () => {
    if (!form.studentId || !form.marks) return alert('Student and marks are required')
    setSaving(true)
    try {
      await resultAPI.enter({ examId:selExam, studentId:form.studentId, marks:form.marks, remarks:form.remarks||undefined })
      setMsg('Result saved!'); setShowForm(false); setForm({ studentId:'', marks:'', remarks:'' }); load()
    } catch(e) { setMsg(e.response?.data?.message || 'Error') }
    finally { setSaving(false); setTimeout(() => setMsg(''), 4000) }
  }

  const exam     = exams.find(e => e.id == selExam)
  const passRate = results.length ? ((results.filter(r => r.isPassed).length / results.length) * 100).toFixed(0) : 0

  return (
    <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:20, alignItems:'start' }}>
      {/* Left panel */}
      <div className="section-card">
        <div className="sc-header"><div className="sc-title">Select Exam</div></div>
        <div className="form-group">
          <label className="form-label">Exam</label>
          <select className="form-select" value={selExam} onChange={e => setSelExam(e.target.value)}>
            <option value="">Choose exam…</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        {exam && (
          <div style={{ background:'var(--bg-elevated)', borderRadius:9, padding:'12px 14px', marginBottom:14 }}>
            {[['Course', exam.course?.title || '—'], ['Max Marks', exam.maxMarks], ['Type', exam.type]].map(([l, v]) => (
              <div key={l} className="info-row" style={{ padding:'6px 0' }}>
                <span className="info-row-label">{l}</span>
                <span className="info-row-value" style={{ fontSize:12 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {msg && <div className="alert alert-success" style={{ fontSize:12, marginBottom:14 }}>{msg}</div>}
        {selExam && (
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
            onClick={() => { setForm({ studentId:'', marks:'', remarks:'' }); setShowForm(true) }}>
            <Plus size={14}/> Enter Result
          </button>
        )}
      </div>

      {/* Right panel */}
      <div className="section-card">
        <div className="sc-header">
          <div className="sc-title">
            {selExam ? `Results (${results.length})` : 'Results'}
          </div>
          {selExam && results.length > 0 && (
            <div style={{ display:'flex', gap:18 }}>
              {avg !== null && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Avg</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--accent)' }}>{avg?.toFixed(1)}</div>
                </div>
              )}
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Pass Rate</div>
                <div style={{ fontSize:20, fontWeight:800, color: parseInt(passRate) >= 60 ? 'var(--success)' : 'var(--danger)' }}>{passRate}%</div>
              </div>
            </div>
          )}
        </div>

        {!selExam
          ? <EmptyState icon={FileText} title="Select an exam" subtitle="Choose an exam from the left to view results"/>
          : loading ? <Loader full/>
          : results.length === 0
          ? <EmptyState icon={FileText} title="No results yet" subtitle="Enter results using the button on the left"/>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Marks</th><th>Grade</th><th>Status</th><th>Remarks</th></tr></thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13 }}>{r.student?.name || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--mono)' }}>{r.student?.rollNumber}</div>
                      </td>
                      <td><span style={{ fontWeight:800, fontSize:14 }}>{r.marksObtained}</span>
                        <span style={{ color:'var(--text-3)', fontSize:11 }}> / {exam?.maxMarks}</span></td>
                      <td><GradeBadge grade={r.grade}/></td>
                      <td>{r.isPassed
                        ? <span className="badge badge-success">Pass</span>
                        : <span className="badge badge-danger">Fail</span>}</td>
                      <td style={{ color:'var(--text-3)', fontSize:12 }}>{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showForm && (
        <Modal title="Enter Result" onClose={() => setShowForm(false)}>
          <div className="form-group"><label className="form-label">Student *</label>
            <select className="form-select" value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId:e.target.value }))}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
            </select></div>
          <div className="form-group">
            <label className="form-label">Marks Obtained (out of {exam?.maxMarks})</label>
            <input className="form-input" type="number" value={form.marks}
              onChange={e => setForm(p => ({ ...p, marks:e.target.value }))}
              min={0} max={exam?.maxMarks} placeholder="85"/>
          </div>
          <div className="form-group"><label className="form-label">Remarks (optional)</label>
            <textarea className="form-textarea" value={form.remarks}
              onChange={e => setForm(p => ({ ...p, remarks:e.target.value }))} rows={2}/></div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={enter} disabled={saving}>{saving ? <Loader/> : 'Save Result'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Student view: see MY results ───────────────────────────
function StudentResultsView() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.profileId) { setLoading(false); return }
    resultAPI.getByStudent(user.profileId)
      .then(r => setResults(Array.isArray(r.data) ? r.data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Loader full/>

  if (results.length === 0) return (
    <EmptyState icon={Award} title="No results yet"
      subtitle="Your exam results will appear here once faculty has entered them"/>
  )

  const passed    = results.filter(r => r.isPassed).length
  const avgMarks  = results.length ? (results.reduce((s, r) => s + (r.marksObtained || 0), 0) / results.length).toFixed(1) : 0
  const passRate  = results.length ? ((passed / results.length) * 100).toFixed(0) : 0

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:22 }}>
        {[
          ['Total Exams',  results.length, 'var(--accent)'],
          ['Passed',       passed,          'var(--success)'],
          ['Failed',       results.length - passed, 'var(--danger)'],
          ['Avg Marks',    avgMarks,        'var(--info)'],
          ['Pass Rate',    `${passRate}%`,  parseInt(passRate) >= 60 ? 'var(--success)' : 'var(--warning)'],
        ].map(([label, val, color]) => (
          <div key={label} className="stat-card">
            <div className="stat-top-bar" style={{ background:color }}/>
            <div className="stat-num" style={{ fontSize:22, color }}>{val}</div>
            <div className="stat-lbl">{label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Exam</th><th>Course</th><th>Marks</th><th>Grade</th><th>Status</th><th>Remarks</th>
          </tr></thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight:600, fontSize:13 }}>{r.exam?.title || '—'}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    <span className={`badge badge-muted`} style={{ fontSize:10 }}>{r.exam?.type}</span>
                  </div>
                </td>
                <td style={{ fontSize:12, color:'var(--text-2)' }}>
                  {r.exam?.course?.title || '—'}
                  {r.exam?.course?.courseCode && (
                    <span style={{ display:'block', fontFamily:'var(--mono)', fontSize:11, color:'var(--accent)', marginTop:2 }}>
                      {r.exam.course.courseCode}
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight:800, fontSize:15 }}>{r.marksObtained}</span>
                  <span style={{ color:'var(--text-3)', fontSize:11 }}> / {r.exam?.maxMarks}</span>
                  {r.exam?.maxMarks && (
                    <div style={{ marginTop:4 }}>
                      <div className="progress-bar" style={{ width:80 }}>
                        <div className="progress-fill" style={{
                          width:`${Math.min((r.marksObtained / r.exam.maxMarks) * 100, 100)}%`,
                          background: (r.marksObtained / r.exam.maxMarks) >= 0.75 ? 'var(--success)'
                            : (r.marksObtained / r.exam.maxMarks) >= 0.4 ? 'var(--warning)' : 'var(--danger)'
                        }}/>
                      </div>
                    </div>
                  )}
                </td>
                <td><GradeBadge grade={r.grade}/></td>
                <td>{r.isPassed
                  ? <span className="badge badge-success">Pass</span>
                  : <span className="badge badge-danger">Fail</span>}</td>
                <td style={{ color:'var(--text-3)', fontSize:12, maxWidth:180 }}>{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Faculty view: pick exam OR see all their course results ─
function FacultyResultsView() {
  return <ExamResultsView />
}

export default function ResultsPage() {
  const { user } = useAuth()
  return (
    <>
      <Topbar title="Results"/>
      <div className="page animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Results</h1>
            <p className="page-subtitle">
              {user?.role === 'STUDENT' && 'Your exam results and academic performance'}
              {user?.role === 'FACULTY' && 'View and enter results for your courses'}
              {user?.role === 'ADMIN'   && 'View and manage all exam results'}
            </p>
          </div>
        </div>
        {user?.role === 'STUDENT'
          ? <StudentResultsView/>
          : <ExamResultsView/>
        }
      </div>
    </>
  )
}
