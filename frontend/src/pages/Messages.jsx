import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?'
}

function displayName(user) {
  if (!user) return 'Unknown'
  return user.company || user.fullName || 'Unknown'
}

function Avatar({ user, size = 44, className = '' }) {
  const src = mediaUrl(user?.profilePhoto)
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={className}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
      />
    )
  }
  return (
    <span
      className={`msg-avatar-fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(user?.fullName || user?.company)}
    </span>
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

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
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
  }, [tab, debouncedQuery, page])

  const loadThread = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return
    if (!silent) setThreadLoading(true)
    try {
      const [detail, msgs] = await Promise.all([
        fetchConversation(id),
        fetchMessages(id),
      ])
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
    const id = setInterval(() => {
      loadConversations({ silent: true })
      if (activeId) loadThread(activeId, { silent: true })
    }, 4000)
    return () => clearInterval(id)
  }, [loadConversations, loadThread, activeId])

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
  const pageButtons = Array.from(
    { length: Math.min(5, pagination.totalPages || 1) },
    (_, i) => i + 1
  )

  return (
    <section className="msg">
      <div className="msg__intro">
        <div className="msg__intro-row">
          <div>
            <h1>Messages</h1>
            <p>Communicate with general contractors and manage conversations.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            New message
          </button>
        </div>
      </div>

      <div className="msg__layout">
        <aside className="msg-list">
          <div className="msg-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className={`msg-tabs__item${tab === t.id ? ' is-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.count != null ? ` (${t.count})` : ''}
              </button>
            ))}
          </div>

          <div className="msg-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="msg-threads">
            {listLoading && <p className="msg-empty">Loading conversations…</p>}
            {!listLoading && listError && <p className="msg-empty">{listError}</p>}
            {!listLoading && !listError && conversations.length === 0 && (
              <p className="msg-empty">
                No conversations yet. Start one with <strong>New message</strong>.
              </p>
            )}
            {!listLoading &&
              conversations.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`msg-thread${activeId === t.id ? ' is-active' : ''}`}
                  onClick={() => setActiveId(t.id)}
                >
                  <Avatar user={t.other} className="msg-thread__avatar" />
                  <div className="msg-thread__body">
                    <div className="msg-thread__top">
                      <strong>{displayName(t.other)}</strong>
                      <span>{formatTime(t.lastMessageAt)}</span>
                    </div>
                    <div className="msg-thread__project">
                      {t.projectTitle || t.other?.fullName || 'Conversation'}
                    </div>
                    <p>{t.preview || 'No messages yet'}</p>
                  </div>
                  {t.unread > 0 && <span className="msg-thread__badge">{t.unread}</span>}
                </button>
              ))}
          </div>

          <div className="msg-pager">
            <span>
              Showing {showingFrom} to {showingTo} of {pagination.total} conversations
            </span>
            <div className="msg-pager__pages">
              {pageButtons.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={page === n ? 'is-active' : ''}
                  disabled={n > (pagination.totalPages || 1)}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="msg-chat">
          {!activeId || !active ? (
            <div className="msg-chat__empty">
              <h2>Select a conversation</h2>
              <p>Choose a thread on the left, or start a new message.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
                New message
              </button>
            </div>
          ) : (
            <>
              <header className="msg-chat__head">
                <div className="msg-chat__who">
                  <Avatar user={other} size={40} />
                  <div>
                    <div className="msg-chat__name">
                      <strong>{displayName(other)}</strong>
                    </div>
                    <p>
                      {[active.projectTitle || other?.fullName, active.projectLocation]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                </div>
                <div className="msg-chat__actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleArchive}>
                    {tab === 'archive' ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </header>

              <div className="msg-feed" ref={feedRef}>
                {threadLoading && <p className="msg-empty">Loading messages…</p>}
                {!threadLoading && feedItems.length === 0 && (
                  <p className="msg-empty">No messages yet. Say hello below.</p>
                )}
                {feedItems.map((item) => {
                  if (item.kind === 'date') {
                    return (
                      <div key={item.id} className="msg-date">
                        {item.label}
                      </div>
                    )
                  }
                  if (item.from === 'system') {
                    return (
                      <div key={item.id} className="msg-event">
                        <div className="msg-event__icon" aria-hidden="true">
                          📅
                        </div>
                        <div>
                          <strong>{item.systemPayload?.title || 'Update'}</strong>
                          <p>{item.text}</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={item.id}
                      className={`msg-bubble-row${item.from === 'me' ? ' is-me' : ''}`}
                    >
                      {item.from === 'them' && <Avatar user={other} size={32} />}
                      <div className="msg-bubble">
                        {item.text ? <p>{item.text}</p> : null}
                        {item.attachments?.length > 0 && (
                          <ul className="msg-bubble__files">
                            {item.attachments.map((f) => (
                              <li key={`${item.id}-${f.url}`}>
                                <a href={mediaUrl(f.url)} target="_blank" rel="noreferrer">
                                  {f.name}
                                </a>
                                <span>{f.sizeLabel}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="msg-bubble__meta">
                          <span>{formatTime(item.time)}</span>
                          {item.from === 'me' && item.read && (
                            <span className="msg-read" aria-label="Read">
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {sendError && <p className="msg-send-error">{sendError}</p>}
              {pendingFiles.length > 0 && (
                <div className="msg-pending">
                  {pendingFiles.map((f) => (
                    <span key={`${f.name}-${f.size}`}>{f.name}</span>
                  ))}
                  <button type="button" onClick={() => setPendingFiles([])}>
                    Clear
                  </button>
                </div>
              )}

              <form className="msg-composer" onSubmit={handleSend}>
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
                <button
                  type="button"
                  className="msg-icon-btn"
                  aria-label="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M14.5 8.5l-5.8 5.8a3.2 3.2 0 1 1-4.5-4.5l6.2-6.2a2.1 2.1 0 0 1 3 3L7.7 12.3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="msg-send" aria-label="Send" disabled={sending}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 9l12-5.5L12 15l-2.5-4.5L3 9z" fill="currentColor" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>

        <aside className="msg-details">
          {active ? (
            <>
              <section className="msg-panel">
                <h3>Project Details</h3>
                {active.projectImage ? (
                  <img className="msg-panel__thumb" src={mediaUrl(active.projectImage)} alt="" />
                ) : (
                  <div className="msg-panel__thumb msg-panel__thumb--empty">No project image</div>
                )}
                <strong className="msg-panel__title">
                  {active.projectTitle || 'General conversation'}
                </strong>
                <p className="msg-panel__sub">
                  {[active.projectLocation || other?.location, active.projectType]
                    .filter(Boolean)
                    .join(' • ') || '—'}
                </p>
                <dl className="msg-meta">
                  {active.bidDeadline && (
                    <div>
                      <dt>Bid Deadline</dt>
                      <dd>{formatDateLabel(active.bidDeadline)}</dd>
                    </div>
                  )}
                  {active.budget && (
                    <div>
                      <dt>Budget</dt>
                      <dd>{active.budget}</dd>
                    </div>
                  )}
                </dl>
                {active.trades?.length > 0 && (
                  <div className="msg-tags">
                    {active.trades.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                )}
              </section>

              <section className="msg-panel">
                <h3>Conversation Info</h3>
                <dl className="msg-meta">
                  <div>
                    <dt>Contact</dt>
                    <dd>{other?.fullName || '—'}</dd>
                  </div>
                  <div>
                    <dt>Company</dt>
                    <dd>{other?.company || '—'}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>
                      {other?.contractorType === 'subcontractor'
                        ? 'Subcontractor'
                        : 'General Contractor'}
                    </dd>
                  </div>
                  <div>
                    <dt>Member Since</dt>
                    <dd>
                      {other?.memberSince
                        ? new Date(other.memberSince).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="msg-panel">
                <div className="msg-panel__row">
                  <h3>Shared Files</h3>
                </div>
                {sharedFiles.length === 0 ? (
                  <p className="msg-empty">No files shared yet.</p>
                ) : (
                  <ul className="msg-files">
                    {sharedFiles.map((f) => (
                      <li key={`${f.url}-${f.date}`}>
                        <span className="msg-files__icon">
                          {(f.mimeType || '').includes('pdf') ? 'PDF' : 'FILE'}
                        </span>
                        <div>
                          <strong>
                            <a href={mediaUrl(f.url)} target="_blank" rel="noreferrer">
                              {f.name}
                            </a>
                          </strong>
                          <span>
                            {f.sizeLabel} · {formatTime(f.date)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="msg-panel msg-panel--actions">
                <h3>Actions</h3>
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
                <button type="button" onClick={() => uploadInputRef.current?.click()}>
                  Upload Files
                </button>
                <button type="button" onClick={handleArchive}>
                  {tab === 'archive' ? 'Unarchive Conversation' : 'Archive Conversation'}
                </button>
              </section>
            </>
          ) : (
            <div className="msg-panel">
              <h3>Details</h3>
              <p className="msg-empty">Select a conversation to see project and contact details.</p>
            </div>
          )}
        </aside>
      </div>

      {showNew && (
        <div className="msg-modal" role="dialog" aria-modal="true" aria-label="New message">
          <button
            type="button"
            className="msg-modal__backdrop"
            aria-label="Close"
            onClick={() => setShowNew(false)}
          />
          <div className="msg-modal__card">
            <header>
              <h2>New message</h2>
              <button type="button" className="msg-icon-btn" onClick={() => setShowNew(false)}>
                ✕
              </button>
            </header>
            <p className="msg-modal__hint">
              Signed in as {me?.fullName}. Pick another CrewUp user to message.
            </p>
            <label className="msg-modal__field">
              <span>Search contacts</span>
              <input
                type="search"
                value={contactQuery}
                onChange={(e) => setContactQuery(e.target.value)}
                placeholder="Name, company, or email"
              />
            </label>
            <label className="msg-modal__field">
              <span>Project name (optional)</span>
              <input
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Office Build-Out"
              />
            </label>
            <label className="msg-modal__field">
              <span>Location (optional)</span>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Austin, TX"
              />
            </label>
            <label className="msg-modal__field">
              <span>First message (optional)</span>
              <textarea
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Hi — interested in discussing scope…"
              />
            </label>
            {newError && <p className="msg-send-error">{newError}</p>}
            <ul className="msg-modal__contacts">
              {contacts.length === 0 && (
                <li className="msg-empty">
                  No other users found. Create a second account to test messaging.
                </li>
              )}
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={starting}
                    onClick={() => handleStartConversation(c)}
                  >
                    <Avatar user={c} size={36} />
                    <span>
                      <strong>{displayName(c)}</strong>
                      <em>
                        {c.fullName}
                        {c.contractorType === 'subcontractor' ? ' · Sub' : ' · GC'}
                      </em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
