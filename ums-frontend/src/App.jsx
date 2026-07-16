import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/layout/Sidebar'
import ChatbotWidget from './components/layout/ChatbotWidget'

import LandingPage        from './pages/LandingPage'
import AboutPage          from './pages/AboutPage'
import ContactPage        from './pages/ContactPage'
import LoginPage          from './pages/LoginPage'
import Dashboard          from './pages/Dashboard'
import StudentsPage       from './pages/StudentsPage'
import FacultyPage        from './pages/FacultyPage'
import DepartmentsPage    from './pages/DepartmentsPage'
import CoursesPage        from './pages/CoursesPage'
import CourseContentPage  from './pages/CourseContentPage'
import EnrollmentsPage    from './pages/EnrollmentsPage'
import AttendancePage     from './pages/AttendancePage'
import ExamsPage          from './pages/ExamsPage'
import ResultsPage        from './pages/ResultsPage'
import TimetablePage      from './pages/TimetablePage'
import AnnouncementsPage  from './pages/AnnouncementsPage'
import SettingsPage       from './pages/SettingsPage'
import AcademicCalendarPage from './pages/AcademicCalendarPage'
import GradebookPage      from './pages/GradebookPage'
import FeesPage           from './pages/FeesPage'
import ContactMessagesPage from './pages/ContactMessagesPage'
import ProfilePage         from './pages/ProfilePage'

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
      <ChatbotWidget />
    </div>
  )
}

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <AppShell>{children}</AppShell>
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

function CatchAll() {
  const { user } = useAuth()
  return <Navigate to={user ? '/dashboard' : '/'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing site */}
            <Route path="/"        element={<LandingPage />} />
            <Route path="/about"   element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />

            {/* Authenticated app */}
            <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/students"      element={<PrivateRoute><StudentsPage /></PrivateRoute>} />
            <Route path="/faculty"       element={<PrivateRoute roles={['ADMIN']}><FacultyPage /></PrivateRoute>} />
            <Route path="/departments"   element={<PrivateRoute roles={['ADMIN']}><DepartmentsPage /></PrivateRoute>} />
            <Route path="/courses"       element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
            <Route path="/courses/:courseId/content" element={<PrivateRoute><CourseContentPage /></PrivateRoute>} />
            <Route path="/enrollments"   element={<PrivateRoute roles={['ADMIN','FACULTY']}><EnrollmentsPage /></PrivateRoute>} />
            <Route path="/attendance"    element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
            <Route path="/exams"         element={<PrivateRoute roles={['ADMIN','FACULTY','STUDENT']}><ExamsPage /></PrivateRoute>} />
            <Route path="/results"       element={<PrivateRoute roles={['ADMIN','FACULTY','STUDENT']}><ResultsPage /></PrivateRoute>} />
            <Route path="/gradebook"     element={<PrivateRoute roles={['ADMIN','FACULTY']}><GradebookPage /></PrivateRoute>} />
            <Route path="/timetable"     element={<PrivateRoute roles={['ADMIN','FACULTY','STUDENT']}><TimetablePage /></PrivateRoute>} />
            <Route path="/calendar"      element={<PrivateRoute><AcademicCalendarPage /></PrivateRoute>} />
            <Route path="/fees"          element={<PrivateRoute roles={['ADMIN','STUDENT','ACCOUNTS']}><FeesPage /></PrivateRoute>} />
            <Route path="/announcements" element={<PrivateRoute><AnnouncementsPage /></PrivateRoute>} />
            <Route path="/contact-messages" element={<PrivateRoute roles={['ADMIN']}><ContactMessagesPage /></PrivateRoute>} />
            <Route path="/profile"       element={<PrivateRoute roles={['STUDENT','FACULTY']}><ProfilePage /></PrivateRoute>} />
            <Route path="/settings"      element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

            <Route path="*" element={<CatchAll />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
