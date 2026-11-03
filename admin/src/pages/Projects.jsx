import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
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
import { DeleteOutlined, Search } from '@mui/icons-material'
import { deleteProject, fetchProjects, updateProjectStatus } from '../api/admin'

const STATUSES = ['draft', 'open', 'in_progress', 'completed', 'cancelled']

const STATUS_STYLES = {
  open: { bgcolor: 'success.light', color: 'success.main' },
  completed: { bgcolor: 'success.light', color: 'success.main' },
  cancelled: { bgcolor: 'error.light', color: 'error.main' },
  in_progress: { bgcolor: 'primary.light', color: 'primary.dark' },
  draft: { bgcolor: 'primary.light', color: 'primary.dark' },
}

function statusChipSx(status) {
  return STATUS_STYLES[status] || { bgcolor: 'grey.200', color: 'grey.700' }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects({ page, q, status })
      setProjects(data.projects || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  function onSearch(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function onStatusChange(p, nextStatus) {
    setBusy(p.id)
    setError('')
    setNotice('')
    try {
      await updateProjectStatus(p.id, nextStatus)
      setNotice(`${p.title} is now ${nextStatus.replace('_', ' ')}.`)
      load()
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    } finally {
      setBusy('')
    }
  }

  async function onDelete(p) {
    if (!window.confirm(`Permanently delete "${p.title}" and its proposals? This cannot be undone.`)) return
    setBusy(p.id)
    setError('')
    setNotice('')
    try {
      await deleteProject(p.id)
      setNotice(`"${p.title}" deleted.`)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete project.')
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5 }}>
            Projects
          </Typography>
          <Typography color="text.secondary">{total} total projects, across every contractor and subcontractor</Typography>
        </Box>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      ) : null}

      <Stack component="form" direction="row" spacing={1.5} onSubmit={onSearch} sx={{ mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search title or location"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} size="small" displayEmpty sx={{ minWidth: 180 }}>
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s.replace('_', ' ')}
            </MenuItem>
          ))}
        </Select>
        <IconButton type="submit" aria-label="Search" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
          <Search fontSize="small" />
        </IconButton>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Loading…
          </Typography>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No projects match those filters.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Posted by</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Bids</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  onClick={() => navigate(`/projects/${p.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{p.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[p.projectType, p.location].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>{p.createdBy?.fullName || 'Unknown'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.createdBy?.workEmail || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.status.replace('_', ' ')}
                      size="small"
                      sx={{ fontWeight: 600, textTransform: 'capitalize', ...statusChipSx(p.status) }}
                    />
                  </TableCell>
                  <TableCell>{p.bidsCount}</TableCell>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Select
                        value={p.status}
                        disabled={busy === p.id}
                        onChange={(e) => onStatusChange(p, e.target.value)}
                        size="small"
                        sx={{ minWidth: 140 }}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                            {s.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                      <IconButton
                        aria-label="Delete project"
                        color="error"
                        size="small"
                        disabled={busy === p.id}
                        onClick={() => onDelete(p)}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {pages > 1 ? (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Page {page} of {pages}
          </Typography>
          <Pagination count={pages} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
        </Stack>
      ) : null}
    </>
  )
}
