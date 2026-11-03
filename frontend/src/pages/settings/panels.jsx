import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DeleteOutlineOutlined as DeleteOutline } from '@mui/icons-material'
import { mediaUrl, updateSessionUser } from '../../api/auth'
import {
  cancelSubscription,
  fetchBilling,
  fetchPlans,
  openBillingPortal,
  resumeSubscription,
  startCheckout,
} from '../../api/billing'
import PhoneInput, { isValidPhone } from '../../components/PhoneInput'
import CardHead from '../../components/CardHead'
import Icon from '../../components/Icon'
import {
  deleteDocument,
  fetchActivity,
  fetchDocuments,
  fetchSettings,
  fetchTeam,
  inviteTeam,
  patchSettings,
  removeTeam,
  uploadDocument,
} from '../../api/settings'

function PageHead({ title, crumb, lead }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Settings <Box component="span" sx={{ mx: 0.5 }}>›</Box> {crumb}
      </Typography>
      <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">{lead}</Typography>
    </Box>
  )
}

function Field({ label, children }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.6 }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

function FieldGrid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        gap: 2,
        mb: 2,
      }}
    >
      {children}
    </Box>
  )
}

function Panel({ children, component = 'div', onSubmit }) {
  return (
    <Paper
      component={component}
      onSubmit={onSubmit}
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2.5,
      }}
    >
      <Stack spacing={2}>{children}</Stack>
    </Paper>
  )
}

function Loading({ label = 'Loading…' }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary', py: 2 }}>
      <CircularProgress size={16} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  )
}

function Empty({ children }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
      {children}
    </Typography>
  )
}

function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchSettings()
        if (!cancelled) setProfile(data.profile)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { profile, setProfile, loading, error, setError }
}

export function AccountPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    if (!isValidPhone(profile.phoneNumber)) {
      setError('Enter a 10-digit phone number, or leave it blank.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data = await patchSettings('account', {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        jobTitle: profile.jobTitle,
        location: profile.location,
        website: profile.website,
      })
      setProfile(data.profile)
      updateSessionUser({
        fullName: data.profile.fullName,
        profilePhoto: data.profile.profilePhoto,
      })
      setNotice('Account information saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Account Information"
        crumb="Account Information"
        lead="Your personal details as they appear across CrewUp."
      />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {profile && (
        <Panel component="form" onSubmit={onSubmit}>
          <FieldGrid>
            <Field label="Full name">
              <TextField
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Work email">
              <TextField value={profile.workEmail || ''} disabled />
            </Field>
            <Field label="Account type">
              <TextField
                value={
                  profile.contractorType === 'subcontractor'
                    ? 'Subcontractor — apply to jobs'
                    : profile.contractorType === 'find_work'
                      ? 'Find Work — apply to jobs'
                      : profile.accountKind === 'admin'
                        ? 'Admin'
                        : 'General contractor — post and hire'
                }
                disabled
              />
            </Field>
            <Field label="Phone">
              <PhoneInput
                value={profile.phoneNumber || ''}
                onChange={(phoneNumber) => setProfile({ ...profile, phoneNumber })}
              />
            </Field>
            <Field label="Job title">
              <TextField
                value={profile.jobTitle || ''}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <TextField
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="Austin, TX"
              />
            </Field>
            <Field label="Website">
              <TextField
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </Field>
          </FieldGrid>
          <Box>
            <Button type="submit" variant="contained" size="small" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

export function CompanyPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    if (!isValidPhone(profile.companyPhone)) {
      setError('Enter a 10-digit company phone number, or leave it blank.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('company', {
        company: profile.company,
        companyWebsite: profile.companyWebsite,
        companyPhone: profile.companyPhone,
        companyAddress: profile.companyAddress,
        licenseNumber: profile.licenseNumber,
        taxId: profile.taxId,
      })
      setProfile(data.profile)
      updateSessionUser({ company: data.profile.company })
      setNotice('Company information saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Company Information"
        crumb="Company Information"
        lead="Business details used on proposals and your public profile."
      />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {profile && (
        <Panel component="form" onSubmit={onSubmit}>
          <FieldGrid>
            <Field label="Company name">
              <TextField
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </Field>
            <Field label="Company phone">
              <PhoneInput
                value={profile.companyPhone || ''}
                onChange={(companyPhone) => setProfile({ ...profile, companyPhone })}
              />
            </Field>
            <Field label="Company website">
              <TextField
                value={profile.companyWebsite || ''}
                onChange={(e) => setProfile({ ...profile, companyWebsite: e.target.value })}
              />
            </Field>
            <Field label="License number">
              <TextField
                value={profile.licenseNumber || ''}
                onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
              />
            </Field>
            <Field label="Tax ID / EIN">
              <TextField
                value={profile.taxId || ''}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              />
            </Field>
          </FieldGrid>
          <Field label="Address">
            <TextField
              multiline
              rows={3}
              value={profile.companyAddress || ''}
              onChange={(e) => setProfile({ ...profile, companyAddress: e.target.value })}
            />
          </Field>
          <Box>
            <Button type="submit" variant="contained" size="small" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

export function NotificationsPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  function toggle(key) {
    setProfile({
      ...profile,
      emailPreferences: {
        ...profile.emailPreferences,
        [key]: !profile.emailPreferences[key],
      },
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('notifications', {
        emailPreferences: profile.emailPreferences,
      })
      setProfile(data.profile)
      setNotice('Notification preferences saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    ['projectUpdates', 'Project updates'],
    ['newMessages', 'New messages'],
    ['proposalActivity', 'Proposal activity'],
    ['marketingEmails', 'Marketing emails'],
  ]

  return (
    <>
      <PageHead title="Notifications" crumb="Notifications" lead="Choose which emails CrewUp can send you." />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {profile && (
        <Panel component="form" onSubmit={onSubmit}>
          <Stack spacing={0.5}>
            {rows.map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={Boolean(profile.emailPreferences?.[key])}
                    onChange={() => toggle(key)}
                  />
                }
                label={label}
              />
            ))}
          </Stack>
          <Box>
            <Button type="submit" variant="contained" size="small" disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

export function BidPreferencesPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('bid-preferences', profile.bidPreferences)
      setProfile(data.profile)
      setNotice('Bid preferences saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Bid Preferences"
        crumb="Bid Preferences"
        lead="Tell us what work you want to see so matching can use your real settings."
      />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {profile && (
        <Panel component="form" onSubmit={onSubmit}>
          <Field label="Trades (comma separated)">
            <TextField
              value={(profile.bidPreferences?.trades || []).join(', ')}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bidPreferences: {
                    ...profile.bidPreferences,
                    trades: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="Electrical, HVAC, Drywall"
            />
          </Field>
          <FieldGrid>
            <Field label="Service radius (miles)">
              <TextField
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                value={profile.bidPreferences?.serviceRadiusMiles || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bidPreferences: {
                      ...profile.bidPreferences,
                      serviceRadiusMiles: e.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Minimum project budget">
              <TextField
                value={profile.bidPreferences?.minBudget || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bidPreferences: { ...profile.bidPreferences, minBudget: e.target.value },
                  })
                }
                placeholder="$25,000"
              />
            </Field>
          </FieldGrid>
          <Field label="Notes">
            <TextField
              multiline
              rows={3}
              value={profile.bidPreferences?.notes || ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bidPreferences: { ...profile.bidPreferences, notes: e.target.value },
                })
              }
            />
          </Field>
          <Box>
            <Button type="submit" variant="contained" size="small" disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PaymentsPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [billing, setBilling] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetchBilling()
      .then((d) => setBilling(d.billing))
      .catch(() => {})
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('payouts', {
        payoutEmail: profile.payoutEmail,
        payoutMethod: profile.payoutMethod,
      })
      setProfile(data.profile)
      setNotice('Payout details saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const card = billing?.paymentMethod

  return (
    <>
      <PageHead
        title="Payment & Payouts"
        crumb="Payment & Payouts"
        lead="Cards on file come from Stripe. Payout details are stored on your account."
      />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}

      <Panel>
        <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon name="card" size={15} /> Payment method
        </Typography>
        {card ? (
          <Typography>
            <Box component="strong" sx={{ textTransform: 'capitalize' }}>
              {card.brand}
            </Box>{' '}
            ending in {card.last4}
          </Typography>
        ) : (
          <Empty>No card on file. Add one when you subscribe.</Empty>
        )}
      </Panel>

      {profile && (
        <Panel component="form" onSubmit={onSubmit}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon name="coin" size={15} /> Payouts
          </Typography>
          <FieldGrid>
            <Field label="Payout email">
              <TextField
                type="email"
                value={profile.payoutEmail || ''}
                onChange={(e) => setProfile({ ...profile, payoutEmail: e.target.value })}
              />
            </Field>
            <Field label="Method">
              <TextField
                select
                value={profile.payoutMethod || ''}
                onChange={(e) => setProfile({ ...profile, payoutMethod: e.target.value })}
              >
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="bank">Bank transfer</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="stripe">Stripe</MenuItem>
              </TextField>
            </Field>
          </FieldGrid>
          <Box>
            <Button type="submit" variant="contained" size="small" disabled={saving}>
              {saving ? 'Saving…' : 'Save payouts'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

export function UsersPanel() {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchTeam()
      setMembers(data.members || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onInvite(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await inviteTeam({ email, role })
      setEmail('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Users & Permissions"
        crumb="Users & Permissions"
        lead="Invite people from your company. They appear here when you add their email."
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Panel component="form" onSubmit={onInvite}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ flex: 2 }}
          />
          <TextField select value={role} onChange={(e) => setRole(e.target.value)} sx={{ flex: 1, minWidth: 140 }}>
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" size="small" disabled={saving} sx={{ flexShrink: 0 }}>
            {saving ? 'Inviting…' : 'Invite'}
          </Button>
        </Stack>
      </Panel>
      <Panel>
        {loading ? <Loading /> : null}
        {!loading && members.length === 0 ? (
          <Empty>No teammates yet. Invite someone above.</Empty>
        ) : (
          <List disablePadding>
            {members.map((m, i) => (
              <Box key={m.id}>
                {i > 0 ? <Divider /> : null}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutline fontSize="small" />}
                      onClick={() => removeTeam(m.id).then(load)}
                    >
                      Remove
                    </Button>
                  }
                >
                  <ListItemText
                    primary={m.name || m.email}
                    secondary={`${m.email} · ${m.role} · ${m.status}`}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Panel>
    </>
  )
}

export function SecurityPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onPassword(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await patchSettings('password', form)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setNotice('Password updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function onToggle2fa() {
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('two-factor', { enabled: !profile.twoFactorEnabled })
      setProfile(data.profile)
      setNotice(data.profile.twoFactorEnabled ? 'Two-factor flag enabled on your account.' : 'Two-factor disabled.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Security"
        crumb="Security"
        lead="Change your password and manage two-factor authentication."
      />
      {loading ? <Loading /> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      <Panel component="form" onSubmit={onPassword}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon name="settings" size={15} /> Password
        </Typography>
        <Field label="Current password">
          <TextField
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />
        </Field>
        <FieldGrid>
          <Field label="New password">
            <TextField
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="Confirm new password">
            <TextField
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </Field>
        </FieldGrid>
        <Box>
          <Button type="submit" variant="contained" size="small" disabled={saving}>
            Update password
          </Button>
        </Box>
      </Panel>
      {profile && (
        <Panel>
          <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon name="info" size={15} /> Two-factor authentication
          </Typography>
          <Typography color="text.secondary">
            {profile.twoFactorEnabled ? 'Enabled on this account.' : 'Not enabled.'}
          </Typography>
          <Box>
            <Button variant="outlined" size="small" onClick={onToggle2fa} disabled={saving}>
              {profile.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </Box>
        </Panel>
      )}
    </>
  )
}

export function IntegrationsPanel() {
  return (
    <>
      <PageHead
        title="Integrations"
        crumb="Integrations"
        lead="Connect accounting or calendar tools when those providers are wired."
      />
      <Panel>
        <Empty>No integrations connected yet. OAuth providers have not been configured for this account.</Empty>
      </Panel>
    </>
  )
}

export function DocumentsPanel() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchDocuments()
      setDocs(data.documents || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadDocument(file)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <PageHead
        title="Documents"
        crumb="Documents"
        lead="Insurance, licenses, and other files stored on your account."
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Panel>
        <Box>
          <Button component="label" variant="outlined" size="small" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload file'}
            <input type="file" hidden disabled={uploading} onChange={onFile} />
          </Button>
        </Box>
        {loading ? <Loading /> : null}
        {!loading && docs.length === 0 ? (
          <Empty>No documents uploaded yet.</Empty>
        ) : (
          <List disablePadding>
            {docs.map((d, i) => (
              <Box key={d.id}>
                {i > 0 ? <Divider /> : null}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <IconButton
                      aria-label="Delete"
                      size="small"
                      onClick={() => deleteDocument(d.id).then(load)}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        component="a"
                        href={mediaUrl(d.url)}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {d.name}
                      </Box>
                    }
                    secondary={`${d.sizeLabel} · ${formatDate(d.createdAt)}`}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Panel>
    </>
  )
}

function statusLabel(status) {
  const map = {
    none: 'Free',
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
  }
  return map[status] || status || 'Free'
}

function PlanCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="rgba(0,102,255,0.1)" stroke="#0066FF" strokeWidth="1.2" />
      <path
        d="M5.5 9.2l2.2 2.2 4.8-4.8"
        stroke="#0066FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SubscriptionPanel({ standalone = false }) {
  const [params, setParams] = useSearchParams()
  const [billing, setBilling] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [me, catalog] = await Promise.all([fetchBilling(), fetchPlans()])
      setBilling(me.billing)
      setPlans(catalog.plans || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const flag = params.get('billing')
    if (flag === 'success') {
      setNotice('Payment method saved and subscription updated.')
      params.delete('billing')
      setParams(params, { replace: true })
      load()
    } else if (flag === 'cancel') {
      setNotice('Checkout was canceled. Your plan was not changed.')
      params.delete('billing')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  async function checkout(planId) {
    setBusy(planId)
    setError('')
    try {
      const data = await startCheckout(planId)
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.billing) setBilling(data.billing)
      if (data.message) setNotice(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const card = billing?.paymentMethod
  const paid = billing && billing.plan !== 'starter' && billing.subscriptionStatus === 'active'

  return (
    <>
      {standalone ? (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
            Billing
          </Typography>
          <Typography color="text.secondary">Your CrewUp plan, payment method, and billing cycle.</Typography>
        </Box>
      ) : (
        <PageHead title="Subscription" crumb="Subscription" lead="Your CrewUp plan and billing cycle." />
      )}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {loading ? <Loading label="Loading billing…" /> : null}
      {billing && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <CardHead icon="fileText" title="Current plan" />
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography fontWeight={700}>{billing.planName}</Typography>
                    <Chip size="small" label={statusLabel(billing.subscriptionStatus)} />
                  </Stack>
                  <Typography color="text.secondary">
                    {billing.priceLabel}
                    {billing.period}
                  </Typography>
                  {billing.currentPeriodEnd ? (
                    <Typography variant="body2" color="text.secondary">
                      {billing.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {formatDate(billing.currentPeriodEnd)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Free Starter plan.
                    </Typography>
                  )}
                  {!billing.stripeReady ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Stripe keys are not set yet. Paid checkout stays disabled until you add them to
                      backend/.env.
                    </Alert>
                  ) : null}
                  <Box sx={{ pt: 1 }}>
                    {paid && !billing.cancelAtPeriodEnd ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const data = await cancelSubscription()
                          setBilling(data.billing)
                        }}
                      >
                        Cancel subscription
                      </Button>
                    ) : null}
                    {billing.cancelAtPeriodEnd ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={async () => {
                          const data = await resumeSubscription()
                          setBilling(data.billing)
                        }}
                      >
                        Keep my plan
                      </Button>
                    ) : null}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <CardHead icon="card" title="Payment method" />
                <Box sx={{ mt: 1.5 }}>
                  {card ? (
                    <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <Typography>
                        <Box component="strong">{card.brand}</Box> ending in {card.last4}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const data = await openBillingPortal()
                          if (data.url) window.location.href = data.url
                        }}
                      >
                        Update card
                      </Button>
                    </Stack>
                  ) : (
                    <Empty>No card on file.</Empty>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${plans.length || 1}, 1fr)` },
              gap: 2,
              pt: 1.5,
            }}
          >
            {plans.map((plan) => {
              const current = billing.plan === plan.id
              const disabled = current || !!busy || (plan.id !== 'starter' && !billing.stripeReady)
              let cta = `Start ${plan.name} Plan`
              if (current && plan.id === 'starter') cta = 'Current / Starter'
              else if (current) cta = `Current / ${plan.name}`
              else if (busy === plan.id) cta = 'Redirecting…'
              else if (plan.id === 'starter') cta = 'Switch to Starter'

              return (
                <Card
                  key={plan.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'visible',
                    borderColor: plan.popular ? 'primary.main' : 'divider',
                    borderWidth: plan.popular ? 2 : 1,
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{ position: 'absolute', top: -12, left: 16, zIndex: 1, fontWeight: 600 }}
                    />
                  )}
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: plan.popular ? 3 : 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {plan.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', my: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {plan.priceLabel}
                      </Typography>
                      {plan.period && (
                        <Typography variant="body2" color="text.secondary">
                          {plan.period}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.blurb}
                    </Typography>
                    <List disablePadding sx={{ mb: 2, flex: 1 }}>
                      {(plan.features || []).map((f) => (
                        <ListItem key={f} disableGutters sx={{ py: 0.4 }}>
                          <PlanCheck />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {f}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant={plan.popular && !current ? 'contained' : 'outlined'}
                      size="large"
                      fullWidth
                      disabled={disabled}
                      onClick={() => checkout(plan.id)}
                    >
                      {cta}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </>
      )}
    </>
  )
}

export function ActivityPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchActivity()
        if (!cancelled) setItems(data.activity || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHead title="Activity Log" crumb="Activity Log" lead="Review important account activity and changes." />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Panel>
        {loading ? <Loading label="Loading activity…" /> : null}
        {!loading && items.length === 0 ? (
          <Empty>
            No account activity yet. Sign-ins, profile edits, uploads, and billing changes will show up here.
          </Empty>
        ) : (
          <List disablePadding>
            {items.map((a, i) => (
              <Box key={a.id}>
                {i > 0 ? <Divider /> : null}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Typography
                      component="time"
                      dateTime={a.createdAt}
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {formatWhen(a.createdAt)}
                    </Typography>
                  }
                >
                  <ListItemText primary={a.title} secondary={a.detail || null} sx={{ pr: 10 }} />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Panel>
    </>
  )
}
