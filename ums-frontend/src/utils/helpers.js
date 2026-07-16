export const getInitials = (name = '') =>
  name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || '?'

export const formatDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

export const formatDateTime = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  })
}

export const gradeColor = (g) =>
  ({ A:'badge-success', B:'badge-teal', C:'badge-info', D:'badge-warning', F:'badge-danger' }[g] || 'badge-muted')

export const statusColor = (s) => {
  const m = {
    ACTIVE:'badge-success', INACTIVE:'badge-muted', GRADUATED:'badge-teal', SUSPENDED:'badge-danger',
    ENROLLED:'badge-success', DROPPED:'badge-danger', COMPLETED:'badge-teal', FAILED:'badge-danger',
    PRESENT:'badge-success', ABSENT:'badge-danger', LATE:'badge-warning', EXCUSED:'badge-info',
    PROFESSOR:'badge-accent', ASSOCIATE_PROFESSOR:'badge-info',
    ASSISTANT_PROFESSOR:'badge-warning', LECTURER:'badge-muted', VISITING:'badge-muted',
    THEORY:'badge-info', PRACTICAL:'badge-teal', LAB:'badge-accent', ELECTIVE:'badge-muted',
    MIDTERM:'badge-warning', FINAL:'badge-danger', QUIZ:'badge-info',
    ASSIGNMENT:'badge-muted', PRACTICAL_EXAM:'badge-teal', VIVA:'badge-accent',
    ON_LEAVE:'badge-warning',
    PENDING:'badge-warning', PARTIAL:'badge-info', PAID:'badge-success', OVERDUE:'badge-danger',
    NEW:'badge-accent', READ:'badge-info', RESPONDED:'badge-success',
    HOLIDAY:'badge-teal', EXAM:'badge-danger', EVENT:'badge-info', DEADLINE:'badge-warning', MEETING:'badge-muted',
  }
  return m[s] || 'badge-muted'
}

export const pctColor = (pct) =>
  pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'

export const DAYS_ORDER  = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
export const DAY_LABELS  = { MONDAY:'Mon', TUESDAY:'Tue', WEDNESDAY:'Wed', THURSDAY:'Thu', FRIDAY:'Fri', SATURDAY:'Sat' }
