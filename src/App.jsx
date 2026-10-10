import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth, homeFor } from './lib/auth'
import { Spinner } from './components/ui'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminKametis from './pages/admin/AdminKametis'
import LandingEditor from './pages/admin/LandingEditor'
import AdminSettings from './pages/admin/AdminSettings'
import OrgDashboard from './pages/org/OrgDashboard'
import KametiList from './pages/org/KametiList'
import KametiWizard from './pages/org/KametiWizard'
import KametiDetail from './pages/org/KametiDetail'
import MemberDashboard from './pages/member/MemberDashboard'

function Guard({ roles, children }) {
  const { user, ready } = useAuth()
  if (!ready) return <Spinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return children
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Guard><AppShell /></Guard>}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/kameti/:id" element={<KametiDetail />} />
          <Route path="/admin" element={<Guard roles={['superadmin']}><AdminDashboard /></Guard>} />
          <Route path="/admin/users" element={<Guard roles={['superadmin']}><AdminUsers /></Guard>} />
          <Route path="/admin/kametis" element={<Guard roles={['superadmin']}><AdminKametis /></Guard>} />
          <Route path="/admin/landing" element={<Guard roles={['superadmin']}><LandingEditor /></Guard>} />
          <Route path="/admin/settings" element={<Guard roles={['superadmin']}><AdminSettings /></Guard>} />
          <Route path="/org" element={<Guard roles={['organizer']}><OrgDashboard /></Guard>} />
          <Route path="/org/kametis" element={<Guard roles={['organizer']}><KametiList /></Guard>} />
          <Route path="/org/new" element={<Guard roles={['organizer', 'superadmin']}><KametiWizard /></Guard>} />
          <Route path="/org/edit/:id" element={<Guard roles={['organizer', 'superadmin']}><KametiWizard /></Guard>} />
          <Route path="/me" element={<Guard roles={['member']}><MemberDashboard /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
