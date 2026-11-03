import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowBack, CheckCircle, DeleteOutlined } from '@mui/icons-material'
import { deleteProject, fetchProject, updateProject } from '../api/admin'

const STATUSES = ['draft', 'open', 'in_progress', 'completed', 'cancelled']
const POSTED_BY_ROLES = ['contractor', 'subcontractor']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    title: '',
    status: 'open',
    postedByRole: 'contractor',
    projectType: '',
    service: '',
    location: '',
    budget: '',
    vacancies: 1,
    dueDate: '',
    trades: '',
    description: '',
  }
}

function formFromProject(project) {
  return {
    title: project.title || '',
    status: project.status || 'open',
    postedByRole: project.postedByRole || 'contractor',
    projectType: project.projectType || '',
    service: project.service || '',
    location: project.location || '',
    budget: project.budget || '',
    vacancies: project.vacancies || 1,
    dueDate: toDateInput(project.dueDate),
    trades: (project.trades || []).join(', '),
    description: project.description || '',
  }
}

function MetaItem({ label, value }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Box>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProject(id)
      setProject(data.project)
      setForm(formFromProject(data.project))
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

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function onSave(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const data = await updateProject(id, {
        title: form.title.trim(),
        status: form.status,
        postedByRole: form.postedByRole,
        projectType: form.projectType.trim(),
        service: form.service.trim(),
        location: form.location.trim(),
        budget: form.budget.trim(),
        vacancies: form.vacancies,
        dueDate: form.dueDate || null,
        trades: form.trades,
        description: form.description.trim(),
      })
      setProject((prev) => ({ ...prev, ...data.project }))
      setForm(formFromProject(data.project))
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!project) return
    if (!window.confirm(`Permanently delete "${project.title}" and its proposals? This cannot be undone.`)) return
    setDeleting(true)
    setError('')
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch (err) {
      setError(err.message || 'Failed to delete project.')
      setDeleting(false)
    }
  }

  const backLink = (
    <Link
      component={RouterLink}
      to="/projects"
      underline="hover"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary', fontWeight: 600 }}
    >
      <ArrowBack sx={{ fontSize: 15 }} /> Back to Projects
    </Link>
  )

  if (loading) {
    return (
      <>
        {backLink}
        <Typography color="text.secondary">Loading project…</Typography>
      </>
    )
  }

  if (error && !project) {
    return (
      <>
        {backLink}
        <Alert severity="error">{error}</Alert>
      </>
    )
  }

  const proposalCount = project.proposalCount ?? project.bidsCount

  return (
    <>
      {backLink}

      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5 }}>
            {project.title}
          </Typography>
          <Typography color="text.secondary">
            {proposalCount} proposal{proposalCount === 1 ? '' : 's'} · Created {formatDate(project.createdAt)}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteOutlined fontSize="small" />}
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? 'Deleting…' : 'Delete project'}
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper
        component="form"
        onSubmit={onSave}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', p: { xs: 2.5, sm: 3.5 } }}
      >
        <Typography variant="h5" sx={{ fontSize: '1.15rem', mb: 2.5 }}>
          Project details
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
            pb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <MetaItem label="Posted by" value={project.createdBy?.fullName || 'Unknown'} />
          <MetaItem label="Email" value={project.createdBy?.workEmail || '—'} />
          <MetaItem
            label="Account type"
            value={(project.createdBy?.contractorType || '—').replace(/_/g, ' ')}
          />
          <MetaItem label="Bids" value={project.bidsCount} />
          <MetaItem label="Last updated" value={formatDate(project.updatedAt)} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <TextField label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required />

          <TextField
            select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Posted by role"
            value={form.postedByRole}
            onChange={(e) => set('postedByRole', e.target.value)}
          >
            {POSTED_BY_ROLES.map((r) => (
              <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                {r}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Austin, TX"
          />

          <TextField
            label="Project type / category"
            value={form.projectType}
            onChange={(e) => set('projectType', e.target.value)}
          />

          <TextField label="Service" value={form.service} onChange={(e) => set('service', e.target.value)} />

          <TextField
            label="Budget"
            value={form.budget}
            onChange={(e) => set('budget', e.target.value)}
            placeholder="$5,000"
          />

          <TextField
            label="Vacancies"
            type="number"
            value={form.vacancies}
            onChange={(e) => set('vacancies', e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: 1000 } }}
          />

          <TextField
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
            <TextField
              label="Trades (comma separated)"
              value={form.trades}
              onChange={(e) => set('trades', e.target.value)}
              placeholder="Electrical, Plumbing"
              fullWidth
            />
          </Box>

          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="No description was added for this project."
              multiline
              rows={6}
              fullWidth
            />
          </Box>
        </Box>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 3 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {saved ? (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'success.main' }}>
              <CheckCircle sx={{ fontSize: 18 }} />
              <Typography fontWeight={600} color="success.main">
                Saved
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </Paper>
    </>
  )
}
