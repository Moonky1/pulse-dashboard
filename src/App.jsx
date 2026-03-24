import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing   from './pages/Landing'
import Register  from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin     from './pages/Admin'

function App() { 
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/register"  element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/admin"     element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App