import { GraduationCap, Target, Layers, ShieldCheck, Users2, Sparkles } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

const PILLARS = [
  {
    icon: Layers,
    title: 'One platform, every workflow',
    text: 'Departments, faculty, students, courses, timetables, attendance, exams, assignments, ' +
          'MCQ tests, fees and communication are all modeled as one connected system instead of ' +
          'disconnected spreadsheets and paper registers.',
  },
  {
    icon: Users2,
    title: 'Built around roles, not just data',
    text: 'Every screen is designed for the person using it. A mentor faculty member sees an ' +
          'attendance marking tool; a regular faculty member sees the same class list read-only. ' +
          'Students see their own records; Accounts staff see fee operations — nothing more, nothing less.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    text: 'Authentication is token-based (JWT) and every sensitive action is checked against the ' +
          'signed-in user\'s role on the server — not just hidden in the interface.',
  },
  {
    icon: Sparkles,
    title: 'Automation where it counts',
    text: 'MCQ question papers uploaded as Word or PDF documents are parsed automatically into a ' +
          'live quiz, and every submission is auto-evaluated the instant a student submits it — no ' +
          'manual grading needed for objective assessments.',
  },
]

export default function AboutPage() {
  return (
    <div className="public-page">
      <PublicNav />

      <section className="ab-hero">
        <span className="lp-eyebrow"><GraduationCap size={14} /> About the project</span>
        <h1>A University Management System, built end‑to‑end</h1>
        <p>
          AlmaUMS is a full-stack University Management System covering the day-to-day operations of a
          college or university — from admissions data and timetables to attendance, exams, assignments,
          auto-graded quizzes, fee collection and campus-wide announcements.
        </p>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Why it exists</span>
          <h2>Replacing scattered spreadsheets with one system</h2>
          <p>
            Most small and mid-size institutions run on a patchwork of Excel sheets, WhatsApp groups and
            paper registers. AlmaUMS consolidates the core academic and administrative workflows into a
            single application with proper access control, audit trails (who marked attendance, who graded
            a submission, who recorded a payment) and role-appropriate dashboards.
          </p>
        </div>
      </section>

      <section className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Design principles</span>
          <h2>What guided the build</h2>
        </div>
        <div className="ab-pillars">
          {PILLARS.map(p => (
            <div className="ab-pillar" key={p.title}>
              <div className="lp-feature-icon"><p.icon size={20} /></div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Under the hood</span>
          <h2>How it's built</h2>
        </div>
        <div className="ab-stack">
          <div className="ab-stack-item">
            <h4>Backend</h4>
            <p>Java 21 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA · MySQL</p>
          </div>
          <div className="ab-stack-item">
            <h4>Frontend</h4>
            <p>React 18 · React Router · Axios · Vite · a hand-built design system (no UI framework)</p>
          </div>
          <div className="ab-stack-item">
            <h4>Document parsing</h4>
            <p>Apache POI (Word) and Apache PDFBox (PDF) to auto-import MCQ question banks</p>
          </div>
        </div>
        <p className="ab-note">
          <Target size={14} /> This project was built as a demonstrable, end-to-end reference
          implementation of a role-based campus management system — see the Contact page to get in touch,
          or the project's README for setup instructions.
        </p>
      </section>

      <PublicFooter />
    </div>
  )
}
