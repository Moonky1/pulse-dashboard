import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing   from './pages/landing'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/register"  element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App