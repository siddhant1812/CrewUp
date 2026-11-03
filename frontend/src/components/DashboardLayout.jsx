import { useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Avatar, Badge, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import { ExpandMore, Menu as MenuIcon, NotificationsNoneOutlined } from '@mui/icons-material'
import Logo from './Logo'
import Sidebar from './Sidebar'
import AccountDrawer from './AccountDrawer'
import ThemeToggle from './ThemeToggle'
import { clearSession, getSession, mediaUrl } from '../api/auth'
import { connectSocket, disconnectSocket } from '../api/socket'

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(() => getSession())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    setAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const sync = () => setSession(getSession())
    const onUnread = (e) => {
      if (typeof e.detail?.count === 'number') setUnread(e.detail.count)
    }
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('crewup-unread', onUnread)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('crewup-unread', onUnread)
    }
  }, [])

  useEffect(() => {
    if (!session?.token) {
      disconnectSocket()
      return undefined
    }

    const socket = connectSocket()
    if (!socket) return undefined

    function onUnreadCount(payload) {
      if (typeof payload?.count === 'number') {
        window.dispatchEvent(new CustomEvent('crewup-unread', { detail: { count: payload.count } }))
      }
    }

    function onIncoming() {
      window.dispatchEvent(new Event('crewup-messages-refresh'))
    }

    socket.on('unread:count', onUnreadCount)
    socket.on('message:new', onIncoming)
    socket.on('conversation:new', onIncoming)

    return () => {
      socket.off('unread:count', onUnreadCount)
      socket.off('message:new', onIncoming)
      socket.off('conversation:new', onIncoming)
    }
  }, [session?.token])

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const user = session.user
  const photo = mediaUrl(user.profilePhoto)

  function handleLogout() {
    disconnectSocket()
    clearSession()
    navigate('/login')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0b1a24' : '#f2f8fd'),
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', zIndex: 50 }}
      >
        <Toolbar sx={{ gap: 1.5, px: { xs: 1.5, sm: 2.5 } }}>
          <IconButton
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={RouterLink}
            to="/"
            aria-label="CrewUp home"
            sx={{ display: 'inline-flex', textDecoration: 'none', color: 'inherit' }}
          >
            <Logo markSize={32} />
          </Box>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <ThemeToggle />
            <IconButton aria-label="Notifications" size="small" sx={{ color: 'text.secondary' }}>
              <Badge variant="dot" color="primary" invisible={unread <= 0}>
                <NotificationsNoneOutlined fontSize="small" />
              </Badge>
            </IconButton>

            <Stack
              direction="row"
              spacing={1}
              onClick={() => setAccountOpen(true)}
              aria-expanded={accountOpen}
              aria-haspopup="dialog"
              role="button"
              tabIndex={0}
              sx={{
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                }
              >
                <Avatar src={photo || undefined} sx={{ width: 40, height: 40, fontWeight: 700 }}>
                  {initials(user.fullName)}
                </Avatar>
              </Badge>
              <Typography fontWeight={600} fontSize="0.92rem" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.fullName}
              </Typography>
              <ExpandMore sx={{ fontSize: 18, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <AccountDrawer user={user} open={accountOpen} onClose={() => setAccountOpen(false)} onLogout={handleLogout} />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Outlet context={{ user }} />
        </Box>
      </Box>
    </Box>
  )
}
