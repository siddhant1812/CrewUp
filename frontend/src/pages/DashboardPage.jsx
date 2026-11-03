import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  DeleteOutlined,
  FolderOutlined,
  SearchOutlined,
} from '@mui/icons-material'
import { accountKindOf, canPostProjects, mediaUrl } from '../api/auth'
import { categoriesFor } from '../data/categories'
import {
  createProject,
  deleteProject,
  fetchDashboard,
  fetchOpenProjects,
  fetchProjects,
  updateProject,
} from '../api/projects'

const TITLES = {
  dashboard: {
    title: 'Dashboard',
    lead: 'Overview of your projects, messages, and crew activity.',
  },
  projects: {
    title: 'Projects',
    lead: 'Track jobs you posted, or browse open work to bid on.',
  },
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Bidding' },
  { value: 'in_progress', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_CHIP_COLOR = {
  open: 'warning',
  in_progress: 'info',
  draft: 'default',
  completed: 'success',
  cancelled: 'error',
}

function statusMeta(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || { value: status, label: status || 'Open' }
}

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function SectionHeader({ icon, title, meta, children }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: 'primary.light',
          color: 'primary.dark',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontSize: '1.05rem', flex: 1 }}>
        {title}
      </Typography>
      {meta != null ? (
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {meta}
        </Typography>
      ) : null}
      {children}
    </Stack>
  )
}

function ProjectThumb({ project }) {
  const src = mediaUrl(project.image)
  return (
    <Avatar
      variant="rounded"
      src={src || undefined}
      sx={{ width: 48, height: 36, bgcolor: 'action.hover' }}
    >
      {' '}
    </Avatar>
  )
}

function StatusChip({ status }) {
  const meta = statusMeta(status)
  return <Chip size="small" label={meta.label} color={STATUS_CHIP_COLOR[meta.value] || 'default'} />
}

function ProjectsTable({ projects, emptyLabel, onDelete, onStatus }) {
  const navigate = useNavigate()

  if (!projects.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 3 }}>
        {emptyLabel}
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Status</TableCell>
            {onDelete ? <TableCell /> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => (
            <TableRow
              key={p.id}
              hover
              onClick={() => navigate(`/dashboard/projects/${p.id}`)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <ProjectThumb project={p} />
                  <Typography variant="body2" fontWeight={600}>
                    {p.title}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{p.location || '—'}</TableCell>
              <TableCell>{formatDue(p.dueDate)}</TableCell>
              <TableCell>
                {onStatus ? (
                  <Select
                    size="small"
                    value={p.status || 'open'}
                    onChange={(e) => onStatus(p.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Status for ${p.title}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <StatusChip status={p.status} />
                )}
              </TableCell>
              {onDelete ? (
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete project"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(p.id)
                    }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function DashboardHome({ user }) {
  const firstName = user.fullName.split(' ')[0]
  const kind = accountKindOf(user)
  const isWorker = kind === 'worker'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    activeProjects: 0,
    openJobs: 0,
    myBids: 0,
    messages: 0,
    savedContractors: 0,
    projectInvites: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchDashboard()
        if (cancelled) return
        setStats({
          activeProjects: data.stats?.activeProjects || 0,
          openJobs: data.stats?.openJobs || 0,
          myBids: data.stats?.myBids || 0,
          messages: data.stats?.messages || 0,
          savedContractors: data.stats?.savedContractors || 0,
          projectInvites: data.stats?.projectInvites || 0,
        })
        setRecentProjects(data.recentProjects || [])
        setRecommendedJobs(data.recommendedJobs || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = isWorker
    ? [
        { value: stats.openJobs, label: 'Open Jobs' },
        { value: stats.myBids, label: 'Your Bids' },
        { value: stats.messages, label: 'Messages' },
        { value: stats.projectInvites, label: 'Invites' },
      ]
    : [
        { value: stats.activeProjects, label: 'Active Projects' },
        { value: stats.messages, label: 'Messages' },
        { value: stats.savedContractors, label: 'Saved Crew' },
        { value: stats.projectInvites, label: 'Invites Sent' },
      ]

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
            Welcome back, {firstName}!
          </Typography>
          <Typography color="text.secondary">
            {isWorker
              ? 'Find open work, submit proposals, and keep up with messages.'
              : 'Post jobs, review bids, and hire crew from one place.'}
          </Typography>
        </Box>
        {isWorker ? (
          <Button component={RouterLink} to="/jobs" variant="contained" size="small">
            Browse jobs
          </Button>
        ) : (
          <Button component={RouterLink} to="/dashboard/projects" variant="contained" size="small">
            Post a project
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        {statCards.map((s) => (
          <Paper key={s.label} variant="outlined" sx={{ p: 2.5, borderRadius: '14px' }}>
            <Typography variant="h4" sx={{ fontSize: '1.9rem', mb: 0.5 }}>
              {loading ? '—' : s.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
        <SectionHeader
          icon={isWorker ? <SearchOutlined fontSize="small" /> : <FolderOutlined fontSize="small" />}
          title={isWorker ? 'Jobs for you' : 'Recent Projects'}
        >
          <Button component={RouterLink} to={isWorker ? '/jobs' : '/dashboard/projects'} size="small">
            View all
          </Button>
        </SectionHeader>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Loading…
          </Typography>
        ) : (
          <ProjectsTable
            projects={isWorker ? recommendedJobs : recentProjects}
            emptyLabel={
              isWorker
                ? 'No open jobs yet. Check Browse Jobs as contractors post work.'
                : 'No projects yet.'
            }
          />
        )}
      </Paper>
    </>
  )
}

function ProjectsSection({ user }) {
  const [projects, setProjects] = useState([])
  const [openJobs, setOpenJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    location: '',
    dueDate: '',
    projectType: '',
    service: '',
    budget: '',
    vacancies: 1,
    description: '',
    trades: '',
    status: 'open',
    image: null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects()
      setProjects(data.projects || [])
      try {
        const open = await fetchOpenProjects()
        setOpenJobs(open.projects || [])
      } catch {
        setOpenJobs([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError('Project title is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await createProject({
        title: form.title.trim(),
        location: form.location.trim(),
        dueDate: form.dueDate || undefined,
        projectType: form.projectType,
        service: form.service || undefined,
        budget: form.budget.trim(),
        vacancies: Number(form.vacancies) || 1,
        description: form.description.trim(),
        trades: form.trades
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        image: form.image || undefined,
        status: form.status,
      })
      setForm({
        title: '',
        location: '',
        dueDate: '',
        projectType: '',
        service: '',
        budget: '',
        vacancies: 1,
        description: '',
        trades: '',
        status: 'open',
        image: null,
      })
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'Could not create project.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this project?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete project.')
    }
  }

  async function handleStatus(id, status) {
    const previous = projects
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const data = await updateProject(id, { status })
      if (data.project) {
        setProjects((prev) => prev.map((p) => (p.id === id ? data.project : p)))
      }
    } catch (err) {
      setProjects(previous)
      setError(err.message || 'Could not update status.')
    }
  }

  const canPost = canPostProjects(user)
  const isContractor = user.contractorType === 'general_contractor'
  const categories = categoriesFor(user.contractorType)

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1.5 }}
      >
        <Typography color="text.secondary">
          {canPost
            ? 'Projects you create appear on your dashboard under Recent Projects.'
            : 'Browse open jobs below and apply from the job page. Only contractors and subcontractors can post projects.'}
        </Typography>
        {canPost ? (
          <Button variant="contained" size="small" onClick={() => setShowForm((v) => !v)} sx={{ flexShrink: 0 }}>
            {showForm ? 'Cancel' : 'New project'}
          </Button>
        ) : (
          <Button component={RouterLink} to="/jobs" variant="contained" size="small" sx={{ flexShrink: 0 }}>
            Browse jobs
          </Button>
        )}
      </Stack>

      {canPost && showForm ? (
        <Paper
          component="form"
          onSubmit={handleCreate}
          variant="outlined"
          sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Project title"
              required
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Denver, CO"
            />
            <TextField
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Budget"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              placeholder="$250,000 – $500,000"
            />
            <TextField
              label="Vacancies (workers needed)"
              type="number"
              slotProps={{ htmlInput: { min: 1 } }}
              value={form.vacancies}
              onChange={(e) => setForm((f) => ({ ...f, vacancies: e.target.value }))}
            />
            <TextField
              select
              label={isContractor ? 'Project type' : 'Trade category'}
              value={form.projectType}
              onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value, service: '' }))}
              required
            >
              <MenuItem value="">{isContractor ? 'Select project type' : 'Select trade category'}</MenuItem>
              {Object.keys(categories).map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={isContractor ? 'Project' : 'Service'}
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              disabled={!form.projectType}
            >
              <MenuItem value="">Any / not specific</MenuItem>
              {(categories[form.projectType] || []).map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              component="label"
              variant="outlined"
              sx={{ justifyContent: 'flex-start', alignSelf: 'center' }}
            >
              {form.image ? form.image.name : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
              />
            </Button>
          </Box>
          <TextField
            label="Trades needed"
            value={form.trades}
            onChange={(e) => setForm((f) => ({ ...f, trades: e.target.value }))}
            placeholder="Electrical, Plumbing, HVAC"
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Scope, trades needed, notes…"
            fullWidth
            sx={{ mb: 2 }}
          />
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}
          <Button type="submit" variant="contained" size="small" disabled={saving}>
            {saving ? 'Creating…' : 'Create project'}
          </Button>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
        <SectionHeader icon={<FolderOutlined fontSize="small" />} title="Your projects" meta={`${projects.length} total`} />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            Loading projects…
          </Typography>
        ) : (
          <ProjectsTable
            projects={projects}
            emptyLabel={
              canPost
                ? `No projects yet for ${user.fullName}. Create your first project above.`
                : 'You have not posted projects. This list is for jobs you create as a general contractor.'
            }
            onDelete={canPost ? handleDelete : undefined}
            onStatus={canPost ? handleStatus : undefined}
          />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px' }}>
        <SectionHeader icon={<SearchOutlined fontSize="small" />} title="Open jobs to bid on">
          <Button component={RouterLink} to="/jobs" size="small">
            Browse all
          </Button>
        </SectionHeader>
        <ProjectsTable
          projects={openJobs}
          emptyLabel="No open jobs from other users yet. When someone posts a project, you can apply from here."
        />
      </Paper>
    </Stack>
  )
}

export default function DashboardPage({ section = 'dashboard' }) {
  const { user } = useOutletContext()
  const copy = TITLES[section] || TITLES.dashboard
  const worker = accountKindOf(user) === 'worker' && !canPostProjects(user)
  const header = {
    ...copy,
    ...(section === 'projects' && worker
      ? {
          title: 'Work',
          lead: 'See jobs you can bid on. Contractors and subcontractors post the listings.',
        }
      : {}),
  }

  return (
    <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      {section !== 'dashboard' ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
            {header.title}
          </Typography>
          <Typography color="text.secondary">{header.lead}</Typography>
        </Box>
      ) : null}

      {section === 'dashboard' ? <DashboardHome user={user} /> : <ProjectsSection user={user} />}
    </Box>
  )
}
