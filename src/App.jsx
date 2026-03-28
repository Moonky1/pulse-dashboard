import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing  from './pages/Landing'
import Register from './pages/Register'
import SignIn   from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Admin    from './pages/Admin'
import Profile  from './pages/Profile'
import Settings from './pages/Settings'

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('pulse_user')
  return user ? children : <Navigate to="/signin" replace/>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/signin"    element={<SignIn />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin"     element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/profile/:ext" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}