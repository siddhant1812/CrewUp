import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Alert, Avatar, Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { fetchStats } from '../api/admin'
import Icon from '../components/Icon'

function StatCard({ icon, label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: '1 1 200px',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
      }}
    >
      <Avatar
        sx={{
          width: 44,
          height: 44,
          bgcolor: 'primary.light',
          color: 'primary.dark',
        }}
      >
        <Icon name={icon} size={18} />
      </Avatar>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  )
}

function Breakdown({ title, counts }) {
  const entries = Object.entries(counts || {})
  return (
    <Paper
      elevation={0}
      sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px', mb: 2 }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.25 }}>
        {title}
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No data yet.
        </Typography>
      ) : (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
          {entries.map(([key, count]) => (
            <Chip
              key={key}
              variant="outlined"
              label={
                <>
                  {key.replace(/_/g, ' ')}: <b>{count}</b>
                </>
              }
            />
          ))}
        </Stack>
      )}
    </Paper>
  )
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchStats()
        if (!cancelled) setStats(data.stats)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load stats.')
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>
          Platform overview
        </Typography>
        <Typography color="text.secondary">Signed in as {user.fullName}</Typography>
      </Box>

      {loading ? (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2">Loading…</Typography>
        </Stack>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {stats ? (
        <>
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard icon="users" label="Total users" value={stats.totalUsers} />
            <StatCard icon="folder" label="Total projects" value={stats.totalProjects} />
            <StatCard icon="fileText" label="Proposals" value={stats.totalProposals} />
            <StatCard icon="coin" label="Conversations" value={stats.totalConversations} />
          </Stack>

          <Breakdown title="Users by account type" counts={stats.usersByType} />
          <Breakdown title="Users by status" counts={stats.usersByStatus} />
          <Breakdown title="Projects by status" counts={stats.projectsByStatus} />
          <Breakdown title="Plans" counts={stats.planCounts} />
        </>
      ) : null}
    </>
  )
}
