import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Feed from './pages/Feed'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Premium from './pages/Premium'

function FullPageSpinner() {
  return (
    <div className="grid min-h-full place-items-center bg-navy-950">
      <Spinner label="Starting DealMatch…" />
    </div>
  )
}

// Requires a logged-in, onboarded user.
function Protected({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />
  return children
}

// Routes for logged-out users; redirect inward once authenticated.
function PublicOnly({ children }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (session) return <Navigate to={profile?.onboarded ? '/feed' : '/onboarding'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/feed" element={<Protected><Feed /></Protected>} />
      <Route path="/matches" element={<Protected><Matches /></Protected>} />
      <Route path="/chat/:matchId" element={<Protected><Chat /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/premium" element={<Protected><Premium /></Protected>} />

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  )
}
