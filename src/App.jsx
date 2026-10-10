import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useAuth, homeFor } from './lib/auth'
import { Spinner } from './components/ui'
import Landing from './pages/Landing'

// Dashboard and export code is downloaded only when its route is opened.
const AppShell = lazy(() => import('./components/AppShell'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminKametis = lazy(() => import('./pages/admin/AdminKametis'))
const LandingEditor = lazy(() => import('./pages/admin/LandingEditor'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const OrgDashboard = lazy(() => import('./pages/org/OrgDashboard'))
const KametiList = lazy(() => import('./pages/org/KametiList'))
const KametiWizard = lazy(() => import('./pages/org/KametiWizard'))
const KametiDetail = lazy(() => import('./pages/org/KametiDetail'))
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'))

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
      <Suspense fallback={<Spinner className="min-h-[50vh]" />}>
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
      </Suspense>
    </>
  )
}
