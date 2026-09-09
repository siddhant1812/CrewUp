import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import { getSession } from './api/auth'

function RequireGuest({ children }) {
  const session = getSession()
  if (session?.user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest>
              <SignUp />
            </RequireGuest>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage section="dashboard" />} />
          <Route path="projects" element={<DashboardPage section="projects" />} />
          <Route path="find-contractors" element={<DashboardPage section="find-contractors" />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<DashboardPage section="profile" />} />
          <Route path="reviews" element={<DashboardPage section="reviews" />} />
          <Route path="saved" element={<DashboardPage section="saved" />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
