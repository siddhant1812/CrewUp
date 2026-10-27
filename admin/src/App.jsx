import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Projects from './pages/Projects'
import Proposals from './pages/Proposals'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/proposals" element={<Proposals />} />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
