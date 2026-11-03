import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Close, ExpandMore, Menu as MenuIcon, NotificationsNoneOutlined } from '@mui/icons-material'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import AccountDrawer from './AccountDrawer'
import { canHire, clearSession, getSession, mediaUrl } from '../api/auth'

function navLinks(user) {
  return [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Find Work', href: '/jobs' },
    {
      label: canHire(user) ? 'Find Crew' : 'Companies',
      href: '/dashboard/contractors',
    },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Resources', href: '/#resources', dropdown: true },
  ]
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function isRouterLink(href) {
  return href.startsWith('/dashboard') || href === '/jobs'
}

function NavLink({ link, onClick, sx }) {
  const common = {
    underline: 'none',
    color: 'text.primary',
    sx: {
      fontWeight: 600,
      fontSize: '0.92rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.4,
      transition: 'color 0.15s ease',
      '&:hover': { color: 'primary.main' },
      ...sx,
    },
  }
  if (isRouterLink(link.href)) {
    return (
      <Link component={RouterLink} to={link.href} onClick={onClick} {...common}>
        {link.label}
      </Link>
    )
  }
  return (
    <Link href={link.href} onClick={onClick} {...common}>
      {link.label}
      {link.dropdown ? <ExpandMore sx={{ fontSize: 16 }} /> : null}
    </Link>
  )
}

function Avatar40({ user }) {
  const src = mediaUrl(user.profilePhoto)
  return (
    <Avatar src={src || undefined} sx={{ width: 40, height: 40, fontSize: '1rem', fontWeight: 700 }}>
      {initials(user.fullName)}
    </Avatar>
  )
}

function UserMenu({ user, onOpenAccount }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <IconButton aria-label="Notifications" size="small" sx={{ color: 'text.secondary' }}>
        <NotificationsNoneOutlined fontSize="small" />
      </IconButton>

      <Button
        onClick={onOpenAccount}
        aria-haspopup="dialog"
        sx={{ textTransform: 'none', color: 'text.primary', px: 1, gap: 1 }}
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
          <Avatar40 user={user} />
        </Badge>
        <Typography fontWeight={600} fontSize="0.92rem" sx={{ display: { xs: 'none', md: 'block' } }}>
          {user.fullName}
        </Typography>
      </Button>
    </Stack>
  )
}

export default function Header({ menuOpen, setMenuOpen }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function handleLogout() {
    clearSession()
    setSession(null)
    setMenuOpen(false)
    navigate('/login')
  }

  const user = session?.user
  const links = navLinks(user)

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 2, minHeight: 72 }}>
          <Box
            component={RouterLink}
            to="/"
            aria-label="CrewUp home"
            sx={{ display: 'inline-flex', mr: 1, textDecoration: 'none', color: 'inherit' }}
          >
            <Logo markSize={32} />
          </Box>

          <Stack
            component="nav"
            aria-label="Primary"
            direction="row"
            spacing={3}
            sx={{ display: { xs: 'none', lg: 'flex' }, flex: 1 }}
          >
            {links.map((l) => (
              <NavLink key={l.label} link={l} />
            ))}
          </Stack>

          <Box sx={{ flex: { xs: 1, lg: 0 } }} />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}
          >
            <ThemeToggle />
            {user ? (
              <UserMenu user={user} onOpenAccount={() => setAccountOpen(true)} />
            ) : (
              <>
                <Button component={RouterLink} to="/login" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Log In
                </Button>
                <Button component={RouterLink} to="/signup" variant="contained" size="small">
                  Sign Up
                </Button>
              </>
            )}
          </Stack>

          <IconButton
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
          >
            {menuOpen ? <Close /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer anchor="top" open={menuOpen} onClose={() => setMenuOpen(false)} sx={{ display: { lg: 'none' } }}>
        <Stack sx={{ p: 2.5, pt: 9 }} spacing={1.5}>
          {links.map((l) => (
            <NavLink key={l.label} link={l} onClick={() => setMenuOpen(false)} sx={{ py: 1, fontSize: '1rem' }} />
          ))}
          <Divider sx={{ my: 1 }} />
          {user ? (
            <>
              <Button
                onClick={() => {
                  setMenuOpen(false)
                  setAccountOpen(true)
                }}
                sx={{ justifyContent: 'flex-start', textTransform: 'none', gap: 1.5 }}
              >
                <Avatar40 user={user} />
                <Typography fontWeight={600}>{user.fullName}</Typography>
              </Button>
              <Button variant="outlined" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <Stack spacing={1.5}>
              <Button component={RouterLink} to="/login" onClick={() => setMenuOpen(false)} variant="outlined">
                Log In
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                onClick={() => setMenuOpen(false)}
                variant="contained"
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>

      {user ? (
        <AccountDrawer
          user={user}
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          onLogout={handleLogout}
        />
      ) : null}
    </AppBar>
  )
}
