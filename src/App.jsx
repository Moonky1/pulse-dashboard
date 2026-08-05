import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom'

import Landing from './pages/Landing'
import Register from './pages/Register'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Pulse GO
import GoLanding from './go/GoLanding'
import GoLearn from './go/GoLearn'
import GoLearnDetail from './go/GoLearnDetail'
import GoQuiz from './go/GoQuiz'
import GoQuizPlay from './go/GoQuizPlay'
import GoQuizRoom from './go/GoQuizRoom'
import GoQuizResults from './go/GoQuizResults'
import Studio from './go/Studio'
import StudioDashboard from './go/StudioDashboard'

const MAINTENANCE_MODE = true

const PUBLIC_PULSE_HOSTS = [
  'pulse-kk.com',
  'www.pulse-kk.com',
]

const PrivateRoute = ({
  children,
}) => {
  const user =
    localStorage.getItem(
      'pulse_user'
    )

  return user
    ? children
    : (
      <Navigate
        to="/signin"
        replace
      />
    )
}

function AcademyDetailRedirect() {
  const {
    id,
  } = useParams()

  return (
    <Navigate
      to={`/academy/${id}`}
      replace
    />
  )
}

function MaintenanceNotice() {
  return (
    <main
      style={{
        minHeight:
          '100vh',

        padding:
          '32px',

        display:
          'grid',

        placeItems:
          'center',

        overflow:
          'hidden',

        color:
          '#ffffff',

        background:
          `
            radial-gradient(
              circle at 20% 20%,
              rgba(76, 173, 208, 0.16),
              transparent 34%
            ),
            radial-gradient(
              circle at 85% 75%,
              rgba(84, 118, 255, 0.12),
              transparent 34%
            ),
            #050b16
          `,
      }}
    >
      <section
        style={{
          width:
            'min(620px, 100%)',

          padding:
            '48px 34px',

          border:
            '1px solid rgba(255, 255, 255, 0.09)',

          borderRadius:
            '26px',

          textAlign:
            'center',

          background:
            'rgba(11, 22, 39, 0.88)',

          boxShadow:
            '0 30px 90px rgba(0, 0, 0, 0.35)',

          backdropFilter:
            'blur(18px)',
        }}
      >
        <div
          style={{
            width:
              '74px',

            height:
              '74px',

            margin:
              '0 auto 24px',

            display:
              'grid',

            placeItems:
              'center',

            border:
              '1px solid rgba(76, 173, 208, 0.25)',

            borderRadius:
              '22px',

            color:
              '#dff6ff',

            background:
              'rgba(76, 173, 208, 0.1)',

            fontSize:
              '32px',
          }}
        >
          ⚙️
        </div>

        <span
          style={{
            display:
              'block',

            marginBottom:
              '13px',

            color:
              '#8edfff',

            fontSize:
              '12px',

            fontWeight:
              '900',

            letterSpacing:
              '2px',

            textTransform:
              'uppercase',
          }}
        >
          Pulse Maintenance
        </span>

        <h1
          style={{
            margin:
              '0',

            fontSize:
              'clamp(34px, 7vw, 58px)',

            fontWeight:
              '950',

            lineHeight:
              '1.02',

            letterSpacing:
              '-2.5px',
          }}
        >
          Pulse is temporarily closed
        </h1>

        <p
          style={{
            maxWidth:
              '480px',

            margin:
              '22px auto 0',

            color:
              'rgba(210, 225, 245, 0.68)',

            fontSize:
              '16px',

            lineHeight:
              '1.7',
          }}
        >
          Pulse is currently unavailable
          while we work on important
          improvements. 
        </p>

        <p
          style={{
            margin:
              '28px 0 0',

            color:
              '#ffffff',

            fontSize:
              '15px',

            fontWeight:
              '800',
          }}
        >
          Thank you for your patience.
        </p>

        <div
          style={{
            width:
              '72px',

            height:
              '3px',

            margin:
              '30px auto 0',

            borderRadius:
              '999px',

            background:
              'linear-gradient(90deg, #4cadd0, #8b9cff)',
          }}
        />
      </section>
    </main>
  )
}

export default function App() {
  const isPublicPulse =
    PUBLIC_PULSE_HOSTS.includes(
      window.location.hostname
    )

  const showMaintenance =
    MAINTENANCE_MODE &&
    isPublicPulse

  if (showMaintenance) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={
              <MaintenanceNotice />
            }
          />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Pulse */}
        <Route
          path="/"
          element={
            <Landing />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />

        <Route
          path="/signin"
          element={
            <SignIn />
          }
        />

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

        <Route
          path="/profile/:ext"
          element={
            <Profile />
          }
        />

        {/* Pulse GO */}
        <Route
          path="/go"
          element={
            <GoLanding />
          }
        />

        <Route
          path="/go/quiz"
          element={
            <GoQuiz />
          }
        />

        <Route
          path="/go/quiz/play"
          element={
            <GoQuizPlay />
          }
        />

        <Route
          path="/go/results/:code"
          element={
            <GoQuizResults />
          }
        />

        <Route
          path="/go/quiz/:code"
          element={
            <GoQuizRoom />
          }
        />

        {/* Pulse Studio */}
        <Route
          path="/studio"
          element={
            <Studio />
          }
        />

        <Route
          path="/studio/dashboard"
          element={
            <StudioDashboard />
          }
        />

        {/* Old unused route */}
        <Route
          path="/go/present"
          element={
            <Navigate
              to="/go"
              replace
            />
          }
        />

        {/* Academy */}
        <Route
          path="/academy"
          element={
            <GoLearn />
          }
        />

        <Route
          path="/academy/:id"
          element={
            <GoLearnDetail />
          }
        />

        {/* Old Academy routes */}
        <Route
          path="/go/academy"
          element={
            <Navigate
              to="/academy"
              replace
            />
          }
        />

        <Route
          path="/go/academy/:id"
          element={
            <AcademyDetailRedirect />
          }
        />

        <Route
          path="/go/learn"
          element={
            <Navigate
              to="/academy"
              replace
            />
          }
        />

        <Route
          path="/go/learn/:id"
          element={
            <AcademyDetailRedirect />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}