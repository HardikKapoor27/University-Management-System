import { Link } from 'react-router-dom'
import {
  GraduationCap, Users, BookOpen, CalendarCheck, ClipboardList, Wallet,
  MessageSquareText, ShieldCheck, ArrowRight, CheckCircle2, LayoutDashboard,
  FileText, BarChart3, Bell
} from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

const FEATURES = [
  { icon: Users, title: 'Role-based Access', text: 'Dedicated dashboards for Admins, Faculty, Students and Accounts staff — each seeing exactly what they need.' },
  { icon: CalendarCheck, title: 'Attendance Tracking', text: 'Mentor faculty mark attendance with remarks, students track their percentage in real time.' },
  { icon: BookOpen, title: 'Modules, Notes & Assignments', text: 'Course content organized module-wise: notes, assignment links and deadlines all in one place.' },
  { icon: ClipboardList, title: 'Auto-graded MCQ Exams', text: 'Faculty upload a Word or PDF question sheet — the system parses it and grades submissions instantly.' },
  { icon: Wallet, title: 'Fee Management', text: 'A dedicated Accounts role handles fee structures, invoices, payments and receipts.' },
  { icon: BarChart3, title: 'Gradebook & Results', text: 'Exam results, attendance percentage and final grades tracked per student, per course.' },
  { icon: Bell, title: 'Notice Board & Calendar', text: 'Announcements and an academic calendar keep everyone in sync on deadlines and events.' },
  { icon: MessageSquareText, title: 'Built-in Help Assistant', text: 'A quick-answer chat assistant is available on every dashboard for common questions.' },
]

const ROLES = [
  { icon: ShieldCheck, name: 'Admin', desc: 'Full control over departments, faculty, students, courses and system-wide settings.' },
  { icon: GraduationCap, name: 'Faculty', desc: 'Manage courses, mark attendance (mentors), upload notes, assignments & MCQ exams, grade students.' },
  { icon: LayoutDashboard, name: 'Student', desc: 'View timetable, attendance, results, submit assignments, take quizzes, track fee dues.' },
  { icon: Wallet, name: 'Accounts', desc: 'Create fee structures, generate invoices, record payments and track outstanding dues.' },
]

const STATS = [
  { value: '4', label: 'User roles' },
  { value: '15+', label: 'Core modules' },
  { value: '100%', label: 'Auto-graded MCQs' },
  { value: '24/7', label: 'Help assistant' },
]

export default function LandingPage() {
  return (
    <div className="public-page">
      <PublicNav />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <span className="lp-eyebrow"><GraduationCap size={14} /> University Management System</span>
          <h1 className="lp-hero-title">
            Run your entire campus,<br /> from one connected system.
          </h1>
          <p className="lp-hero-sub">
            AlmaUMS brings admissions, attendance, academics, exams, fees and communication
            together — with a focused dashboard for every role, from admins to accounts staff.
          </p>
          <div className="lp-hero-cta">
            <Link to="/login" className="btn btn-primary btn-lg">
              Login to your dashboard <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="btn btn-secondary btn-lg">Learn more</Link>
          </div>
          <div className="lp-hero-points">
            <span><CheckCircle2 size={14} /> Role-based dashboards</span>
            <span><CheckCircle2 size={14} /> Auto-graded assessments</span>
            <span><CheckCircle2 size={14} /> Built-in fee management</span>
          </div>
        </div>
        <div className="lp-hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Everything included</span>
          <h2>One system for every part of campus life</h2>
          <p>Built for real university workflows — not just a generic CRUD admin panel.</p>
        </div>
        <div className="lp-feature-grid">
          {FEATURES.map(f => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon"><f.icon size={20} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Made for every user</span>
          <h2>A focused workspace for each role</h2>
          <p>No clutter — every login sees only the tools relevant to them.</p>
        </div>
        <div className="lp-roles-grid">
          {ROLES.map(r => (
            <div className="lp-role-card" key={r.name}>
              <div className="lp-role-icon"><r.icon size={22} /></div>
              <h3>{r.name}</h3>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <FileText size={28} className="lp-cta-icon" />
          <h2>Ready to see it in action?</h2>
          <p>Sign in with your university credentials, or reach out via our contact page for a walkthrough.</p>
          <div className="lp-hero-cta" style={{ justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary btn-lg">Login now</Link>
            <Link to="/contact" className="btn btn-secondary btn-lg">Contact us</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
