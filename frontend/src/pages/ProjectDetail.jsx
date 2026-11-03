import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  ApartmentOutlined,
  CalendarTodayOutlined,
  CheckCircleOutlined,
  ChatBubbleOutlineOutlined,
  CloseOutlined,
  DeleteOutlined,
  DescriptionOutlined,
  FactoryOutlined,
  GroupsOutlined,
  InfoOutlined,
  PaidOutlined,
  PersonOutlined,
  PlaceOutlined,
  ArrowBackOutlined,
} from '@mui/icons-material'
import { canApplyToJobs, mediaUrl } from '../api/auth'
import { createConversation } from '../api/messages'
import { deleteProject, fetchProject, respondProposal, submitProposal } from '../api/projects'

const STATUS_LABELS = {
  open: 'Bidding',
  in_progress: 'Active',
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_CHIP_COLOR = {
  open: 'warning',
  in_progress: 'info',
  draft: 'default',
  completed: 'success',
  cancelled: 'error',
}

function designation(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Employee'
  return 'Contractor'
}

function posterLabel(role) {
  return role === 'subcontractor' ? 'Subcontractor post' : 'Contractor post'
}

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function PersonAvatar({ user, size = 44 }) {
  const src = mediaUrl(user?.profilePhoto)
  return (
    <Avatar src={src || undefined} sx={{ width: size, height: size }}>
      {initials(user?.fullName)}
    </Avatar>
  )
}

function IconCircle({ icon, size = 40, muted }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '12px',
        bgcolor: muted ? 'action.hover' : 'primary.light',
        color: muted ? 'text.secondary' : 'primary.dark',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  )
}

function SectionHeader({ icon, title, meta }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
      <IconCircle icon={icon} size={36} />
      <Typography variant="h6" sx={{ fontSize: '1.05rem', flex: 1 }}>
        {title}
      </Typography>
      {meta != null ? (
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {meta}
        </Typography>
      ) : null}
    </Stack>
  )
}

function EmptyState({ icon, text }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 4, px: 2 }}>
      <IconCircle icon={icon} size={56} muted />
      <Typography color="text.secondary">{text}</Typography>
    </Stack>
  )
}

function ProposalActions({ status, busy, onAccept, onDecline, onMessage, messageBusyKey, messageLabel, waitingLabel }) {
  if (status === 'pending') {
    if (onAccept) {
      return (
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleOutlined fontSize="small" />}
            disabled={busy}
            onClick={onAccept}
          >
            {busy ? 'Accepting…' : 'Accept'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloseOutlined fontSize="small" />}
            disabled={busy}
            onClick={onDecline}
          >
            Decline
          </Button>
        </Stack>
      )
    }
    return (
      <Typography variant="body2" color="text.secondary">
        {waitingLabel}
      </Typography>
    )
  }

  if (status === 'accepted') {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Chip
          icon={<CheckCircleOutlined />}
          label="Bid accepted — you can now message each other"
          color="success"
          variant="outlined"
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<ChatBubbleOutlineOutlined fontSize="small" />}
          disabled={messageBusyKey}
          onClick={onMessage}
        >
          {messageBusyKey ? 'Opening…' : messageLabel}
        </Button>
      </Stack>
    )
  }

  return (
    <Typography variant="body2" color="text.secondary">
      This proposal was declined.
    </Typography>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [form, setForm] = useState({ amount: '', timeline: '', proposal: '' })
  const [formError, setFormError] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProject(id)
      setProject(data.project)
      setIsOwner(Boolean(data.isOwner))
      setProposals(data.proposals || [])
      setSelected((data.proposals || [])[0] || null)
    } catch (err) {
      setError(err.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onApply(e) {
    e.preventDefault()
    if (!form.amount.trim() || !form.proposal.trim()) {
      setFormError('Bid amount and proposal are required.')
      return
    }
    setBusy('apply')
    setFormError('')
    try {
      const data = await submitProposal(id, {
        amount: form.amount.trim(),
        timeline: form.timeline.trim(),
        proposal: form.proposal.trim(),
      })
      setProposals([data.proposal])
      setSelected(data.proposal)
      setForm({ amount: '', timeline: '', proposal: '' })
    } catch (err) {
      setFormError(err.message || 'Could not submit proposal.')
    } finally {
      setBusy('')
    }
  }

  async function onRespond(proposalId, status) {
    setBusy(proposalId)
    try {
      const data = await respondProposal(id, proposalId, status)
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? data.proposal : p)))
      setSelected((cur) => (cur?.id === proposalId ? data.proposal : cur))
    } catch (err) {
      setError(err.message || 'Could not update proposal.')
    } finally {
      setBusy('')
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete this project? This also removes all proposals on it.')) return
    setBusy('delete')
    try {
      await deleteProject(id)
      navigate('/dashboard/projects')
    } catch (err) {
      setError(err.message || 'Could not delete project.')
      setBusy('')
    }
  }

  async function onMessage(person) {
    if (!person?.id) return
    setBusy(`msg-${person.id}`)
    try {
      await createConversation({
        participantId: person.id,
        projectTitle: project?.title || '',
        projectLocation: project?.location || '',
        projectType: project?.projectType || 'Commercial',
        budget: project?.budget || '',
        initialMessage: `Hi ${person.fullName}, I reviewed your proposal on ${project?.title}.`,
      })
      navigate('/dashboard/messages')
    } catch (err) {
      setError(err.message || 'Could not start a message.')
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography color="text.secondary">Loading project…</Typography>
      </Box>
    )
  }

  if (error && !project) {
    return (
      <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          {error}
        </Typography>
        <Button component={RouterLink} to="/dashboard/projects" size="small">
          Back to projects
        </Button>
      </Box>
    )
  }

  const mine = !isOwner ? proposals[0] : null
  const vacancies = project.vacancies || 1

  return (
    <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      <Button
        component={RouterLink}
        to="/dashboard/projects"
        size="small"
        startIcon={<ArrowBackOutlined fontSize="small" />}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {/* Hero */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', mb: 2.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<ApartmentOutlined />} size={56} />
            <Box>
              <Typography variant="h4" sx={{ fontSize: '1.4rem' }}>
                {project.title}
              </Typography>
              {project.location ? (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', mt: 0.5 }}>
                  <PlaceOutlined sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{project.location}</Typography>
                </Stack>
              ) : null}
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Chip label={STATUS_LABELS[project.status] || project.status} color={STATUS_CHIP_COLOR[project.status] || 'default'} />
            {isOwner ? (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteOutlined fontSize="small" />}
                disabled={busy === 'delete'}
                onClick={onDelete}
              >
                {busy === 'delete' ? 'Deleting…' : 'Delete'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {/* Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'primary.light' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<GroupsOutlined />} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vacancies
              </Typography>
              <Typography variant="h6">
                {vacancies} <Typography component="span" variant="body2" color="text.secondary">{vacancies === 1 ? 'worker needed' : 'workers needed'}</Typography>
              </Typography>
            </Box>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<PaidOutlined />} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Budget
              </Typography>
              <Typography variant="h6">{project.budget || 'Not set'}</Typography>
            </Box>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<CalendarTodayOutlined />} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Due date
              </Typography>
              <Typography variant="h6">{formatDue(project.dueDate)}</Typography>
            </Box>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<DescriptionOutlined />} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Proposals
              </Typography>
              <Typography variant="h6">{isOwner ? proposals.length : project.bidsCount || 0}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Project details */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', mb: 2.5 }}>
        <SectionHeader icon={<InfoOutlined fontSize="small" />} title="Project Details" />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<FactoryOutlined fontSize="small" />} size={36} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Industry
              </Typography>
              <Typography fontWeight={600}>{project.projectType || '—'}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<ApartmentOutlined fontSize="small" />} size={36} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Project type
              </Typography>
              <Typography fontWeight={600}>{project.service || '—'}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <IconCircle icon={<PersonOutlined fontSize="small" />} size={36} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Posted by
              </Typography>
              <Typography fontWeight={600}>{posterLabel(project.postedByRole)}</Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* About */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', mb: 2.5 }}>
        <SectionHeader icon={<DescriptionOutlined fontSize="small" />} title="About this project" />
        <Typography sx={{ mb: project.trades?.length ? 2 : 0 }}>
          {project.description || 'No description was added for this project.'}
        </Typography>
        {project.trades?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {project.trades.map((t) => (
              <Chip key={t} label={t} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : null}
      </Paper>

      {isOwner ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' }, gap: 2.5 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
            <SectionHeader
              icon={<GroupsOutlined fontSize="small" />}
              title="Who applied"
              meta={`${proposals.length} bid${proposals.length === 1 ? '' : 's'}`}
            />
            {proposals.length === 0 ? (
              <EmptyState
                icon={<GroupsOutlined />}
                text="No one has applied yet. Proposals will show here when another CrewUp user bids on this job."
              />
            ) : (
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {proposals.map((p) => (
                  <ListItemButton
                    key={p.id}
                    selected={selected?.id === p.id}
                    onClick={() => setSelected(p)}
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: 'divider',
                      gap: 1.5,
                      '&.Mui-selected': { bgcolor: 'primary.light', borderColor: 'primary.main' },
                      '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                    }}
                  >
                    <PersonAvatar user={p.applicant} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {p.applicant?.company || p.applicant?.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {p.applicant?.fullName}
                        {p.applicant?.contractorType ? ` · ${designation(p.applicant.contractorType)}` : ''}
                      </Typography>
                    </Box>
                    <Typography fontWeight={700}>{p.amount}</Typography>
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
            <SectionHeader icon={<DescriptionOutlined fontSize="small" />} title="Proposal" />
            {!selected ? (
              <EmptyState icon={<DescriptionOutlined />} text="Select an applicant to read their proposal and bid." />
            ) : (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <PersonAvatar user={selected.applicant} />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{selected.applicant?.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {designation(selected.applicant?.contractorType)}
                      {selected.applicant?.company ? ` · ${selected.applicant.company}` : ''}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={selected.status}
                    color={
                      selected.status === 'accepted' ? 'success' : selected.status === 'declined' ? 'error' : 'warning'
                    }
                  />
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bid
                    </Typography>
                    <Typography fontWeight={600}>{selected.amount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Timeline
                    </Typography>
                    <Typography fontWeight={600}>{selected.timeline || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Submitted
                    </Typography>
                    <Typography fontWeight={600}>{formatDue(selected.createdAt)}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    Cover proposal
                  </Typography>
                  <Typography color="text.secondary">{selected.proposal}</Typography>
                </Box>

                <ProposalActions
                  status={selected.status}
                  busy={busy === selected.id}
                  onAccept={() => onRespond(selected.id, 'accepted')}
                  onDecline={() => onRespond(selected.id, 'declined')}
                  onMessage={() => onMessage(selected.applicant)}
                  messageBusyKey={busy === `msg-${selected.applicant?.id}`}
                  messageLabel={`Message ${selected.applicant?.fullName?.split(' ')[0] || 'applicant'}`}
                />
              </Stack>
            )}
          </Paper>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
          <SectionHeader icon={<DescriptionOutlined fontSize="small" />} title="Your proposal" />
          {!canApplyToJobs(user) ? (
            <Typography color="text.secondary">
              General contractors post and hire on this job. Use a Subcontractor or Find Work account to submit a
              proposal.
            </Typography>
          ) : mine ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Your bid
                  </Typography>
                  <Typography fontWeight={600}>{mine.amount}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Timeline
                  </Typography>
                  <Typography fontWeight={600}>{mine.timeline || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography fontWeight={600}>{mine.status}</Typography>
                </Box>
              </Box>
              <Typography color="text.secondary">{mine.proposal}</Typography>

              <ProposalActions
                status={mine.status}
                onMessage={() => onMessage(project.postedBy)}
                messageBusyKey={busy === `msg-${project.postedBy?.id}`}
                messageLabel={`Message ${project.postedBy?.fullName?.split(' ')[0] || 'owner'}`}
                waitingLabel="Waiting on a response — you'll be able to message once this bid is accepted."
              />
            </Stack>
          ) : project.status === 'open' ? (
            <Box component="form" onSubmit={onApply}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Apply as {user.fullName}. The project owner will see your name, bid, and proposal.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <TextField
                  label="Bid amount"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="$8,500"
                  required
                />
                <TextField
                  label="Timeline"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  placeholder="3 weeks"
                />
              </Box>
              <TextField
                label="Proposal"
                multiline
                rows={5}
                value={form.proposal}
                onChange={(e) => setForm((f) => ({ ...f, proposal: e.target.value }))}
                placeholder="Scope, approach, and why you are a fit…"
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              {formError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              ) : null}
              <Button type="submit" variant="contained" size="small" disabled={busy === 'apply'}>
                {busy === 'apply' ? 'Submitting…' : 'Submit proposal'}
              </Button>
            </Box>
          ) : (
            <Typography color="text.secondary">This project is not accepting new proposals.</Typography>
          )}
        </Paper>
      )}
    </Box>
  )
}
