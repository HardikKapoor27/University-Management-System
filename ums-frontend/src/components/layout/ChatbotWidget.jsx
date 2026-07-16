import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// A small, fully client-side rule-based assistant — no external AI call, just
// pattern matching against common questions (the kind of "hardcoded FAQ bot"
// seen on most product websites). Each rule is checked in order; the first
// whose keywords all/any match wins.
const RULES = [
  { keywords: ['attendance', 'present', 'absent'],
    answer: 'Attendance is visible under the "Attendance" tab. Students see their own percentage per course. ' +
            'Only faculty marked as a "mentor" by the admin can mark attendance — everyone else has view-only access. ' +
            'When marking, you can add optional remarks and it will always show who marked each entry.' },
  { keywords: ['mentor'],
    answer: 'A faculty member becomes eligible to mark attendance when an admin enables "Can mark attendance" for them ' +
            'in Faculty Management. If your access changed recently, simply reopen the Attendance page — it always ' +
            're-checks your latest status.' },
  { keywords: ['result', 'grade', 'marks', 'score'],
    answer: 'Exam results are under "Results". Faculty enter marks per exam; students see their own results and ' +
            'overall grade. Faculty/Admin can also assign a final course grade from the Gradebook.' },
  { keywords: ['gradebook'],
    answer: 'The Gradebook (Faculty/Admin) lets you pick a course, see every enrolled student\'s exam performance, ' +
            'and assign a final letter grade for the course.' },
  { keywords: ['assignment', 'submit', 'submission', 'deadline'],
    answer: 'Assignments live inside each course\'s Modules. Faculty post a link to the assignment brief with a ' +
            'deadline; students submit a link back (e.g. a Drive/Docs link) before the deadline. Late submissions ' +
            'are flagged automatically.' },
  { keywords: ['mcq', 'quiz', 'exam upload', 'auto grade', 'auto-evaluat'],
    answer: 'Faculty can create an MCQ quiz by uploading a Word (.docx) or PDF file formatted as ' +
            '"1. Question? A) ... B) ... C) ... D) ... Answer: A" — questions are extracted automatically. ' +
            'Once published, students take the quiz and get an instant auto-graded score.' },
  { keywords: ['notes'],
    answer: 'Notes are organized module-wise under each course. Faculty upload a link to the file (e.g. Google Drive) ' +
            'and students can view/download it from the course\'s Modules section.' },
  { keywords: ['fee', 'invoice', 'payment', 'due', 'receipt'],
    answer: 'Fee management is handled by the Accounts role. Students can see their invoices and payment history ' +
            'under "Fees". Accounts/Admin staff generate invoices and record payments, which produces a receipt ' +
            'number automatically.' },
  { keywords: ['password', 'login', 'forgot', 'reset'],
    answer: 'You can change your password from Settings → Change Password once logged in. If you\'re locked out ' +
            'entirely, please contact your administrator to reset it for you.' },
  { keywords: ['timetable', 'schedule', 'class time'],
    answer: 'Your weekly class schedule is under "Timetable", organized by day and period.' },
  { keywords: ['notice', 'announcement'],
    answer: 'Campus-wide notices are posted under "Announcements" (the notice board) — you\'ll see the ones ' +
            'targeted at your role, sorted by priority.' },
  { keywords: ['calendar', 'holiday', 'event'],
    answer: 'The Academic Calendar lists upcoming exams, holidays, deadlines and events for the whole institution.' },
  { keywords: ['contact', 'support', 'help desk', 'human', 'admin'],
    answer: 'For anything this assistant can\'t resolve, use the public Contact page to send a message to the ' +
            'admin team, or reach out to your department office directly.' },
  { keywords: ['course', 'enroll', 'enrolment', 'enrollment'],
    answer: 'Courses are listed under "Courses". Enrollment (linking a student to a course) is managed by ' +
            'Admin/Faculty under "Enrollments".' },
]

const FALLBACK =
  "I don't have a canned answer for that yet. Try asking about attendance, results, assignments, MCQ exams, " +
  "notes, fees, timetable, notices or the calendar — or use the Contact page to reach a real person."

function answerFor(text) {
  const lower = text.toLowerCase()
  const hit = RULES.find(r => r.keywords.some(k => lower.includes(k)))
  return hit ? hit.answer : FALLBACK
}

const QUICK_TOPICS = ['Attendance', 'Results & Grades', 'Assignments', 'MCQ exams', 'Fees', 'Timetable']

export default function ChatbotWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Hi${user?.profileName ? ' ' + user.profileName.split(' ')[0] : ''}! I'm the AlmaUMS help assistant. Ask me about attendance, results, assignments, MCQ exams, fees, timetable or notices.` }
  ])
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, open])

  const send = (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed) return
    const reply = answerFor(trimmed)
    setMessages(prev => [...prev, { from: 'user', text: trimmed }, { from: 'bot', text: reply }])
    setInput('')
  }

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(o => !o)} aria-label="Help">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-hd">
            <div className="chatbot-hd-icon"><Bot size={16} /></div>
            <div>
              <div className="chatbot-hd-title">Help Assistant</div>
              <div className="chatbot-hd-sub">Automated answers · common questions</div>
            </div>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-msg ${m.from}`}>{m.text}</div>
            ))}
          </div>

          <div className="chatbot-quick">
            {QUICK_TOPICS.map(t => (
              <button key={t} className="chatbot-chip" onClick={() => send(t)}>
                <Sparkles size={11} /> {t}
              </button>
            ))}
          </div>

          <form className="chatbot-input-row" onSubmit={e => { e.preventDefault(); send() }}>
            <input
              className="form-input"
              placeholder="Ask a question…"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button className="btn btn-primary btn-icon" type="submit" aria-label="Send"><Send size={15} /></button>
          </form>
        </div>
      )}
    </>
  )
}
