import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Pulse Go
import GoLanding from './go/GoLanding'
import GoLearn from './go/GoLearn'
import GoLearnDetail from './go/GoLearnDetail'
import GoQuiz from './go/GoQuiz'
import GoQuizPlay from './go/GoQuizPlay'
import GoQuizRoom from './go/GoQuizRoom'

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('pulse_user')
  return user ? children : <Navigate to="/signin" replace />
}

function AcademyDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/academy/${id}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Pulse */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<SignIn />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        <Route path="/profile/:ext" element={<Profile />} />

        {/* Pulse GO */}
        <Route path="/go" element={<GoLanding />} />
        <Route path="/go/quiz" element={<GoQuiz />} />
        <Route path="/go/quiz/play" element={<GoQuizPlay />} />
        <Route path="/go/quiz/:code" element={<GoQuizRoom />} />

        {/* Old unused route */}
        <Route path="/go/present" element={<Navigate to="/go" replace />} />

        {/* Academy clean route */}
        <Route path="/academy" element={<GoLearn />} />
        <Route path="/academy/:id" element={<GoLearnDetail />} />

        {/* Old Academy routes redirect to clean route */}
        <Route path="/go/academy" element={<Navigate to="/academy" replace />} />
        <Route path="/go/academy/:id" element={<AcademyDetailRedirect />} />

        <Route path="/go/learn" element={<Navigate to="/academy" replace />} />
        <Route path="/go/learn/:id" element={<AcademyDetailRedirect />} />
      </Routes>
    </BrowserRouter>
  )
} 