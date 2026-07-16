import axios from 'axios'

// In local dev, VITE_API_BASE_URL is unset and requests go to '/api/v1',
// which vite.config.js proxies to http://localhost:8080.
// In production, set VITE_API_BASE_URL to your deployed backend, e.g.
// https://your-backend.onrender.com/api/v1
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ums_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 — logout and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ums_token')
      localStorage.removeItem('ums_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/users/change-password', data),
}

// ── Students ──────────────────────────────────────────────────
export const studentAPI = {
  getAll:   (params) => api.get('/students', { params }),
  getById:  (id)     => api.get(`/students/${id}`),
  create:   (data, departmentId) => api.post(`/students?departmentId=${departmentId}`, data),
  update:   (id, data) => api.put(`/students/${id}`, data),
  delete:   (id)     => api.delete(`/students/${id}`),
  getStats: ()       => api.get('/students/stats'),
  getByDept:(deptId) => api.get(`/students/department/${deptId}`),
}

// ── Faculty ───────────────────────────────────────────────────
export const facultyAPI = {
  getAll:   (params) => api.get('/faculty', { params }),
  getById:  (id)     => api.get(`/faculty/${id}`),
  create:   (data, departmentId) => api.post(`/faculty?departmentId=${departmentId}`, data),
  update:   (id, data) => api.put(`/faculty/${id}`, data),
  delete:   (id)     => api.delete(`/faculty/${id}`),
  getByDept:(deptId) => api.get(`/faculty/department/${deptId}`),
}

// ── Departments ───────────────────────────────────────────────
export const deptAPI = {
  getAll:  ()        => api.get('/departments'),
  getById: (id)      => api.get(`/departments/${id}`),
  create:  (data)    => api.post('/departments', data),
  update:  (id, data)=> api.put(`/departments/${id}`, data),
  delete:  (id)      => api.delete(`/departments/${id}`),
}

// ── Courses ───────────────────────────────────────────────────
export const courseAPI = {
  getAll:   (params)               => api.get('/courses', { params }),
  getById:  (id)                   => api.get(`/courses/${id}`),
  create:   (data, deptId, facId)  => api.post(`/courses?departmentId=${deptId}&facultyId=${facId}`, data),
  update:   (id, data)             => api.put(`/courses/${id}`, data),
  delete:   (id)                   => api.delete(`/courses/${id}`),
  getBySem: (sem)                  => api.get(`/courses/semester/${sem}`),
  getByFac: (facId)                => api.get(`/courses/faculty/${facId}`),
}

// ── Enrollments ───────────────────────────────────────────────
export const enrollAPI = {
  enroll:      (studentId, courseId) => api.post(`/enrollments?studentId=${studentId}&courseId=${courseId}`),
  getByStudent:(studentId)           => api.get(`/enrollments/student/${studentId}`),
  getByCourse: (courseId)            => api.get(`/enrollments/course/${courseId}`),
  drop:        (id)                  => api.patch(`/enrollments/${id}/drop`),
  setGrade:    (id, grade)           => api.patch(`/enrollments/${id}/grade`, { grade }),
}

// ── Attendance ────────────────────────────────────────────────
export const attendanceAPI = {
  mark:         (params)              => api.post('/attendance/mark', null, { params }),
  getByStudent: (studentId)           => api.get(`/attendance/student/${studentId}`),
  getForCourse: (studentId, courseId) => api.get(`/attendance/student/${studentId}/course/${courseId}`),
  getClassDate: (courseId, date)      => api.get(`/attendance/course/${courseId}/date/${date}`),
}

// ── Exams ─────────────────────────────────────────────────────
export const examAPI = {
  getAll:      ()           => api.get('/exams'),
  getByCourse: (courseId)   => api.get(`/exams/course/${courseId}`),
  create:      (data, courseId) => api.post(`/exams?courseId=${courseId}`, data),
  publish:     (id)         => api.patch(`/exams/${id}/publish`),
  delete:      (id)         => api.delete(`/exams/${id}`),
}

// ── Results ───────────────────────────────────────────────────
export const resultAPI = {
  enter:       (params)     => api.post('/results', null, { params }),
  getByStudent:(studentId)  => api.get(`/results/student/${studentId}`),
  getByExam:   (examId)     => api.get(`/results/exam/${examId}`),
}

// ── Timetable ─────────────────────────────────────────────────
export const timetableAPI = {
  getBySem:    (sem)        => api.get(`/timetable/semester/${sem}`),
  getByFaculty:(facId)      => api.get(`/timetable/faculty/${facId}`),
  create:      (data, courseId, facultyId) =>
    api.post(`/timetable?courseId=${courseId}&facultyId=${facultyId}`, data),
  delete:      (id)         => api.delete(`/timetable/${id}`),
}

// ── Announcements ─────────────────────────────────────────────
export const announcementAPI = {
  getMine:    ()        => api.get('/announcements'),
  getAll:     ()        => api.get('/announcements/all'),
  create:     (data)    => api.post('/announcements', data),
  deactivate: (id)      => api.patch(`/announcements/${id}/deactivate`),
  delete:     (id)      => api.delete(`/announcements/${id}`),
}

// ── Contact (public form + admin inbox) ────────────────────────
export const contactAPI = {
  submit:       (data) => api.post('/contact', data),
  getAll:       ()     => api.get('/contact'),
  unreadCount:  ()     => api.get('/contact/unread-count'),
  updateStatus: (id, status) => api.patch(`/contact/${id}/status`, { status }),
  delete:       (id)   => api.delete(`/contact/${id}`),
}

// ── Academic Calendar ────────────────────────────────────────────
export const calendarAPI = {
  getAll:     ()               => api.get('/calendar'),
  getUpcoming:()               => api.get('/calendar/upcoming'),
  getRange:   (start, end)     => api.get('/calendar/range', { params: { start, end } }),
  create:     (data)           => api.post('/calendar', data),
  update:     (id, data)       => api.put(`/calendar/${id}`, data),
  delete:     (id)             => api.delete(`/calendar/${id}`),
}

// ── Course Modules (subject-wise organization) ──────────────────
export const moduleAPI = {
  getByCourse: (courseId)       => api.get(`/modules/course/${courseId}`),
  getById:     (id)             => api.get(`/modules/${id}`),
  create:      (data, courseId) => api.post(`/modules?courseId=${courseId}`, data),
  update:      (id, data)       => api.put(`/modules/${id}`, data),
  delete:      (id)             => api.delete(`/modules/${id}`),
}

// ── Notes (file URL based, module-wise) ─────────────────────────
export const noteAPI = {
  getByModule: (moduleId)      => api.get(`/notes/module/${moduleId}`),
  getByCourse: (courseId)      => api.get(`/notes/course/${courseId}`),
  create:      (data, moduleId)=> api.post(`/notes?moduleId=${moduleId}`, data),
  delete:      (id)            => api.delete(`/notes/${id}`),
}

// ── Assignments (URL-based, students submit a link back) ───────
export const assignmentAPI = {
  getByModule:    (moduleId)        => api.get(`/assignments/module/${moduleId}`),
  getByCourse:    (courseId)        => api.get(`/assignments/course/${courseId}`),
  getById:        (id)              => api.get(`/assignments/${id}`),
  create:         (data, moduleId)  => api.post(`/assignments?moduleId=${moduleId}`, data),
  delete:         (id)              => api.delete(`/assignments/${id}`),
  submit:         (id, submissionUrl) => api.post(`/assignments/${id}/submit`, { submissionUrl }),
  mySubmission:   (id)              => api.get(`/assignments/${id}/my-submission`),
  getSubmissions: (id)              => api.get(`/assignments/${id}/submissions`),
  grade:          (submissionId, marksAwarded, feedback) =>
    api.patch(`/assignments/submissions/${submissionId}/grade`, { marksAwarded, feedback }),
}

// ── MCQ Exams (auto-generated from uploaded docx/pdf, auto-evaluated) ──
export const mcqAPI = {
  getByModule:  (moduleId) => api.get(`/mcq/module/${moduleId}`),
  getById:      (id)       => api.get(`/mcq/${id}`),
  take:         (id)       => api.get(`/mcq/${id}/take`),
  upload:       (moduleId, title, durationMinutes, file) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    form.append('moduleId', moduleId)
    form.append('durationMinutes', durationMinutes)
    return api.post('/mcq/upload', form, { headers: { 'Content-Type': undefined } })
  },
  publish:      (id)       => api.patch(`/mcq/${id}/publish`),
  delete:       (id)       => api.delete(`/mcq/${id}`),
  submit:       (id, answers) => api.post(`/mcq/${id}/submit`, answers),
  myResult:     (id)       => api.get(`/mcq/${id}/my-result`),
  getSubmissions:(id)      => api.get(`/mcq/${id}/submissions`),
}

// ── Fee Management / Accounts ────────────────────────────────────
export const feeAPI = {
  getStructures:   ()             => api.get('/fees/structures'),
  createStructure: (data)         => api.post('/fees/structures', data),
  deleteStructure: (id)           => api.delete(`/fees/structures/${id}`),
  getAllInvoices:  ()             => api.get('/fees/invoices'),
  getStudentInvoices: (studentId) => api.get(`/fees/invoices/student/${studentId}`),
  createInvoice:   (data)         => api.post('/fees/invoices', data),
  getPayments:     (invoiceId)    => api.get(`/fees/invoices/${invoiceId}/payments`),
  recordPayment:   (invoiceId, data) => api.post(`/fees/invoices/${invoiceId}/payments`, data),
  duesSummary:     ()             => api.get('/fees/dues-summary'),
  sendReminder:    (invoiceId, message) => api.post(`/fees/invoices/${invoiceId}/remind`, message ? { message } : {}),
  myReminders:     ()             => api.get('/fees/reminders/my'),
  unreadReminderCount: ()         => api.get('/fees/reminders/unread-count'),
  markReminderRead:(id)           => api.patch(`/fees/reminders/${id}/read`),
  reminderHistory: (studentId)    => api.get(`/fees/reminders/student/${studentId}`),
}
