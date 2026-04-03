import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing  from './pages/Landing'
import Register from './pages/Register'
import SignIn   from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Admin    from './pages/Admin'
import Profile  from './pages/Profile'
import Settings from './pages/Settings'

// Pulse Go
import GoLanding     from './go/GoLanding'
import GoLearn       from './go/GoLearn'
import GoLearnDetail from './go/GoLearnDetail'
import GoQuiz        from './go/GoQuiz'
import GoQuizPlay    from './go/GoQuizPlay'
import GoPresent     from './go/GoPresent'

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('pulse_user')
  return user ? children : <Navigate to="/signin" replace/>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Main Pulse ── */}
        <Route path="/"          element={<Landing />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/signin"    element={<SignIn />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin"     element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/profile/:ext" element={<Profile />} />

        {/* ── Pulse Go ── */}
        <Route path="/go"              element={<GoLanding />} />
        <Route path="/go/learn"        element={<GoLearn />} />
        <Route path="/go/learn/:id"    element={<GoLearnDetail />} />
        <Route path="/go/quiz"         element={<GoQuiz />} />
        <Route path="/go/quiz/play"    element={<GoQuizPlay />} />
        <Route path="/go/present"      element={<GoPresent />} />
        {/* /go/quiz/:code → GoQuizRoom (coming — needs Apps Script) */}
      </Routes>
    </BrowserRouter>
  )
}