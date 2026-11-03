import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Avatar as MuiAvatar,
  Box,
  Button,
  Card,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { canHire, getSession, mediaUrl } from '../api/auth'
import { createConversation } from '../api/messages'
import { fetchProjects } from '../api/projects'
import {
  fetchContractors,
  fetchInvites,
  fetchSavedContractors,
  respondInvite,
  sendInvite,
  toggleSavedContractor,
} from '../api/contractors'
import CardHead from '../components/CardHead'

function typeLabel(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Find Work'
  return 'Contractor'
}

function Avatar({ user }) {
  const src = mediaUrl(user?.profilePhoto)
  const initials = (user?.fullName || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
  return (
    <MuiAvatar src={src || undefined} sx={{ width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700 }}>
      {initials}
    </MuiAvatar>
  )
}

export default function Contractors() {
  const navigate = useNavigate()
  const canInvite = canHire(getSession()?.user)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [list, setList] = useState([])
  const [mode, setMode] = useState('saved')
  const [projects, setProjects] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteFor, setInviteFor] = useState(null)
  const [projectId, setProjectId] = useState('')
  const [busy, setBusy] = useState('')

  async function loadSaved() {
    setLoading(true)
    setError('')
    setMode('saved')
    try {
      const data = await fetchSavedContractors()
      setList(data.contractors || [])
    } catch (err) {
      setError(err.message || 'Failed to load saved contractors.')
    } finally {
      setLoading(false)
    }
  }

  async function loadList() {
    const q = query.trim()
    if (q.length < 2) {
      await loadSaved()
      return
    }
    setLoading(true)
    setError('')
    setMode('search')
    try {
      const data = await fetchContractors({ q, type })
      setList(data.contractors || [])
    } catch (err) {
      setError(err.message || 'Failed to load contractors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSaved()
  }, [])

  useEffect(() => {
    if (canInvite) {
      fetchProjects()
        .then((d) => setProjects(d.projects || []))
        .catch(() => setProjects([]))
    }
    fetchInvites('received')
      .then((d) => setInvites((d.invites || []).filter((i) => i.status === 'pending')))
      .catch(() => setInvites([]))
  }, [])

  async function onSearch(e) {
    e.preventDefault()
    await loadList()
  }

  async function onSave(id) {
    setBusy(id)
    try {
      const data = await toggleSavedContractor(id)
      setList((prev) => prev.map((c) => (c.id === id ? { ...c, saved: data.saved } : c)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function onMessage(person) {
    setBusy(person.id)
    try {
      const data = await createConversation({
        participantId: person.id,
        projectTitle: '',
        initialMessage: `Hi ${person.fullName}, I'd like to connect on CrewUp.`,
      })
      navigate('/dashboard/messages')
      return data
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function onInvite(e) {
    e.preventDefault()
    if (!inviteFor || !projectId) return
    setBusy('invite')
    try {
      await sendInvite({ contractorId: inviteFor.id, projectId })
      setInviteFor(null)
      setProjectId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
          Contractors
        </Typography>
        <Typography color="text.secondary">
          Search CrewUp users to save, message, or invite onto a project.
        </Typography>
      </Box>

      {invites.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardHead icon="message" title="Project invites for you" />
          <Stack sx={{ px: 2, pb: 2 }} spacing={1.5}>
            {invites.map((inv) => (
              <Stack
                key={inv.id}
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
              >
                <Box>
                  <Typography fontWeight={700}>{inv.project?.title || 'Project'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    From {inv.from?.fullName}
                    {inv.project?.location ? ` · ${inv.project.location}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      respondInvite(inv.id, 'accepted').then(() =>
                        setInvites((prev) => prev.filter((i) => i.id !== inv.id))
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      respondInvite(inv.id, 'declined').then(() =>
                        setInvites((prev) => prev.filter((i) => i.id !== inv.id))
                      )
                    }
                  >
                    Decline
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      <Stack
        component="form"
        onSubmit={onSearch}
        direction="row"
        spacing={1.5}
        sx={{ flexWrap: 'wrap', mb: 2 }}
      >
        <TextField
          type="search"
          placeholder="Search name, company, or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          size="small"
        />
        <TextField
          select
          label="Account type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All types</MenuItem>
          <MenuItem value="general_contractor">Contractors</MenuItem>
          <MenuItem value="subcontractor">Subcontractors</MenuItem>
          <MenuItem value="find_work">Find work</MenuItem>
        </TextField>
        <Button type="submit" variant="contained">
          Search
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card variant="outlined">
        {loading ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Loading contractors…
          </Typography>
        ) : null}
        {!loading && list.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {mode === 'search'
              ? 'No matching contractors.'
              : 'No saved contractors yet. Search by name or company to find CrewUp users.'}
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {list.map((c) => (
              <Stack
                key={c.id}
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, p: 2 }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar user={c} />
                  <Box>
                    <Typography fontWeight={700}>{c.company || c.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.fullName} · {typeLabel(c.contractorType)}
                      {c.location ? ` · ${c.location}` : ''}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="outlined" size="small" disabled={busy === c.id} onClick={() => onSave(c.id)}>
                    {c.saved ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outlined" size="small" disabled={busy === c.id} onClick={() => onMessage(c)}>
                    Message
                  </Button>
                  {canInvite && projects.length > 0 && (
                    <Button variant="contained" size="small" onClick={() => setInviteFor(c)}>
                      Invite
                    </Button>
                  )}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {inviteFor && (
        <Paper
          component="form"
          onSubmit={onInvite}
          variant="outlined"
          sx={{ p: 2.5, mt: 2, borderRadius: 3 }}
        >
          <Typography variant="h6" sx={{ fontSize: '1.05rem', mb: 1.5 }}>
            Invite {inviteFor.fullName} to a project
          </Typography>
          <TextField
            select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            size="small"
            sx={{ mb: 2, minWidth: 260 }}
          >
            <MenuItem value="">Select a project</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.title}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" size="small" disabled={busy === 'invite'}>
              Send invite
            </Button>
            <Button type="button" variant="outlined" size="small" onClick={() => setInviteFor(null)}>
              Cancel
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
