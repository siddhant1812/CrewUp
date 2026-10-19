import { Navigate, useOutletContext } from 'react-router-dom'
import { canDo, getSession } from '../api/auth'

export default function RequirePermission({ permission, children, fallback = '/dashboard' }) {
  const ctx = useOutletContext()
  const user = ctx?.user || getSession()?.user
  if (!canDo(permission, user)) {
    return <Navigate to={fallback} replace />
  }
  return children
}
