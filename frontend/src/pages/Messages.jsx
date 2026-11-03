import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar as MuiAvatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  AddOutlined,
  ArchiveOutlined,
  AttachFileOutlined,
  CloseOutlined,
  DescriptionOutlined,
  DoneAllOutlined,
  InfoOutlined,
  InsertDriveFileOutlined,
  SearchOutlined,
  SendOutlined,
  SettingsOutlined,
  UnarchiveOutlined,
} from '@mui/icons-material'
import { getSession, mediaUrl } from '../api/auth'
import {
  createConversation,
  fetchContacts,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessage,
  toggleArchive,
} from '../api/messages'
import { getSocket } from '../api/socket'

const PAGE_SIZE = 8

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  if (isYesterday) return 'Yesterday'

  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 6)
  if (d >= weekAgo) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDateLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function dayKey(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '?'
  )
}

function displayName(user) {
  if (!user) return 'Unknown'
  return user.company || user.fullName || 'Unknown'
}

function Avatar({ user, size = 44 }) {
  const src = mediaUrl(user?.profilePhoto)
  return (
    <MuiAvatar src={src || undefined} sx={{ width: size, height: size, fontSize: size * 0.4, flexShrink: 0 }}>
      {initials(user?.fullName || user?.company)}
    </MuiAvatar>
  )
}

function EmptyState({ icon: IconCmp, children, tight = false }) {
  return (
    <Stack spacing={1.25} sx={{ alignItems: 'center', textAlign: 'center', py: tight ? 2 : 4, px: 2 }}>
      <Box
        sx={{
          width: tight ? 40 : 52,
          height: tight ? 40 : 52,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          color: 'primary.main',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconCmp fontSize={tight ? 'small' : 'medium'} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  )
}

export default function Messages() {
  const session = getSession()
  const me = session?.user

  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [conversations, setConversations] = useState([])
  const [counts, setCounts] = useState({ all: 0, unread: 0, gc: 0, project: 0, archive: 0 })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [activeId, setActiveId] = useState(null)
  const [active, setActive] = useState(null)
  const [sharedFiles, setSharedFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [draft, setDraft] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [sending, setSending] = useState(false)

  const [showNew, setShowNew] = useState(false)
  const [contacts, setContacts] = useState([])
  const [contactQuery, setContactQuery] = useState('')
  const [newProject, setNewProject] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [starting, setStarting] = useState(false)
  const [newError, setNewError] = useState('')
  const [typingName, setTypingName] = useState('')

  const feedRef = useRef(null)
  const fileInputRef = useRef(null)
  const uploadInputRef = useRef(null)

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'gc', label: 'General Contractors', count: counts.gc },
      { id: 'project', label: 'Projects', count: counts.project },
      { id: 'unread', label: 'Unread', count: counts.unread },
      { id: 'archive', label: 'Archive', count: counts.archive },
    ],
    [counts]
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [tab, debouncedQuery])

  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setListLoading(true)
      setListError('')
      try {
        const data = await fetchConversations({
          tab,
          q: debouncedQuery,
          page,
          limit: PAGE_SIZE,
        })
        setConversations(data.conversations || [])
        setCounts(data.counts || { all: 0, unread: 0, gc: 0, project: 0, archive: 0 })
        setPagination(data.pagination || { total: 0, totalPages: 1 })
        window.dispatchEvent(
          new CustomEvent('crewup-unread', {
            detail: { count: data.totalUnread || 0 },
          })
        )
        return data.conversations || []
      } catch (err) {
        setListError(err.message || 'Failed to load conversations.')
        return []
      } finally {
        if (!silent) setListLoading(false)
      }
    },
    [tab, debouncedQuery, page]
  )

  const loadThread = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return
    if (!silent) setThreadLoading(true)
    try {
      const [detail, msgs] = await Promise.all([fetchConversation(id), fetchMessages(id)])
      setActive(detail.conversation)
      setSharedFiles(detail.sharedFiles || [])
      setMessages(msgs.messages || [])
      await markConversationRead(id)
      window.dispatchEvent(new Event('crewup-messages-refresh'))
    } catch (err) {
      if (!silent) setSendError(err.message || 'Failed to load messages.')
    } finally {
      if (!silent) setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await loadConversations()
      if (cancelled) return
      if (!activeId && list.length) {
        setActiveId(list[0].id)
      } else if (activeId && !list.some((c) => c.id === activeId) && list.length) {
        setActiveId(list[0].id)
      } else if (!list.length) {
        setActiveId(null)
        setActive(null)
        setMessages([])
        setSharedFiles([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadConversations])

  useEffect(() => {
    if (!activeId) return
    loadThread(activeId)
  }, [activeId, loadThread])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return undefined

    function onNewMessage(payload) {
      if (!payload?.conversationId || !payload.message) return

      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                preview: payload.preview || c.preview,
                lastMessageAt: payload.message.time || c.lastMessageAt,
                unread: payload.conversationId === activeId ? 0 : payload.unread ?? c.unread,
              }
            : c
        )
        const exists = next.some((c) => c.id === payload.conversationId)
        if (!exists) return prev
        return next.sort((a, b) => {
          const ta = new Date(a.lastMessageAt || 0).getTime()
          const tb = new Date(b.lastMessageAt || 0).getTime()
          return tb - ta
        })
      })

      if (payload.conversationId === activeId) {
        setMessages((prev) => (prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]))
        if (payload.message.attachments?.length) {
          setSharedFiles((prev) => {
            const incoming = payload.message.attachments.map((f) => ({
              ...f,
              date: payload.message.time,
            }))
            return [...incoming, ...prev]
          })
        }
        markConversationRead(payload.conversationId).catch(() => {})
      } else {
        setConversations((prev) => {
          if (prev.some((c) => c.id === payload.conversationId)) return prev
          loadConversations({ silent: true })
          return prev
        })
      }
    }

    function onTyping(payload) {
      if (payload?.conversationId !== activeId || payload.userId === me?.id) return
      setTypingName(payload.typing ? payload.name || 'Someone' : '')
    }

    function onNewConversation() {
      loadConversations({ silent: true })
    }

    socket.on('message:new', onNewMessage)
    socket.on('typing', onTyping)
    socket.on('conversation:new', onNewConversation)

    const fallback = setInterval(() => {
      loadConversations({ silent: true })
    }, 45000)

    return () => {
      socket.off('message:new', onNewMessage)
      socket.off('typing', onTyping)
      socket.off('conversation:new', onNewConversation)
      clearInterval(fallback)
    }
  }, [activeId, loadConversations, me?.id])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !activeId) return undefined
    socket.emit('join-conversation', activeId)
    setTypingName('')
    return () => {
      socket.emit('leave-conversation', activeId)
      socket.emit('typing', { conversationId: activeId, typing: false })
    }
  }, [activeId])

  useEffect(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages, activeId])

  useEffect(() => {
    if (!showNew) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchContacts(contactQuery)
        if (!cancelled) setContacts(data.contacts || [])
      } catch {
        if (!cancelled) setContacts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showNew, contactQuery])

  async function handleSend(e) {
    e.preventDefault()
    if (!activeId || sending) return
    const text = draft.trim()
    if (!text && pendingFiles.length === 0) return

    setSending(true)
    setSendError('')
    try {
      const data = await sendMessage(activeId, { text, files: pendingFiles })
      setDraft('')
      setPendingFiles([])
      setMessages((prev) => [...prev, data.message])
      await loadConversations({ silent: true })
      const detail = await fetchConversation(activeId)
      setActive(detail.conversation)
      setSharedFiles(detail.sharedFiles || [])
    } catch (err) {
      setSendError(err.message || 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  async function handleStartConversation(contact) {
    setStarting(true)
    setNewError('')
    try {
      const data = await createConversation({
        participantId: contact.id,
        projectTitle: newProject.trim(),
        projectLocation: newLocation.trim(),
        initialMessage: newMessage.trim(),
      })
      setShowNew(false)
      setNewProject('')
      setNewLocation('')
      setNewMessage('')
      setContactQuery('')
      setTab('all')
      setActiveId(data.conversation.id)
      await loadConversations({ silent: true })
    } catch (err) {
      setNewError(err.message || 'Could not start conversation.')
    } finally {
      setStarting(false)
    }
  }

  async function handleArchive() {
    if (!activeId) return
    try {
      await toggleArchive(activeId)
      setActiveId(null)
      await loadConversations()
    } catch (err) {
      setSendError(err.message || 'Failed to archive.')
    }
  }

  async function handleUploadFiles(fileList) {
    if (!activeId || !fileList?.length) return
    setSending(true)
    setSendError('')
    try {
      const data = await sendMessage(activeId, { files: [...fileList] })
      setMessages((prev) => [...prev, data.message])
      const detail = await fetchConversation(activeId)
      setSharedFiles(detail.sharedFiles || [])
      await loadConversations({ silent: true })
    } catch (err) {
      setSendError(err.message || 'Upload failed.')
    } finally {
      setSending(false)
    }
  }

  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, pagination.total)

  const feedItems = useMemo(() => {
    const items = []
    let lastDay = ''
    for (const m of messages) {
      const key = dayKey(m.time)
      if (key && key !== lastDay) {
        items.push({ kind: 'date', id: `date-${key}`, label: formatDateLabel(m.time) })
        lastDay = key
      }
      items.push({ kind: 'message', ...m })
    }
    return items
  }, [messages])

  const other = active?.other

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction="row"
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.25 }}>
            Messages
          </Typography>
          <Typography color="text.secondary">Communicate with general contractors and manage conversations.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setShowNew(true)}>
          New message
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2.5}
        sx={{ alignItems: 'stretch', minHeight: { lg: 640 } }}
      >
        {/* Conversation list */}
        <Paper
          variant="outlined"
          sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 42, px: 1 }}
          >
            {tabs.map((t) => (
              <Tab
                key={t.id}
                value={t.id}
                label={`${t.label}${t.count != null ? ` (${t.count})` : ''}`}
                sx={{ textTransform: 'none', minHeight: 42, fontSize: '0.82rem' }}
              />
            ))}
          </Tabs>

          <Box sx={{ p: 1.5 }}>
            <TextField
              size="small"
              type="search"
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 240 }}>
            {listLoading ? (
              <Stack sx={{ alignItems: 'center', py: 4 }}>
                <CircularProgress size={22} />
              </Stack>
            ) : listError ? (
              <Typography variant="body2" color="error" sx={{ p: 2 }}>
                {listError}
              </Typography>
            ) : conversations.length === 0 ? (
              <EmptyState icon={DescriptionOutlined}>
                No conversations yet. Start one with <strong>New message</strong>.
              </EmptyState>
            ) : (
              <List disablePadding>
                {conversations.map((t) => (
                  <ListItemButton
                    key={t.id}
                    selected={activeId === t.id}
                    onClick={() => setActiveId(t.id)}
                    sx={{
                      alignItems: 'flex-start',
                      gap: 1.25,
                      py: 1.25,
                      px: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&.Mui-selected': { bgcolor: 'primary.light' },
                      '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                    }}
                  >
                    <Avatar user={t.other} size={40} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Typography fontWeight={700} fontSize="0.88rem" noWrap>
                          {displayName(t.other)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" flexShrink={0}>
                          {formatTime(t.lastMessageAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="primary.main" fontWeight={600} noWrap display="block">
                        {t.projectTitle || t.other?.fullName || 'Conversation'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {t.preview || 'No messages yet'}
                      </Typography>
                    </Box>
                    {t.unread > 0 ? (
                      <Box
                        sx={{
                          minWidth: 20,
                          height: 20,
                          px: 0.6,
                          borderRadius: 999,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {t.unread}
                      </Box>
                    ) : null}
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
              Showing {showingFrom} to {showingTo} of {pagination.total} conversations
            </Typography>
            {pagination.totalPages > 1 ? (
              <Pagination
                size="small"
                count={pagination.totalPages}
                page={page}
                onChange={(e, v) => setPage(v)}
                siblingCount={0}
              />
            ) : null}
          </Box>
        </Paper>

        {/* Active thread */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 480 }}>
          {!activeId || !active ? (
            <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3 }} spacing={1.5}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DescriptionOutlined fontSize="large" />
              </Box>
              <Typography variant="h6">Select a conversation</Typography>
              <Typography color="text.secondary">Choose a thread on the left, or start a new message.</Typography>
              <Button variant="contained" size="small" onClick={() => setShowNew(true)}>
                New message
              </Button>
            </Stack>
          ) : (
            <>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Avatar user={other} size={40} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>
                      {displayName(other)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {[active.projectTitle || other?.fullName, active.projectLocation].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={tab === 'archive' ? <UnarchiveOutlined /> : <ArchiveOutlined />}
                  onClick={handleArchive}
                  sx={{ flexShrink: 0 }}
                >
                  {tab === 'archive' ? 'Unarchive' : 'Archive'}
                </Button>
              </Stack>

              <Box ref={feedRef} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {threadLoading ? (
                  <Stack sx={{ alignItems: 'center', py: 4 }}>
                    <CircularProgress size={22} />
                  </Stack>
                ) : null}
                {!threadLoading && feedItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No messages yet. Say hello below.
                  </Typography>
                ) : null}
                {feedItems.map((item) => {
                  if (item.kind === 'date') {
                    return (
                      <Typography
                        key={item.id}
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        sx={{ alignSelf: 'center', my: 1 }}
                      >
                        {item.label}
                      </Typography>
                    )
                  }
                  if (item.from === 'system') {
                    return (
                      <Stack key={item.id} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', py: 1 }}>
                        <Typography aria-hidden="true">📅</Typography>
                        <Box>
                          <Typography fontWeight={700} fontSize="0.9rem">
                            {item.systemPayload?.title || 'Update'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.text}
                          </Typography>
                        </Box>
                      </Stack>
                    )
                  }
                  const isMe = item.from === 'me'
                  return (
                    <Stack
                      key={item.id}
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                    >
                      {!isMe ? <Avatar user={other} size={28} /> : null}
                      <Paper
                        elevation={0}
                        sx={{
                          maxWidth: '72%',
                          px: 1.5,
                          py: 1,
                          borderRadius: '14px',
                          bgcolor: isMe ? 'primary.main' : (theme) => (theme.palette.mode === 'dark' ? 'action.selected' : 'grey.100'),
                          color: isMe ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        {item.text ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {item.text}
                          </Typography>
                        ) : null}
                        {item.attachments?.length > 0 ? (
                          <Stack spacing={0.5} sx={{ mt: item.text ? 1 : 0 }}>
                            {item.attachments.map((f) => (
                              <Stack
                                key={`${item.id}-${f.url}`}
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                              >
                                <Typography
                                  component="a"
                                  href={mediaUrl(f.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  variant="body2"
                                  sx={{ color: 'inherit', textDecoration: 'underline' }}
                                >
                                  {f.name}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                  {f.sizeLabel}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        ) : null}
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {formatTime(item.time)}
                          </Typography>
                          {isMe && item.read ? <DoneAllOutlined sx={{ fontSize: 14, opacity: 0.85 }} /> : null}
                        </Stack>
                      </Paper>
                    </Stack>
                  )
                })}
                {typingName ? (
                  <Typography variant="body2" color="text.secondary">
                    {typingName} is typing…
                  </Typography>
                ) : null}
              </Box>

              {sendError ? (
                <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
                  {sendError}
                </Alert>
              ) : null}
              {pendingFiles.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', px: 2, pb: 1 }}>
                  {pendingFiles.map((f) => (
                    <Chip key={`${f.name}-${f.size}`} label={f.name} size="small" />
                  ))}
                  <Button size="small" onClick={() => setPendingFiles([])}>
                    Clear
                  </Button>
                </Stack>
              ) : null}

              <Box component="form" onSubmit={handleSend} sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = [...(e.target.files || [])]
                      if (files.length) setPendingFiles((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <IconButton aria-label="Attach file" onClick={() => fileInputRef.current?.click()}>
                    <AttachFileOutlined />
                  </IconButton>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Write a message..."
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value)
                      const socket = getSocket()
                      if (socket && activeId) {
                        socket.emit('typing', { conversationId: activeId, typing: true })
                      }
                    }}
                    onBlur={() => {
                      const socket = getSocket()
                      if (socket && activeId) {
                        socket.emit('typing', { conversationId: activeId, typing: false })
                      }
                    }}
                    disabled={sending}
                  />
                  <IconButton
                    type="submit"
                    aria-label="Send"
                    disabled={sending}
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <SendOutlined fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}
        </Paper>

        {/* Details sidebar */}
        <Paper
          variant="outlined"
          sx={{ width: { xs: '100%', lg: 280 }, flexShrink: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}
        >
          {active ? (
            <>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <DescriptionOutlined fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Project Details
                  </Typography>
                </Stack>
                {active.projectImage ? (
                  <Box
                    component="img"
                    src={mediaUrl(active.projectImage)}
                    alt=""
                    sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2, mb: 1 }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 90,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      mb: 1,
                    }}
                  >
                    No project image
                  </Box>
                )}
                <Typography fontWeight={700}>{active.projectTitle || 'General conversation'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {[active.projectLocation || other?.location, active.projectType].filter(Boolean).join(' • ') || '—'}
                </Typography>
                {active.bidDeadline ? (
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Deadline
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDateLabel(active.bidDeadline)}
                    </Typography>
                  </Stack>
                ) : null}
                {active.budget ? (
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {active.budget}
                    </Typography>
                  </Stack>
                ) : null}
                {active.trades?.length > 0 ? (
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {active.trades.map((t) => (
                      <Chip key={t} label={t} size="small" />
                    ))}
                  </Stack>
                ) : null}
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <InfoOutlined fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Conversation Info
                  </Typography>
                </Stack>
                <Stack spacing={0.75}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Contact
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {other?.fullName || '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {other?.company || '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {other?.contractorType === 'subcontractor'
                        ? 'Subcontractor'
                        : other?.contractorType === 'find_work'
                          ? 'Find Work'
                          : 'Contractor'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {other?.memberSince
                        ? new Date(other.memberSince).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <InsertDriveFileOutlined fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Shared Files
                  </Typography>
                </Stack>
                {sharedFiles.length === 0 ? (
                  <EmptyState icon={InsertDriveFileOutlined} tight>
                    No files shared yet.
                  </EmptyState>
                ) : (
                  <Stack spacing={1}>
                    {sharedFiles.map((f) => (
                      <Stack key={`${f.url}-${f.date}`} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip
                          label={(f.mimeType || '').includes('pdf') ? 'PDF' : 'FILE'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component="a"
                            href={mediaUrl(f.url)}
                            target="_blank"
                            rel="noreferrer"
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ color: 'primary.main', textDecoration: 'none', display: 'block' }}
                          >
                            {f.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {f.sizeLabel} · {formatTime(f.date)}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                  <SettingsOutlined fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Actions
                  </Typography>
                </Stack>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleUploadFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <Stack spacing={1}>
                  <Button variant="outlined" size="small" onClick={() => uploadInputRef.current?.click()}>
                    Upload Files
                  </Button>
                  <Button variant="outlined" size="small" color="inherit" onClick={handleArchive}>
                    {tab === 'archive' ? 'Unarchive Conversation' : 'Archive Conversation'}
                  </Button>
                </Stack>
              </Box>
            </>
          ) : (
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <InfoOutlined fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Details
                </Typography>
              </Stack>
              <EmptyState icon={InfoOutlined} tight>
                Select a conversation to see project and contact details.
              </EmptyState>
            </Box>
          )}
        </Paper>
      </Stack>

      <Dialog open={showNew} onClose={() => setShowNew(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          New message
          <IconButton onClick={() => setShowNew(false)} size="small">
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Signed in as {me?.fullName}. Pick another CrewUp user to message.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Search contacts"
              type="search"
              size="small"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Name, company, or email"
            />
            <TextField
              label="Project name (optional)"
              size="small"
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Office Build-Out"
            />
            <TextField
              label="Location (optional)"
              size="small"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Austin, TX"
            />
            <TextField
              label="First message (optional)"
              size="small"
              multiline
              rows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Hi — interested in discussing scope…"
            />
            {newError ? <Alert severity="error">{newError}</Alert> : null}

            <List disablePadding sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {contacts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  No other users found. Create a second account to test messaging.
                </Typography>
              ) : null}
              {contacts.map((c) => (
                <ListItemButton
                  key={c.id}
                  disabled={starting}
                  onClick={() => handleStartConversation(c)}
                  sx={{ borderRadius: 2, gap: 1.25 }}
                >
                  <Avatar user={c} size={36} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>
                      {displayName(c)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {c.fullName}
                      {c.contractorType === 'subcontractor' ? ' · Sub' : c.contractorType === 'find_work' ? ' · Work' : ' · GC'}
                    </Typography>
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
