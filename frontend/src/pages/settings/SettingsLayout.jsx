import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material'
import { canDo } from '../../api/auth'

const ITEMS = [
  { to: '/dashboard/settings/account', label: 'Account Information', icon: 'user' },
  { to: '/dashboard/settings/company', label: 'Company Information', icon: 'building' },
  { to: '/dashboard/settings/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/dashboard/settings/bid-preferences', label: 'Bid Preferences', icon: 'target' },
  { to: '/dashboard/settings/payments', label: 'Payment & Payouts', icon: 'card' },
  { to: '/dashboard/settings/users', label: 'Users & Permissions', icon: 'users' },
  { to: '/dashboard/settings/security', label: 'Security', icon: 'lock' },
  { to: '/dashboard/settings/integrations', label: 'Integrations', icon: 'grid' },
  { to: '/dashboard/settings/documents', label: 'Documents', icon: 'file' },
  { to: '/dashboard/settings/subscription', label: 'Subscription', icon: 'spark' },
  { to: '/dashboard/settings/activity', label: 'Activity Log', icon: 'clock' },
]

function Icon({ name }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  }
  const stroke = { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.2" {...stroke} />
          <path d="M5.5 19c0-3 2.9-5.4 6.5-5.4s6.5 2.4 6.5 5.4" {...stroke} />
        </svg>
      )
    case 'building':
      return (
        <svg {...props}>
          <path d="M4 20V7l8-4 8 4v13" {...stroke} />
          <path d="M9 20v-6h6v6" {...stroke} />
        </svg>
      )
    case 'bell':
      return (
        <svg {...props}>
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" {...stroke} />
          <path d="M10 19a2 2 0 0 0 4 0" {...stroke} />
        </svg>
      )
    case 'target':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <circle cx="12" cy="12" r="3" {...stroke} />
        </svg>
      )
    case 'card':
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
          <path d="M3 10h18" {...stroke} />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="2.6" {...stroke} />
          <path d="M4 18c0-2.4 2.2-4.2 5-4.2" {...stroke} />
          <circle cx="16" cy="8.5" r="2.2" {...stroke} />
          <path d="M14 18c.3-2 2-3.6 4.4-3.8" {...stroke} />
        </svg>
      )
    case 'lock':
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="9" rx="2" {...stroke} />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
        </svg>
      )
    case 'grid':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" {...stroke} />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" {...stroke} />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" {...stroke} />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" {...stroke} />
        </svg>
      )
    case 'file':
      return (
        <svg {...props}>
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...stroke} />
          <path d="M14 3v6h6" {...stroke} />
        </svg>
      )
    case 'spark':
      return (
        <svg {...props}>
          <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" {...stroke} />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 8v4l2.5 1.5" {...stroke} />
        </svg>
      )
  }
}

export default function SettingsLayout() {
  const location = useLocation()
  const items = ITEMS.filter((item) => item.to !== '/dashboard/settings/users' || canDo('manageTeam'))

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ alignItems: 'flex-start', gap: { xs: 2, md: 3 }, p: { xs: 2, sm: 3 } }}
    >
      <Box
        component="aside"
        aria-label="Settings"
        sx={{
          width: { xs: '100%', md: 240 },
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: 1,
          position: { md: 'sticky' },
          top: { md: 88 },
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {items.map((item) => {
            const active = location.pathname === item.to
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={active}
                sx={{
                  borderRadius: 2,
                  color: active ? 'primary.main' : 'text.secondary',
                  fontWeight: active ? 600 : 500,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.light' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                  <Icon name={item.icon} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { fontSize: '0.9rem', fontWeight: 'inherit' } }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Outlet />
      </Box>
    </Stack>
  )
}
