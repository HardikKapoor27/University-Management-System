import { X, AlertTriangle } from 'lucide-react'
import { statusColor } from '../../utils/helpers'

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`}>
        <div className="modal-hd">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-hd">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '4px 0 20px' }}>
          <AlertTriangle size={20} style={{ color: danger ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export function Badge({ value, custom }) {
  const cls = custom || statusColor(value)
  const label = value?.toString().replace(/_/g, ' ')
  return <span className={`badge ${cls}`}>{label}</span>
}

export function Loader({ full, size = 18 }) {
  if (full) return (
    <div className="loading-center">
      <div className="spinner spinner-lg" />
      <span>Loading…</span>
    </div>
  )
  return <div className="spinner" style={{ width: size, height: size }} />
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={38} className="empty-state-icon" />}
      <h3>{title || 'Nothing here yet'}</h3>
      {subtitle && <p style={{ marginTop: 5 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i)
  return (
    <div className="pagination">
      <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
      {pages.map(i => (
        <button key={i} className={`pg-btn${i === page ? ' active' : ''}`} onClick={() => onChange(i)}>{i + 1}</button>
      ))}
      <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>›</button>
    </div>
  )
}

export function SectionCard({ title, action, children, style, noPad }) {
  return (
    <div className="section-card" style={style}>
      {(title || action) && (
        <div className="sc-header">
          {title && <div className="sc-title">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'var(--accent)', trend, trendUp }) {
  return (
    <div className="stat-card">
      <div className="stat-accent-bar" style={{ background: color }} />
      <div className="stat-icon-wrap" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="stat-num">{value ?? '—'}</div>
      <div className="stat-lbl">{label}</div>
      {trend && (
        <div className="stat-trend"
          style={{ background: trendUp ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: trendUp ? 'var(--success)' : 'var(--danger)' }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  )
}
