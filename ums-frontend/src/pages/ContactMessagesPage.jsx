import { useEffect, useState } from 'react'
import { Mail, Phone, Trash2, Inbox, CheckCheck } from 'lucide-react'
import { contactAPI } from '../services/api'
import { formatDateTime } from '../utils/helpers'
import { Loader, EmptyState, Badge, ConfirmModal } from '../components/ui'

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [active, setActive]     = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const load = () => {
    setLoading(true)
    contactAPI.getAll().then(res => setMessages(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const open = async (msg) => {
    setActive(msg)
    if (msg.status === 'NEW') {
      try {
        await contactAPI.updateStatus(msg.id, 'READ')
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'READ' } : m))
      } catch { /* ignore */ }
    }
  }

  const markResponded = async (id) => {
    await contactAPI.updateStatus(id, 'RESPONDED')
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'RESPONDED' } : m))
    setActive(a => a && a.id === id ? { ...a, status: 'RESPONDED' } : a)
  }

  const remove = async () => {
    await contactAPI.delete(toDelete.id)
    setMessages(prev => prev.filter(m => m.id !== toDelete.id))
    if (active?.id === toDelete.id) setActive(null)
    setToDelete(null)
  }

  if (loading) return <Loader full />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Contact Messages</h1>
          <p className="page-subtitle">Submissions from the public Contact Us page</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages yet" subtitle="Contact form submissions will appear here." />
      ) : (
        <div className="contact-inbox">
          <div className="contact-inbox-list">
            {messages.map(m => (
              <button key={m.id}
                className={`contact-inbox-item${active?.id === m.id ? ' active' : ''}${m.status === 'NEW' ? ' unread' : ''}`}
                onClick={() => open(m)}>
                <div className="contact-inbox-item-top">
                  <span className="contact-inbox-name">{m.name}</span>
                  <Badge value={m.status} />
                </div>
                <div className="contact-inbox-subject">{m.subject}</div>
                <div className="contact-inbox-date">{formatDateTime(m.createdAt)}</div>
              </button>
            ))}
          </div>

          <div className="contact-inbox-detail">
            {!active ? (
              <EmptyState icon={Mail} title="Select a message" subtitle="Click a message on the left to read it." />
            ) : (
              <div>
                <div className="contact-detail-head">
                  <div>
                    <h2>{active.subject}</h2>
                    <div className="contact-detail-meta">
                      <span>{active.name}</span>
                      <span>·</span>
                      <span><Mail size={12} /> {active.email}</span>
                      {active.phone && <><span>·</span><span><Phone size={12} /> {active.phone}</span></>}
                    </div>
                    <div className="contact-detail-date">{formatDateTime(active.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {active.status !== 'RESPONDED' && (
                      <button className="btn btn-success btn-sm" onClick={() => markResponded(active.id)}>
                        <CheckCheck size={14} /> Mark responded
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => setToDelete(active)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
                <p className="contact-detail-message">{active.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete message"
          message={`Delete the message from "${toDelete.name}"? This cannot be undone.`}
          danger
          onConfirm={remove}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
