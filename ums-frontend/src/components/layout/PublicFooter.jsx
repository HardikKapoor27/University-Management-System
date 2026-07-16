import { Link } from 'react-router-dom'
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react'

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-col">
          <div className="public-logo" style={{ marginBottom: 12 }}>
            <span className="public-logo-icon"><GraduationCap size={20} /></span>
            <span>Alma<b>UMS</b></span>
          </div>
          <p className="public-footer-tag">
            A complete university management system — academics, attendance,
            exams, fees and communication in one place.
          </p>
        </div>

        <div className="public-footer-col">
          <h4>Navigate</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
        </div>

        <div className="public-footer-col">
          <h4>Contact</h4>
          <span className="public-footer-line"><Mail size={14} /> info@almaums.edu</span>
          <span className="public-footer-line"><Phone size={14} /> +91 98765 43210</span>
          <span className="public-footer-line"><MapPin size={14} /> Bengaluru, Karnataka, India</span>
        </div>
      </div>
      <div className="public-footer-bottom">
        © {new Date().getFullYear()} AlmaUMS — University Management System. Built for demonstration purposes.
      </div>
    </footer>
  )
}
