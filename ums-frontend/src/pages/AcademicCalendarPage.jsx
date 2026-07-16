import { useEffect, useState } from 'react'
import { CalendarDays, Plus, Trash2, PartyPopper, GraduationCap, Clock3, Users } from 'lucide-react'
import { calendarAPI } from '../services/api'
import { formatDate } from '../utils/helpers'
import { Loader, EmptyState, Badge, Modal, ConfirmModal } from '../components/ui'
import CustomSelect from '../components/ui/CustomSelect'
import { useAuth } from '../context/AuthContext'

const TYPE_OPTIONS = [
  { value: 'EVENT', label: 'Event' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'DEADLINE', label: 'Deadline' },
  { value: 'MEETING', label: 'Meeting' },
]

const TYPE_ICON = { EVENT: PartyPopper, HOLIDAY: CalendarDays, EXAM: GraduationCap, DEADLINE: Clock3, MEETING: Users }

const EMPTY_FORM = { title: '', description: '', eventDate: '', endDate: '', type: 'EVENT' }

export default function AcademicCalendarPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    calendarAPI.getAll().then(res => setEvents(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title || !form.eventDate) return
    setSaving(true)
    try {
      await calendarAPI.create({ ...form, endDate: form.endDate || null })
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    await calendarAPI.delete(toDelete.id)
    setToDelete(null)
    load()
  }

  if (loading) return <Loader full />

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.eventDate >= today)
  const past = events.filter(e => e.eventDate < today)

  const renderList = (list, emptyText) => list.length === 0 ? (
    <EmptyState icon={CalendarDays} title={emptyText} />
  ) : (
    <div className="cal-list">
      {list.map(ev => {
        const Icon = TYPE_ICON[ev.type] || CalendarDays
        return (
          <div className="cal-item" key={ev.id}>
            <div className={`cal-item-icon cal-${ev.type.toLowerCase()}`}><Icon size={16} /></div>
            <div className="cal-item-body">
              <div className="cal-item-top">
                <span className="cal-item-title">{ev.title}</span>
                <Badge value={ev.type} />
              </div>
              {ev.description && <p className="cal-item-desc">{ev.description}</p>}
              <span className="cal-item-date">
                {formatDate(ev.eventDate)}{ev.endDate ? ` – ${formatDate(ev.endDate)}` : ''}
              </span>
            </div>
            {isAdmin && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setToDelete(ev)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Academic Calendar</h1>
          <p className="page-subtitle">Holidays, exams, deadlines and campus events</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add Event</button>
        )}
      </div>

      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="sc-header"><div className="sc-title">Upcoming</div></div>
        {renderList(upcoming, 'No upcoming events')}
      </div>

      <div className="section-card">
        <div className="sc-header"><div className="sc-title">Past</div></div>
        {renderList(past, 'No past events yet')}
      </div>

      {showForm && (
        <Modal title="Add Calendar Event" onClose={() => setShowForm(false)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.eventDate}
                  onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">End date (optional)</label>
                <input className="form-input" type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <CustomSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={TYPE_OPTIONS} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Event'}</button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmModal title="Delete event" message={`Delete "${toDelete.title}"?`} danger
          onConfirm={remove} onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}
