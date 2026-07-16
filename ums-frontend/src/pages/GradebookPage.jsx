import { useEffect, useState } from 'react'
import { Award, Save, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { courseAPI, enrollAPI, resultAPI } from '../services/api'
import { Loader, EmptyState, Badge } from '../components/ui'
import CustomSelect from '../components/ui/CustomSelect'
import { gradeColor } from '../utils/helpers'

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'F'].map(g => ({ value: g, label: g }))

export default function GradebookPage() {
  const { user } = useAuth()
  const isFaculty = user?.role === 'FACULTY'

  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    const load = isFaculty && user?.profileId
      ? courseAPI.getByFac(user.profileId)
      : courseAPI.getAll({ size: 100 })
    load.then(res => {
      const list = Array.isArray(res.data) ? res.data : res.data.content
      setCourses(list || [])
      if (list?.length) setCourseId(String(list[0].id))
    })
  }, [isFaculty, user])

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    enrollAPI.getByCourse(courseId)
      .then(async (enrollRes) => {
        const enrollments = enrollRes.data
        const withResults = await Promise.all(enrollments.map(async (e) => {
          try {
            const r = await resultAPI.getByStudent(e.student.id)
            const relevant = r.data.filter(res => res.exam?.course?.id === Number(courseId))
            const avg = relevant.length
              ? (relevant.reduce((s, x) => s + (x.marksObtained / (x.exam?.maxMarks || 100)) * 100, 0) / relevant.length)
              : null
            return { ...e, avgPct: avg, examCount: relevant.length }
          } catch {
            return { ...e, avgPct: null, examCount: 0 }
          }
        }))
        setRows(withResults)
      })
      .finally(() => setLoading(false))
  }, [courseId])

  const setGrade = async (enrollmentId, grade) => {
    setSaving(s => ({ ...s, [enrollmentId]: true }))
    try {
      await enrollAPI.setGrade(enrollmentId, grade)
      setRows(rs => rs.map(r => r.id === enrollmentId ? { ...r, grade } : r))
    } finally {
      setSaving(s => ({ ...s, [enrollmentId]: false }))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Gradebook</h1>
          <p className="page-subtitle">Review exam performance and assign a final course grade</p>
        </div>
      </div>

      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ maxWidth: 360, marginBottom: 0 }}>
          <label className="form-label">Course</label>
          <CustomSelect value={courseId} onChange={setCourseId}
            options={courses.map(c => ({ value: String(c.id), label: `${c.courseCode} — ${c.title}` }))}
            placeholder="Select a course" />
        </div>
      </div>

      {loading ? <Loader full /> : rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="No students enrolled in this course yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Roll No.</th><th>Exams Taken</th><th>Average %</th><th>Current Grade</th><th>Assign Grade</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.student?.name}</td>
                  <td>{r.student?.rollNumber}</td>
                  <td>{r.examCount}</td>
                  <td>{r.avgPct != null ? `${r.avgPct.toFixed(1)}%` : '—'}</td>
                  <td>{r.grade ? <Badge value={r.grade} custom={gradeColor(r.grade)} /> : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 90 }}>
                        <CustomSelect value={r.grade || ''} onChange={(g) => setGrade(r.id, g)}
                          options={GRADE_OPTIONS} placeholder="Grade" />
                      </div>
                      {saving[r.id] && <Save size={14} className="spin-icon" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
