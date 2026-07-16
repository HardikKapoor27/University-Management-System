import { Printer, X, GraduationCap } from 'lucide-react'
import { formatDate, formatDateTime } from '../utils/helpers'

/**
 * A full-screen printable fee receipt. Uses the browser's native print
 * dialog — the person can either print it or choose "Save as PDF" as the
 * destination, which produces a real PDF file without needing any extra
 * client-side PDF library.
 */
export default function ReceiptPrintModal({ invoice, payment, onClose }) {
  return (
    <div className="receipt-overlay">
      <div className="receipt-toolbar no-print">
        <button className="btn btn-ghost" onClick={onClose}><X size={15} /> Close</button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      <div className="receipt-print-area">
        <div className="receipt-doc">
          <div className="receipt-head">
            <div className="receipt-brand">
              <span className="public-logo-icon"><GraduationCap size={20} /></span>
              <div>
                <div className="receipt-brand-name">AlmaUMS University</div>
                <div className="receipt-brand-tag">MG Road, Bengaluru, Karnataka, India</div>
              </div>
            </div>
            <div className="receipt-doc-title">
              <div>FEE RECEIPT</div>
              <div className="receipt-doc-number">{payment.receiptNumber}</div>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-grid">
            <div>
              <div className="receipt-label">Billed to</div>
              <div className="receipt-value">{invoice.student?.name}</div>
              <div className="receipt-sub">Roll No: {invoice.student?.rollNumber}</div>
            </div>
            <div>
              <div className="receipt-label">Invoice #</div>
              <div className="receipt-value">{invoice.invoiceNumber}</div>
              <div className="receipt-sub">Semester {invoice.semester} · {invoice.academicYear}</div>
            </div>
            <div>
              <div className="receipt-label">Payment Date</div>
              <div className="receipt-value">{formatDate(payment.paymentDate)}</div>
              <div className="receipt-sub">Recorded {formatDateTime(payment.createdAt)}</div>
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr><th>Description</th><th>Method</th><th>Reference</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Fee payment — Semester {invoice.semester}, {invoice.academicYear}</td>
                <td>{payment.method}</td>
                <td>{payment.transactionRef || '—'}</td>
                <td style={{ textAlign: 'right' }}>₹{payment.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Amount Paid</td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{payment.amount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', color: '#666' }}>Invoice Total Due</td>
                <td style={{ textAlign: 'right', color: '#666' }}>₹{invoice.amountDue.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', color: '#666' }}>Total Paid to Date</td>
                <td style={{ textAlign: 'right', color: '#666' }}>₹{invoice.amountPaid.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', color: '#666' }}>Remaining Balance</td>
                <td style={{ textAlign: 'right', color: '#666' }}>
                  ₹{(invoice.amountDue - invoice.amountPaid).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="receipt-footer">
            <div>
              <div className="receipt-label">Received by</div>
              <div className="receipt-value">{payment.receivedBy || '—'}</div>
            </div>
            <div className="receipt-signature">
              <div className="receipt-signature-line" />
              <div className="receipt-sub">Authorized Signatory</div>
            </div>
          </div>

          <p className="receipt-note">
            This is a computer-generated receipt from the AlmaUMS Fee Management system and does not require a physical signature.
          </p>
        </div>
      </div>
    </div>
  )
}
