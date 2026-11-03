import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { LogoutOutlined } from '@mui/icons-material'
import { canDo, clearSession, getSession } from '../api/auth'
import { fetchUnreadCount } from '../api/messages'
import Icon from './Icon'

const SIDEBAR_WIDTH = 232

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/dashboard/projects', label: 'My Projects', icon: 'folder', permission: 'manageProjects' },
  { to: '/jobs', label: 'Browse Jobs', icon: 'search', permission: 'browseJobs' },
  { to: '/dashboard/messages', label: 'Messages', icon: 'message', badgeKey: 'messages' },
  { to: '/dashboard/contractors', label: 'Find Crew', icon: 'users', permission: 'hire' },
  { to: '/dashboard/contractors', label: 'Companies', icon: 'users', hideIf: 'hire' },
  { to: '/dashboard/billing', label: 'Billing', icon: 'card' },
  {
    to: '/dashboard/settings/account',
    match: '/dashboard/settings',
    label: 'Settings',
    icon: 'settings',
  },
]

function isLinkActive(item, pathname) {
  if (item.match) return pathname.startsWith(item.match)
  if (item.end) return pathname === item.to
  return pathname.startsWith(item.to)
}

function SidebarContent({ links, unread, pathname, onClose, onLogout }) {
  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f1f2a' : '#f7fbfe'),
        p: 2,
      }}
    >
      <Box>
        <Box sx={{ px: 0.5, pb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: 'primary.main',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: '0.92rem',
              letterSpacing: '0.02em',
            }}
          >
            CU
          </Box>
        </Box>

        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {links.map((item) => {
            const active = isLinkActive(item, pathname)
            const badge = item.badgeKey === 'messages' && unread > 0 ? unread : null
            return (
              <ListItemButton
                key={item.label}
                component={RouterLink}
                to={item.to}
                onClick={onClose}
                selected={active}
                sx={{
                  borderRadius: '12px',
                  color: active ? 'primary.main' : 'text.secondary',
                  fontWeight: active ? 600 : 500,
                  '&.Mui-selected': {
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#214158' : '#e7f4fd'),
                    '&:hover': { bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#214158' : '#e7f4fd') },
                  },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                  <Icon name={item.icon} size={19} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { fontSize: '0.95rem', fontWeight: 'inherit' } }}
                />
                {badge != null ? (
                  <Box
                    sx={{
                      minWidth: 22,
                      height: 22,
                      px: 0.75,
                      borderRadius: 999,
                      bgcolor: active ? 'primary.main' : '#68b9f3',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </Box>
                ) : null}
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      <ListItemButton
        onClick={onLogout}
        sx={{ borderRadius: '12px', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
          <LogoutOutlined sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <Typography fontSize="0.95rem" fontWeight={500}>
          Log Out
        </Typography>
      </ListItemButton>
    </Box>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getSession()?.user
  const [unread, setUnread] = useState(0)
  const links = NAV.filter((item) => {
    if (item.permission && !canDo(item.permission, user)) return false
    if (item.hideIf && canDo(item.hideIf, user)) return false
    return true
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchUnreadCount()
        if (!cancelled) {
          const count = data.count || 0
          setUnread(count)
          window.dispatchEvent(new CustomEvent('crewup-unread', { detail: { count } }))
        }
      } catch {
        if (!cancelled) setUnread(0)
      }
    }

    load()
    const onRefresh = () => load()
    const onUnread = (e) => {
      if (typeof e.detail?.count === 'number') setUnread(e.detail.count)
    }
    window.addEventListener('crewup-messages-refresh', onRefresh)
    window.addEventListener('crewup-unread', onUnread)
    const interval = setInterval(load, 60000)
    return () => {
      cancelled = true
      window.removeEventListener('crewup-messages-refresh', onRefresh)
      window.removeEventListener('crewup-unread', onUnread)
      clearInterval(interval)
    }
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            top: 72,
            height: 'calc(100vh - 72px)',
          },
        }}
        open
      >
        <SidebarContent links={links} unread={unread} pathname={location.pathname} onLogout={handleLogout} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <SidebarContent
          links={links}
          unread={unread}
          pathname={location.pathname}
          onClose={onClose}
          onLogout={handleLogout}
        />
      </Drawer>
    </>
  )
}
