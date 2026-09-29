import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { mediaUrl, updateSessionUser } from '../api/auth'
import { fetchSettings, uploadProfilePhoto } from '../api/settings'
import { fetchBilling } from '../api/billing'

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function designationLabel(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Employee'
  return 'Contractor'
}

function planLabel(plan) {
  if (plan === 'pro') return 'Pro'
  if (plan === 'business') return 'Business'
  return 'Starter'
}

export default function AccountDrawer({ user, open, onClose, onLogout }) {
  const fileRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [billing, setBilling] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')

  const type = profile?.contractorType || user.contractorType
  const photo = mediaUrl(profile?.profilePhoto || user.profilePhoto)
  const plan = billing?.plan || user.plan || 'starter'
  const planName = billing?.planName || planLabel(plan)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setError('')
    Promise.all([fetchSettings(), fetchBilling()])
      .then(([settings, bill]) => {
        if (cancelled) return
        setProfile(settings.profile || null)
        setBilling(bill.billing || null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load account.')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Photo must be under 3MB.')
      return
    }
    setPhotoBusy(true)
    setError('')
    try {
      const data = await uploadProfilePhoto(file)
      setProfile(data.profile)
      updateSessionUser({
        profilePhoto: data.profile.profilePhoto,
        fullName: data.profile.fullName,
      })
    } catch (err) {
      setError(err.message || 'Could not update photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`account-drawer__backdrop${open ? ' is-open' : ''}`}
        aria-label="Close account"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={`account-drawer${open ? ' is-open' : ''}`}
        aria-hidden={!open}
        aria-label="Account details"
      >
        <div className="account-drawer__head">
          <h2>Account</h2>
          <button type="button" className="account-drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="account-drawer__profile">
          <div className="account-drawer__photo">
            {photo ? (
              <img src={photo} alt="" width="72" height="72" />
            ) : (
              <span>{initials(user.fullName)}</span>
            )}
            <button
              type="button"
              className="account-drawer__camera"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              aria-label="Edit profile photo"
              title="Edit profile photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 8.5h2.2l1.3-2h9l1.3 2H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <circle cx="12" cy="13.2" r="3.1" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPhoto}
            />
          </div>
          <div>
            <strong>{profile?.fullName || user.fullName}</strong>
            <span className="account-drawer__role">{designationLabel(type)}</span>
            <span className="account-drawer__email">{profile?.workEmail || user.workEmail}</span>
          </div>
        </div>

        {error ? <p className="account-drawer__error">{error}</p> : null}
        {photoBusy ? <p className="account-drawer__hint">Uploading photo…</p> : null}

        <section className="account-drawer__about">
          <h3>About</h3>
          <dl>
            <div>
              <dt>Designation</dt>
              <dd>{designationLabel(type)}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{profile?.company || user.company || '—'}</dd>
            </div>
            <div>
              <dt>Job title</dt>
              <dd>{profile?.jobTitle || user.jobTitle || '—'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{profile?.location || user.location || '—'}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString([], {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <nav className="account-drawer__nav">
          <Link to="/dashboard/settings/account" onClick={onClose}>
            Settings
          </Link>
          <Link to="/dashboard/billing" onClick={onClose}>
            Subscription
            <em>{planName}</em>
          </Link>
        </nav>

        <button type="button" className="account-drawer__logout" onClick={onLogout}>
          Log out
        </button>
      </aside>
    </>
  )
}
