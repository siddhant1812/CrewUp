import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectDetail from './pages/ProjectDetail'
import Messages from './pages/Messages'
import Contractors from './pages/Contractors'
import Billing from './pages/Billing'
import SettingsLayout from './pages/settings/SettingsLayout'
import {
  AccountPanel,
  ActivityPanel,
  BidPreferencesPanel,
  CompanyPanel,
  DocumentsPanel,
  IntegrationsPanel,
  NotificationsPanel,
  PaymentsPanel,
  SecurityPanel,
  SubscriptionPanel,
  UsersPanel,
} from './pages/settings/panels'
import { getSession } from './api/auth'
import RequirePermission from './components/RequirePermission'

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
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
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
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="find-contractors" element={<Navigate to="/dashboard/contractors" replace />} />
          <Route path="contractors" element={<Contractors />} />
          <Route path="messages" element={<Messages />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/dashboard/settings/account" replace />} />
            <Route path="account" element={<AccountPanel />} />
            <Route path="company" element={<CompanyPanel />} />
            <Route path="notifications" element={<NotificationsPanel />} />
            <Route path="bid-preferences" element={<BidPreferencesPanel />} />
            <Route path="payments" element={<PaymentsPanel />} />
            <Route
              path="users"
              element={
                <RequirePermission permission="manageTeam">
                  <UsersPanel />
                </RequirePermission>
              }
            />
            <Route path="security" element={<SecurityPanel />} />
            <Route path="integrations" element={<IntegrationsPanel />} />
            <Route path="documents" element={<DocumentsPanel />} />
            <Route path="subscription" element={<SubscriptionPanel />} />
            <Route path="activity" element={<ActivityPanel />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
