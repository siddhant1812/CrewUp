import { Link as RouterLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { LogoutOutlined } from '@mui/icons-material'
import { currentUser, isAdmin, logout } from '../api/auth'
import Icon from './Icon'

const SIDEBAR_WIDTH = 220

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/proposals', label: 'Proposals', icon: 'fileText' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = currentUser()

  // Backend already rejects every /api/admin/* call for a non-admin
  // (requireAdmin), but this stops a non-admin from even seeing the shell.
  if (!user || !isAdmin()) {
    return <Navigate to="/login" replace />
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2,
          },
        }}
        open
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 0.5, pb: 2.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: 'secondary.main',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="shield" size={18} />
            </Box>
            <Box>
              <Typography fontFamily="'Sora', 'Plus Jakarta Sans', system-ui, sans-serif" color="secondary.main" fontSize="0.95rem" fontWeight={700}>
                CrewUp
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Admin
              </Typography>
            </Box>
          </Box>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, flex: 1 }}>
            {NAV.map((item) => {
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
              return (
                <ListItemButton
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  selected={active}
                  sx={{
                    borderRadius: '10px',
                    color: active ? 'primary.dark' : 'text.secondary',
                    fontWeight: active ? 700 : 500,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      '&:hover': { bgcolor: 'primary.light' },
                    },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                    <Icon name={item.icon} size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontSize: '0.92rem', fontWeight: 'inherit' } }}
                  />
                </ListItemButton>
              )
            })}
          </List>

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '10px',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'error.light', color: 'error.main' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <LogoutOutlined sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <Typography fontSize="0.92rem" fontWeight={500}>
              Log out
            </Typography>
          </ListItemButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2.5, sm: '1.75rem 2rem 3rem' } }}>
        <Outlet context={{ user }} />
      </Box>
    </Box>
  )
}
