import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { CameraAltOutlined, Close } from '@mui/icons-material'
import { mediaUrl, updateSessionUser } from '../api/auth'
import { fetchSettings, uploadProfilePhoto } from '../api/settings'
import { fetchBilling } from '../api/billing'

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function designationLabel(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Employee'
  return 'Contractor'
}

function planLabel(plan) {
  if (plan === 'pro') return 'Pro'
  if (plan === 'business') return 'Business'
  return 'Starter'
}

function AboutRow({ label, value }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} align="right">
        {value}
      </Typography>
    </Stack>
  )
}

export default function AccountDrawer({ user, open, onClose, onLogout }) {
  const fileRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [billing, setBilling] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')

  const type = profile?.contractorType || user.contractorType
  const photo = mediaUrl(profile?.profilePhoto || user.profilePhoto)
  const plan = billing?.plan || user.plan || 'starter'
  const planName = billing?.planName || planLabel(plan)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setError('')
    Promise.all([fetchSettings(), fetchBilling()])
      .then(([settings, bill]) => {
        if (cancelled) return
        setProfile(settings.profile || null)
        setBilling(bill.billing || null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load account.')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Photo must be under 3MB.')
      return
    }
    setPhotoBusy(true)
    setError('')
    try {
      const data = await uploadProfilePhoto(file)
      setProfile(data.profile)
      updateSessionUser({
        profilePhoto: data.profile.profilePhoto,
        fullName: data.profile.fullName,
      })
    } catch (err) {
      setError(err.message || 'Could not update photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 'min(100%, 380px)', p: 3 } } }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Account
        </Typography>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <IconButton
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              aria-label="Edit profile photo"
              title="Edit profile photo"
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 26,
                height: 26,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <CameraAltOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          }
        >
          <Avatar src={photo || undefined} sx={{ width: 72, height: 72, fontSize: '1.5rem' }}>
            {initials(user.fullName)}
          </Avatar>
        </Badge>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
        <Box>
          <Typography fontWeight={700}>{profile?.fullName || user.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {designationLabel(type)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile?.workEmail || user.workEmail}
          </Typography>
        </Box>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {photoBusy ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Uploading photo…
        </Alert>
      ) : null}

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        About
      </Typography>
      <Divider sx={{ mb: 0.5 }} />
      <AboutRow label="Designation" value={designationLabel(type)} />
      <AboutRow label="Company" value={profile?.company || user.company || '—'} />
      <AboutRow label="Job title" value={profile?.jobTitle || user.jobTitle || '—'} />
      <AboutRow label="Location" value={profile?.location || user.location || '—'} />
      <AboutRow
        label="Member since"
        value={
          profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
            : '—'
        }
      />

      <List sx={{ mt: 2, mb: 1 }}>
        <ListItemButton
          component={RouterLink}
          to="/dashboard/settings/account"
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          <ListItemText primary="Settings" />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/dashboard/billing"
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          <ListItemText primary="Subscription" />
          <Typography variant="body2" color="primary.main" fontWeight={600}>
            {planName}
          </Typography>
        </ListItemButton>
      </List>

      <Button variant="outlined" color="error" onClick={onLogout} sx={{ mt: 'auto' }}>
        Log out
      </Button>
    </Drawer>
  )
}
