import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
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
  Tooltip,
  Typography,
} from '@mui/material'
import {
  AdminPanelSettingsOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  Search,
  VpnKeyOutlined,
} from '@mui/icons-material'
import { deleteUser, fetchUsers, resetUserPassword, updateUser } from '../api/admin'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_COLOR = {
  active: 'success',
  deactivated: 'warning',
  deleted: 'error',
}

export default function Users() {
  const { user: me } = useOutletContext()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [contractorType, setContractorType] = useState('')
  const [accountStatus, setAccountStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers({ page, q, contractorType, accountStatus })
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, contractorType, accountStatus])

  function onSearch(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function withBusy(id, fn) {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setBusy('')
    }
  }

  async function toggleStatus(u) {
    const next = u.accountStatus === 'active' ? 'deactivated' : 'active'
    await withBusy(u.id, async () => {
      await updateUser(u.id, { accountStatus: next })
      setNotice(`${u.fullName} is now ${next}.`)
      load()
    })
  }

  async function toggleAdmin(u) {
    const makingAdmin = u.role !== 'admin'
    const roleToSet = makingAdmin ? 'admin' : u.contractorType === 'general_contractor' ? 'business' : 'provider'
    if (!window.confirm(`${makingAdmin ? 'Grant' : 'Revoke'} admin access for ${u.fullName}?`)) return
    await withBusy(u.id, async () => {
      await updateUser(u.id, { role: roleToSet })
      setNotice(`Admin access ${makingAdmin ? 'granted to' : 'revoked from'} ${u.fullName}.`)
      load()
    })
  }

  async function doResetPassword(u) {
    const pw = window.prompt(`New password for ${u.fullName} (min 8 characters):`)
    if (!pw) return
    await withBusy(u.id, async () => {
      await resetUserPassword(u.id, pw)
      setNotice(`Password reset for ${u.fullName}.`)
    })
  }

  async function doDelete(u) {
    if (!window.confirm(`Permanently delete ${u.fullName} (${u.workEmail})? This cannot be undone.`)) return
    await withBusy(u.id, async () => {
      await deleteUser(u.id)
      setNotice(`${u.fullName} deleted.`)
      load()
    })
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>
          Users
        </Typography>
        <Typography color="text.secondary">{total} total accounts</Typography>
      </Box>

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

      <Stack
        component="form"
        onSubmit={onSearch}
        direction="row"
        useFlexGap
        sx={{ flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}
      >
        <TextField
          type="search"
          placeholder="Search name, email, or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          sx={{ flex: '1 1 260px' }}
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
        <Select
          value={contractorType}
          onChange={(e) => setContractorType(e.target.value)}
          size="small"
          displayEmpty
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All account types</MenuItem>
          <MenuItem value="general_contractor">Contractor</MenuItem>
          <MenuItem value="subcontractor">Subcontractor</MenuItem>
          <MenuItem value="find_work">Find work</MenuItem>
        </Select>
        <Select
          value={accountStatus}
          onChange={(e) => setAccountStatus(e.target.value)}
          size="small"
          displayEmpty
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="deactivated">Deactivated</MenuItem>
          <MenuItem value="deleted">Deleted</MenuItem>
        </Select>
        <Button type="submit" variant="contained" size="small">
          Search
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
        {loading ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Loading…
          </Typography>
        ) : users.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            No users match those filters.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                      <Typography fontWeight={600}>{u.fullName}</Typography>
                      {u.role === 'admin' ? <Chip size="small" color="secondary" label="Admin" /> : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {u.workEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>{(u.contractorType || '').replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.accountStatus}
                      color={STATUS_COLOR[u.accountStatus] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{u.plan}</TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 0.5 }}>
                      <Tooltip title={u.accountStatus === 'active' ? 'Deactivate account' : 'Activate account'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={busy === u.id}
                            onClick={() => toggleStatus(u)}
                            sx={{ '&:hover': { bgcolor: 'warning.light' } }}
                          >
                            {u.accountStatus === 'active' ? (
                              <BlockOutlined fontSize="small" />
                            ) : (
                              <CheckCircleOutlined fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          u.id === me.id
                            ? "You can't change your own admin access"
                            : u.role === 'admin'
                              ? 'Revoke admin access'
                              : 'Make admin'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            disabled={busy === u.id || u.id === me.id}
                            onClick={() => toggleAdmin(u)}
                            color={u.role === 'admin' ? 'secondary' : 'default'}
                            sx={{ '&:hover': { bgcolor: 'primary.light' } }}
                          >
                            <AdminPanelSettingsOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reset password">
                        <span>
                          <IconButton
                            size="small"
                            disabled={busy === u.id}
                            onClick={() => doResetPassword(u)}
                            sx={{ '&:hover': { bgcolor: 'action.selected' } }}
                          >
                            <VpnKeyOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={u.id === me.id ? "You can't delete your own account" : 'Delete account'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={busy === u.id || u.id === me.id}
                            onClick={() => doDelete(u)}
                            sx={{ '&:hover': { bgcolor: 'error.light' } }}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {pages > 1 ? (
        <Stack direction="row" sx={{ justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.min(7, pages)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      ) : null}
    </>
  )
}
