import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
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
  Typography,
} from '@mui/material'
import { fetchProposals } from '../api/admin'

const STATUSES = ['pending', 'accepted', 'declined', 'withdrawn']

const STATUS_STYLES = {
  accepted: { bgcolor: 'success.light', color: 'success.main' },
  declined: { bgcolor: 'error.light', color: 'error.main' },
}

function statusChipSx(status) {
  return STATUS_STYLES[status] || { bgcolor: 'grey.200', color: 'grey.700' }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const data = await fetchProposals({ page, status })
        if (cancelled) return
        setProposals(data.proposals || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposals.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, status])

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: '1.6rem', mb: 0.5 }}>
          Proposals
        </Typography>
        <Typography color="text.secondary">{total} total bids placed across every project</Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack direction="row" sx={{ mb: 2.5 }}>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          size="small"
          displayEmpty
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Loading…
          </Typography>
        ) : proposals.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No proposals match those filters.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Bid</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{p.applicant?.fullName || 'Unknown'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.applicant?.workEmail || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.project?.title || '—'}</TableCell>
                  <TableCell>{p.amount}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.status}
                      size="small"
                      sx={{ fontWeight: 600, textTransform: 'capitalize', ...statusChipSx(p.status) }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>
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
