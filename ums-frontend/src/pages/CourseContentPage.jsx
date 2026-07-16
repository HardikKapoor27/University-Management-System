import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, FileText, ClipboardList, ListChecks, ExternalLink,
  UploadCloud, Clock, CheckCircle2, AlertTriangle, Award
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  courseAPI, moduleAPI, noteAPI, assignmentAPI, mcqAPI
} from '../services/api'
import { formatDate, formatDateTime } from '../utils/helpers'
import { Loader, EmptyState, Badge, Modal, ConfirmModal } from '../components/ui'

const TABS = [
  { key: 'notes',       label: 'Notes',       icon: FileText },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'mcq',         label: 'MCQ Exams',   icon: ListChecks },
]

export default function CourseContentPage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const isAdmin   = user?.role === 'ADMIN'
  const isFaculty = user?.role === 'FACULTY'
  const isStudent = user?.role === 'STUDENT'
  const canManage = isAdmin || isFaculty

  const [course, setCourse]   = useState(null)
  const [modules, setModules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [tab, setTab] = useState('notes')
  const [loading, setLoading] = useState(true)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' })
  const [toDeleteModule, setToDeleteModule] = useState(null)

  const loadModules = useCallback(() => {
    return moduleAPI.getByCourse(courseId).then(res => {
      setModules(res.data)
      if (res.data.length && !res.data.find(m => m.id === activeModule?.id)) {
        setActiveModule(res.data[0])
      } else if (!res.data.length) {
        setActiveModule(null)
      }
    })
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    Promise.all([courseAPI.getById(courseId), loadModules()])
      .then(([c]) => setCourse(c.data))
      .finally(() => setLoading(false))
  }, [courseId])

  const saveModule = async (e) => {
    e.preventDefault()
    if (!moduleForm.title) return
    await moduleAPI.create(moduleForm, courseId)
    setShowModuleForm(false)
    setModuleForm({ title: '', description: '' })
    loadModules()
  }

  const removeModule = async () => {
    await moduleAPI.delete(toDeleteModule.id)
    setToDeleteModule(null)
    loadModules()
  }

  if (loading) return <Loader full />
  if (!course) return <EmptyState icon={AlertTriangle} title="Course not found" />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/courses" className="cc-back"><ArrowLeft size={14} /> Back to Courses</Link>
          <h1 className="page-title" style={{ marginTop: 6 }}>{course.title}</h1>
          <p className="page-subtitle">{course.courseCode} · Module-wise notes, assignments &amp; MCQ exams</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowModuleForm(true)}>
            <Plus size={15} /> Add Module
          </button>
        )}
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={FileText} title="No modules yet"
          subtitle={canManage ? 'Add the first module to start organizing notes, assignments and MCQ exams.' : 'Your instructor hasn\'t added any modules yet.'} />
      ) : (
        <div className="cc-layout">
          <div className="cc-modules">
            {modules.map(m => (
              <button key={m.id}
                className={`cc-module-item${activeModule?.id === m.id ? ' active' : ''}`}
                onClick={() => setActiveModule(m)}>
                <span>{m.title}</span>
                {canManage && (
                  <Trash2 size={13} className="cc-module-delete"
                    onClick={(e) => { e.stopPropagation(); setToDeleteModule(m) }} />
                )}
              </button>
            ))}
          </div>

          <div className="cc-content">
            {activeModule && (
              <>
                <div className="cc-module-head">
                  <h2>{activeModule.title}</h2>
                  {activeModule.description && <p>{activeModule.description}</p>}
                </div>

                <div className="tabs">
                  {TABS.map(t => (
                    <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                      <t.icon size={14} /> {t.label}
                    </button>
                  ))}
                </div>

                {tab === 'notes' && <NotesTab moduleId={activeModule.id} canManage={canManage} />}
                {tab === 'assignments' && (
                  <AssignmentsTab moduleId={activeModule.id} canManage={canManage} isStudent={isStudent} />
                )}
                {tab === 'mcq' && (
                  <McqTab moduleId={activeModule.id} canManage={canManage} isStudent={isStudent} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showModuleForm && (
        <Modal title="Add Module" onClose={() => setShowModuleForm(false)}>
          <form onSubmit={saveModule}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={moduleForm.title}
                onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Module 1: Introduction" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-textarea" rows={3} value={moduleForm.description}
                onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModuleForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Module</button>
            </div>
          </form>
        </Modal>
      )}

      {toDeleteModule && (
        <ConfirmModal title="Delete module" danger
          message={`Delete "${toDeleteModule.title}"? This also removes its notes, assignments and MCQ exams.`}
          onConfirm={removeModule} onCancel={() => setToDeleteModule(null)} />
      )}
    </div>
  )
}

// ── Notes ───────────────────────────────────────────────────────
function NotesTab({ moduleId, canManage }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '' })
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    noteAPI.getByModule(moduleId).then(res => setNotes(res.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [moduleId])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title || !form.fileUrl) return
    await noteAPI.create(form, moduleId)
    setShowForm(false)
    setForm({ title: '', description: '', fileUrl: '' })
    load()
  }
  const remove = async () => {
    await noteAPI.delete(toDelete.id)
    setToDelete(null)
    load()
  }

  if (loading) return <Loader />

  return (
    <div>
      {canManage && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add Note
        </button>
      )}
      {notes.length === 0 ? (
        <EmptyState icon={FileText} title="No notes uploaded yet" />
      ) : (
        <div className="cc-item-list">
          {notes.map(n => (
            <div className="cc-item" key={n.id}>
              <div className="cc-item-icon"><FileText size={16} /></div>
              <div className="cc-item-body">
                <div className="cc-item-title">{n.title}</div>
                {n.description && <div className="cc-item-desc">{n.description}</div>}
                <div className="cc-item-meta">{formatDate(n.createdAt)}{n.uploadedBy && ` · ${n.uploadedBy.name}`}</div>
              </div>
              <a className="btn btn-ghost btn-sm" href={n.fileUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> Open
              </a>
              {canManage && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setToDelete(n)}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add Note" onClose={() => setShowForm(false)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">File URL (Google Drive, Dropbox, etc.)</label>
              <input className="form-input" value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://drive.google.com/…" required />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Note</button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmModal title="Delete note" message={`Delete "${toDelete.title}"?`} danger
          onConfirm={remove} onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}

// ── Assignments ─────────────────────────────────────────────────
function AssignmentsTab({ moduleId, canManage, isStudent }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', resourceUrl: '', deadline: '', maxMarks: 100 })
  const [toDelete, setToDelete] = useState(null)
  const [submitFor, setSubmitFor] = useState(null)
  const [gradeFor, setGradeFor] = useState(null)

  const load = () => {
    setLoading(true)
    assignmentAPI.getByModule(moduleId).then(res => setAssignments(res.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [moduleId])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title || !form.deadline) return
    await assignmentAPI.create({ ...form, maxMarks: Number(form.maxMarks) || 100 }, moduleId)
    setShowForm(false)
    setForm({ title: '', description: '', resourceUrl: '', deadline: '', maxMarks: 100 })
    load()
  }
  const remove = async () => {
    await assignmentAPI.delete(toDelete.id)
    setToDelete(null)
    load()
  }

  if (loading) return <Loader />

  return (
    <div>
      {canManage && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add Assignment
        </button>
      )}
      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" />
      ) : (
        <div className="cc-item-list">
          {assignments.map(a => {
            const overdue = new Date(a.deadline) < new Date()
            return (
              <div className="cc-item" key={a.id}>
                <div className="cc-item-icon"><ClipboardList size={16} /></div>
                <div className="cc-item-body">
                  <div className="cc-item-title">{a.title}</div>
                  {a.description && <div className="cc-item-desc">{a.description}</div>}
                  <div className="cc-item-meta">
                    <Clock size={11} style={{ verticalAlign: -1 }} /> Due {formatDateTime(a.deadline)}
                    {overdue && <span className="cc-overdue-tag"> · Deadline passed</span>}
                    {' '}· {a.maxMarks} marks
                  </div>
                </div>
                {a.resourceUrl && (
                  <a className="btn btn-ghost btn-sm" href={a.resourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} /> Brief
                  </a>
                )}
                {isStudent && (
                  <button className="btn btn-primary btn-sm" onClick={() => setSubmitFor(a)}>
                    <UploadCloud size={13} /> Submit
                  </button>
                )}
                {canManage && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setGradeFor(a)}>View submissions</button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setToDelete(a)}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Add Assignment" onClose={() => setShowForm(false)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignment brief URL (Word/PDF link, optional)</label>
              <input className="form-input" value={form.resourceUrl}
                onChange={e => setForm(f => ({ ...f, resourceUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="datetime-local" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Max marks</label>
                <input className="form-input" type="number" min={1} value={form.maxMarks}
                  onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Assignment</button>
            </div>
          </form>
        </Modal>
      )}

      {submitFor && <SubmitAssignmentModal assignment={submitFor} onClose={() => setSubmitFor(null)} />}
      {gradeFor && <AssignmentSubmissionsModal assignment={gradeFor} onClose={() => setGradeFor(null)} />}

      {toDelete && (
        <ConfirmModal title="Delete assignment" message={`Delete "${toDelete.title}"?`} danger
          onConfirm={remove} onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}

function SubmitAssignmentModal({ assignment, onClose }) {
  const [url, setUrl] = useState('')
  const [existing, setExisting] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    assignmentAPI.mySubmission(assignment.id).then(res => {
      setExisting(res.data && res.data.id ? res.data : null)
      if (res.data?.submissionUrl) setUrl(res.data.submissionUrl)
    }).catch(() => setExisting(null))
  }, [assignment.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await assignmentAPI.submit(assignment.id, url.trim())
      setExisting(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit')
    } finally {
      setSaving(false)
    }
  }

  const graded = existing?.marksAwarded != null

  return (
    <Modal title={`Submit: ${assignment.title}`} onClose={onClose}>
      {existing === undefined ? <Loader /> : (
        <>
          {existing && (
            <div className={`alert ${graded ? 'alert-success' : 'alert-info'}`} style={{ marginBottom: 14 }}>
              {graded
                ? `Graded: ${existing.marksAwarded}/${assignment.maxMarks}${existing.feedback ? ` — "${existing.feedback}"` : ''}`
                : `Submitted ${formatDateTime(existing.submittedAt)}${existing.isLate ? ' (late)' : ''}. You can resubmit until it's graded.`}
            </div>
          )}
          {!graded && (
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Your submission link</label>
                <input className="form-input" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/… or any hosted file link" required />
              </div>
              {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Submitting…' : existing ? 'Resubmit' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  )
}

function AssignmentSubmissionsModal({ assignment, onClose }) {
  const [subs, setSubs] = useState(null)
  const [gradingId, setGradingId] = useState(null)
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = () => assignmentAPI.getSubmissions(assignment.id).then(res => setSubs(res.data))
  useEffect(() => { load() }, [assignment.id])

  const startGrade = (s) => {
    setGradingId(s.id)
    setMarks(s.marksAwarded ?? '')
    setFeedback(s.feedback ?? '')
  }

  const saveGrade = async () => {
    await assignmentAPI.grade(gradingId, Number(marks), feedback)
    setGradingId(null)
    load()
  }

  return (
    <Modal title={`Submissions — ${assignment.title}`} onClose={onClose} wide>
      {!subs ? <Loader /> : subs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No submissions yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Submitted</th><th>Link</th><th>Marks</th><th></th></tr></thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.student?.name}</td>
                  <td>{formatDateTime(s.submittedAt)}{s.isLate && <Badge value="LATE" custom="badge-danger" />}</td>
                  <td><a href={s.submissionUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a></td>
                  <td>{gradingId === s.id ? (
                    <input className="form-input" style={{ width: 70 }} type="number" value={marks}
                      onChange={e => setMarks(e.target.value)} />
                  ) : (s.marksAwarded ?? '—') + ` / ${assignment.maxMarks}`}</td>
                  <td>
                    {gradingId === s.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="form-input" placeholder="Feedback" value={feedback}
                          onChange={e => setFeedback(e.target.value)} style={{ width: 120 }} />
                        <button className="btn btn-primary btn-xs" onClick={saveGrade}>Save</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-xs" onClick={() => startGrade(s)}>Grade</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

// ── MCQ Exams ─────────────────────────────────────────────────
function McqTab({ moduleId, canManage, isStudent }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [taking, setTaking] = useState(null)
  const [viewingSubs, setViewingSubs] = useState(null)

  const load = () => {
    setLoading(true)
    mcqAPI.getByModule(moduleId).then(res => setExams(res.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [moduleId])

  const publish = async (id) => { await mcqAPI.publish(id); load() }
  const remove = async (id) => { await mcqAPI.delete(id); load() }

  if (loading) return <Loader />

  return (
    <div>
      {canManage && (
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }} onClick={() => setShowUpload(true)}>
          <UploadCloud size={14} /> Upload MCQ Set (.docx / .pdf)
        </button>
      )}
      {exams.length === 0 ? (
        <EmptyState icon={ListChecks} title="No MCQ exams yet"
          subtitle={canManage ? 'Upload a Word or PDF question sheet to auto-generate a quiz.' : undefined} />
      ) : (
        <div className="cc-item-list">
          {exams.map(ex => (
            <div className="cc-item" key={ex.id}>
              <div className="cc-item-icon"><ListChecks size={16} /></div>
              <div className="cc-item-body">
                <div className="cc-item-title">{ex.title}</div>
                <div className="cc-item-meta">
                  {ex.questions?.length ?? '—'} questions · {ex.durationMinutes} min
                  {!ex.isPublished && <Badge value="DRAFT" custom="badge-muted" />}
                </div>
              </div>
              {isStudent && ex.isPublished && (
                <button className="btn btn-primary btn-sm" onClick={() => setTaking(ex)}>Take Quiz</button>
              )}
              {canManage && (
                <>
                  {!ex.isPublished && (
                    <button className="btn btn-success btn-sm" onClick={() => publish(ex.id)}>
                      <CheckCircle2 size={13} /> Publish
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setViewingSubs(ex)}>Results</button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(ex.id)}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <McqUploadModal moduleId={moduleId} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load() }} />
      )}
      {taking && <TakeMcqModal exam={taking} onClose={() => setTaking(null)} />}
      {viewingSubs && <McqResultsModal exam={viewingSubs} onClose={() => setViewingSubs(null)} />}
    </div>
  )
}

function McqUploadModal({ moduleId, onClose, onDone }) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!title || !file) return
    setSaving(true)
    setError('')
    try {
      const res = await mcqAPI.upload(moduleId, title, duration, file)
      onDone()
      alert(`Imported ${res.data.questionsImported} question(s). Remember to publish the exam once you've reviewed it.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not parse this file. Check the required format and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Upload MCQ Question Sheet" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Exam title</label>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <input className="form-input" type="number" min={1} value={duration}
            onChange={e => setDuration(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Question sheet (.docx or .pdf)</label>
          <input className="form-input" type="file" accept=".docx,.pdf" onChange={e => setFile(e.target.files[0])} required />
          <p className="mcq-format-hint">
            Format each question as:<br />
            <code>1. Question text?<br />A) Option&nbsp;&nbsp;B) Option&nbsp;&nbsp;C) Option&nbsp;&nbsp;D) Option<br />Answer: A</code>
          </p>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Uploading…' : 'Upload & Parse'}</button>
        </div>
      </form>
    </Modal>
  )
}

function TakeMcqModal({ exam, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    mcqAPI.take(exam.id).then(res => {
      if (res.data.message) setError(res.data.message)
      else setData(res.data)
    }).catch(err => setError(err.response?.data?.message || 'Could not load exam'))
  }, [exam.id])

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await mcqAPI.submit(exam.id, answers)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={exam.title} onClose={onClose} wide>
      {error && !result && <div className="alert alert-warning">{error}</div>}
      {!error && !data && !result && <Loader />}

      {result && (
        <div>
          <div className="mcq-result-banner">
            <Award size={28} />
            <div>
              <div className="mcq-result-score">{result.score} / {result.totalMarks}</div>
              <div className="mcq-result-pct">{result.percentage}%</div>
            </div>
          </div>
          <div className="cc-item-list">
            {result.review.map(r => (
              <div key={r.questionId} className={`mcq-review-item ${r.isCorrect ? 'correct' : 'incorrect'}`}>
                <div>{r.questionText}</div>
                <div className="cc-item-meta">
                  Your answer: {r.selectedOption ?? '—'} · Correct: {r.correctOption}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Close</button></div>
        </div>
      )}

      {data && !result && (
        <div>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>Duration: {data.durationMinutes} minutes · {data.questions.length} questions</p>
          {data.questions.map((q, idx) => (
            <div key={q.id} className="mcq-question-block">
              <div className="mcq-question-text">{idx + 1}. {q.questionText}</div>
              {['A', 'B', 'C', 'D'].map(opt => (
                <label key={opt} className="mcq-option">
                  <input type="radio" name={`q-${q.id}`} value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} />
                  <span>{opt}) {q[`option${opt}`]}</span>
                </label>
              ))}
            </div>
          ))}
          {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Answers'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function McqResultsModal({ exam, onClose }) {
  const [subs, setSubs] = useState(null)
  useEffect(() => { mcqAPI.getSubmissions(exam.id).then(res => setSubs(res.data)) }, [exam.id])

  return (
    <Modal title={`Results — ${exam.title}`} onClose={onClose}>
      {!subs ? <Loader /> : subs.length === 0 ? (
        <EmptyState icon={ListChecks} title="No submissions yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Score</th><th>Submitted</th></tr></thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>{s.student?.name}</td>
                  <td>{s.score} / {s.totalMarks}</td>
                  <td>{formatDateTime(s.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
