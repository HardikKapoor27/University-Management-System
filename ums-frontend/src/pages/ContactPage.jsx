import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'
import { contactAPI } from '../services/api'

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' }

export default function ContactPage() {
  const [form, setForm]       = useState(EMPTY)
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in your name, email, subject and message.')
      return
    }
    setSending(true)
    try {
      await contactAPI.submit(form)
      setSent(true)
      setForm(EMPTY)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="public-page">
      <PublicNav />

      <section className="ab-hero">
        <span className="lp-eyebrow"><Mail size={14} /> Get in touch</span>
        <h1>We'd love to hear from you</h1>
        <p>Questions about admissions, a demo walkthrough, or feedback on the system — send us a message.</p>
      </section>

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-info-item">
              <div className="lp-feature-icon"><Mail size={18} /></div>
              <div>
                <h4>Email</h4>
                <p>info@almaums.edu</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="lp-feature-icon"><Phone size={18} /></div>
              <div>
                <h4>Phone</h4>
                <p>+91 98765 43210</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="lp-feature-icon"><MapPin size={18} /></div>
              <div>
                <h4>Campus address</h4>
                <p>AlmaUMS University, MG Road, Bengaluru, Karnataka, India</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="lp-feature-icon"><Clock size={18} /></div>
              <div>
                <h4>Office hours</h4>
                <p>Mon – Sat, 9:00 AM – 5:00 PM IST</p>
              </div>
            </div>
          </div>

          <div className="contact-form-card">
            {sent ? (
              <div className="contact-success">
                <CheckCircle2 size={36} />
                <h3>Message sent!</h3>
                <p>Thanks for reaching out — our team will get back to you shortly.</p>
                <button className="btn btn-secondary" onClick={() => setSent(false)}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full name *</label>
                    <input className="form-input" value={form.name} onChange={set('name')} placeholder="Jane Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone (optional)</label>
                    <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 90000 00000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input className="form-input" value={form.subject} onChange={set('subject')} placeholder="Admissions enquiry" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-textarea" rows={5} value={form.message} onChange={set('message')}
                    placeholder="Tell us a bit about what you need…" />
                </div>
                {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
                <button className="btn btn-primary btn-lg" disabled={sending} type="submit">
                  <Send size={15} /> {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
