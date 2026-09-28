import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { mediaUrl, updateSessionUser } from '../../api/auth'
import {
  cancelSubscription,
  fetchBilling,
  fetchPlans,
  openBillingPortal,
  resumeSubscription,
  startCheckout,
} from '../../api/billing'
import {
  deleteDocument,
  fetchActivity,
  fetchDocuments,
  fetchSettings,
  fetchTeam,
  inviteTeam,
  patchSettings,
  removeTeam,
  uploadDocument,
} from '../../api/settings'

function PageHead({ title, crumb, lead }) {
  return (
    <header className="set-head">
      <p className="set-crumb">
        Settings <span>›</span> {crumb}
      </p>
      <h1>{title}</h1>
      <p>{lead}</p>
    </header>
  )
}

function Field({ label, children }) {
  return (
    <label className="set-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchSettings()
        if (!cancelled) setProfile(data.profile)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { profile, setProfile, loading, error, setError }
}

export function AccountPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data = await patchSettings('account', {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        jobTitle: profile.jobTitle,
        location: profile.location,
        website: profile.website,
      })
      setProfile(data.profile)
      updateSessionUser({
        fullName: data.profile.fullName,
        profilePhoto: data.profile.profilePhoto,
      })
      setNotice('Account information saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Account Information"
        crumb="Account Information"
        lead="Your personal details as they appear across CrewUp."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      {profile && (
        <form className="set-card" onSubmit={onSubmit}>
          <div className="set-grid">
            <Field label="Full name">
              <input
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Work email">
              <input value={profile.workEmail || ''} disabled />
            </Field>
            <Field label="Phone">
              <input
                value={profile.phoneNumber || ''}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
              />
            </Field>
            <Field label="Job title">
              <input
                value={profile.jobTitle || ''}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <input
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="Austin, TX"
              />
            </Field>
            <Field label="Website">
              <input
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </Field>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </>
  )
}

export function CompanyPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('company', {
        company: profile.company,
        companyWebsite: profile.companyWebsite,
        companyPhone: profile.companyPhone,
        companyAddress: profile.companyAddress,
        licenseNumber: profile.licenseNumber,
        taxId: profile.taxId,
      })
      setProfile(data.profile)
      updateSessionUser({ company: data.profile.company })
      setNotice('Company information saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Company Information"
        crumb="Company Information"
        lead="Business details used on proposals and your public profile."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      {profile && (
        <form className="set-card" onSubmit={onSubmit}>
          <div className="set-grid">
            <Field label="Company name">
              <input
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </Field>
            <Field label="Company phone">
              <input
                value={profile.companyPhone || ''}
                onChange={(e) => setProfile({ ...profile, companyPhone: e.target.value })}
              />
            </Field>
            <Field label="Company website">
              <input
                value={profile.companyWebsite || ''}
                onChange={(e) => setProfile({ ...profile, companyWebsite: e.target.value })}
              />
            </Field>
            <Field label="License number">
              <input
                value={profile.licenseNumber || ''}
                onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
              />
            </Field>
            <Field label="Tax ID / EIN">
              <input
                value={profile.taxId || ''}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Address">
            <textarea
              rows={3}
              value={profile.companyAddress || ''}
              onChange={(e) => setProfile({ ...profile, companyAddress: e.target.value })}
            />
          </Field>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </>
  )
}

export function NotificationsPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  function toggle(key) {
    setProfile({
      ...profile,
      emailPreferences: {
        ...profile.emailPreferences,
        [key]: !profile.emailPreferences[key],
      },
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('notifications', {
        emailPreferences: profile.emailPreferences,
      })
      setProfile(data.profile)
      setNotice('Notification preferences saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    ['projectUpdates', 'Project updates'],
    ['newMessages', 'New messages'],
    ['proposalActivity', 'Proposal activity'],
    ['marketingEmails', 'Marketing emails'],
  ]

  return (
    <>
      <PageHead
        title="Notifications"
        crumb="Notifications"
        lead="Choose which emails CrewUp can send you."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      {profile && (
        <form className="set-card" onSubmit={onSubmit}>
          {rows.map(([key, label]) => (
            <label key={key} className="set-check">
              <input
                type="checkbox"
                checked={Boolean(profile.emailPreferences?.[key])}
                onChange={() => toggle(key)}
              />
              <span>{label}</span>
            </label>
          ))}
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      )}
    </>
  )
}

export function BidPreferencesPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('bid-preferences', profile.bidPreferences)
      setProfile(data.profile)
      setNotice('Bid preferences saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Bid Preferences"
        crumb="Bid Preferences"
        lead="Tell us what work you want to see so matching can use your real settings."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      {profile && (
        <form className="set-card" onSubmit={onSubmit}>
          <Field label="Trades (comma separated)">
            <input
              value={(profile.bidPreferences?.trades || []).join(', ')}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bidPreferences: {
                    ...profile.bidPreferences,
                    trades: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="Electrical, HVAC, Drywall"
            />
          </Field>
          <div className="set-grid">
            <Field label="Service radius (miles)">
              <input
                type="number"
                min="0"
                value={profile.bidPreferences?.serviceRadiusMiles || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bidPreferences: {
                      ...profile.bidPreferences,
                      serviceRadiusMiles: e.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Minimum project budget">
              <input
                value={profile.bidPreferences?.minBudget || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bidPreferences: { ...profile.bidPreferences, minBudget: e.target.value },
                  })
                }
                placeholder="$25,000"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              rows={3}
              value={profile.bidPreferences?.notes || ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bidPreferences: { ...profile.bidPreferences, notes: e.target.value },
                })
              }
            />
          </Field>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      )}
    </>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PaymentsPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [billing, setBilling] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetchBilling()
      .then((d) => setBilling(d.billing))
      .catch(() => {})
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('payouts', {
        payoutEmail: profile.payoutEmail,
        payoutMethod: profile.payoutMethod,
      })
      setProfile(data.profile)
      setNotice('Payout details saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const card = billing?.paymentMethod

  return (
    <>
      <PageHead
        title="Payment & Payouts"
        crumb="Payment & Payouts"
        lead="Cards on file come from Stripe. Payout details are stored on your account."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}

      <article className="set-card">
        <h3>Payment method</h3>
        {card ? (
          <p>
            <strong className="set-cap">{card.brand}</strong> ending in {card.last4}
          </p>
        ) : (
          <p className="dash-empty" style={{ padding: 0 }}>
            No card on file. Add one when you subscribe.
          </p>
        )}
      </article>

      {profile && (
        <form className="set-card" onSubmit={onSubmit}>
          <h3>Payouts</h3>
          <div className="set-grid">
            <Field label="Payout email">
              <input
                type="email"
                value={profile.payoutEmail || ''}
                onChange={(e) => setProfile({ ...profile, payoutEmail: e.target.value })}
              />
            </Field>
            <Field label="Method">
              <select
                value={profile.payoutMethod || ''}
                onChange={(e) => setProfile({ ...profile, payoutMethod: e.target.value })}
              >
                <option value="">Not set</option>
                <option value="bank">Bank transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </Field>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save payouts'}
          </button>
        </form>
      )}
    </>
  )
}

export function UsersPanel() {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchTeam()
      setMembers(data.members || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onInvite(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await inviteTeam({ email, role })
      setEmail('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Users & Permissions"
        crumb="Users & Permissions"
        lead="Invite people from your company. They appear here when you add their email."
      />
      {error ? <p className="dash-form-error">{error}</p> : null}
      <form className="set-card set-invite" onSubmit={onInvite}>
        <input
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? 'Inviting…' : 'Invite'}
        </button>
      </form>
      <div className="set-card">
        {loading ? <p className="dash-empty">Loading…</p> : null}
        {!loading && members.length === 0 ? (
          <p className="dash-empty" style={{ padding: 0 }}>
            No teammates yet. Invite someone above.
          </p>
        ) : (
          <ul className="set-list">
            {members.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.name || m.email}</strong>
                  <span>
                    {m.email} · {m.role} · {m.status}
                  </span>
                </div>
                <button type="button" className="dash-table__delete" onClick={() => removeTeam(m.id).then(load)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export function SecurityPanel() {
  const { profile, setProfile, loading, error, setError } = useProfile()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function onPassword(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await patchSettings('password', form)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setNotice('Password updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function onToggle2fa() {
    setSaving(true)
    setError('')
    try {
      const data = await patchSettings('two-factor', { enabled: !profile.twoFactorEnabled })
      setProfile(data.profile)
      setNotice(data.profile.twoFactorEnabled ? 'Two-factor flag enabled on your account.' : 'Two-factor disabled.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead
        title="Security"
        crumb="Security"
        lead="Change your password and manage two-factor authentication."
      />
      {loading ? <p className="dash-empty">Loading…</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      <form className="set-card" onSubmit={onPassword}>
        <h3>Password</h3>
        <Field label="Current password">
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />
        </Field>
        <div className="set-grid">
          <Field label="New password">
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </Field>
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          Update password
        </button>
      </form>
      {profile && (
        <div className="set-card">
          <h3>Two-factor authentication</h3>
          <p className="dash-muted">
            {profile.twoFactorEnabled ? 'Enabled on this account.' : 'Not enabled.'}
          </p>
          <button type="button" className="btn btn-outline btn-sm" onClick={onToggle2fa} disabled={saving}>
            {profile.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      )}
    </>
  )
}

export function IntegrationsPanel() {
  return (
    <>
      <PageHead
        title="Integrations"
        crumb="Integrations"
        lead="Connect accounting or calendar tools when those providers are wired."
      />
      <div className="set-card">
        <p className="dash-empty" style={{ padding: 0 }}>
          No integrations connected yet. OAuth providers have not been configured for this account.
        </p>
      </div>
    </>
  )
}

export function DocumentsPanel() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchDocuments()
      setDocs(data.documents || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadDocument(file)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <PageHead
        title="Documents"
        crumb="Documents"
        lead="Insurance, licenses, and other files stored on your account."
      />
      {error ? <p className="dash-form-error">{error}</p> : null}
      <div className="set-card">
        <label className="btn btn-outline btn-sm">
          {uploading ? 'Uploading…' : 'Upload file'}
          <input type="file" hidden disabled={uploading} onChange={onFile} />
        </label>
        {loading ? <p className="dash-empty">Loading…</p> : null}
        {!loading && docs.length === 0 ? (
          <p className="dash-empty">No documents uploaded yet.</p>
        ) : (
          <ul className="set-list">
            {docs.map((d) => (
              <li key={d.id}>
                <div>
                  <strong>
                    <a href={mediaUrl(d.url)} target="_blank" rel="noreferrer">
                      {d.name}
                    </a>
                  </strong>
                  <span>
                    {d.sizeLabel} · {formatDate(d.createdAt)}
                  </span>
                </div>
                <button type="button" className="dash-table__delete" onClick={() => deleteDocument(d.id).then(load)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function statusLabel(status) {
  const map = {
    none: 'Free',
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
  }
  return map[status] || status || 'Free'
}

function PlanCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="rgba(0,102,255,0.1)" stroke="#0066FF" strokeWidth="1.2" />
      <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SubscriptionPanel({ standalone = false }) {
  const [params, setParams] = useSearchParams()
  const [billing, setBilling] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [me, catalog] = await Promise.all([fetchBilling(), fetchPlans()])
      setBilling(me.billing)
      setPlans(catalog.plans || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const flag = params.get('billing')
    if (flag === 'success') {
      setNotice('Payment method saved and subscription updated.')
      params.delete('billing')
      setParams(params, { replace: true })
      load()
    } else if (flag === 'cancel') {
      setNotice('Checkout was canceled. Your plan was not changed.')
      params.delete('billing')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  async function checkout(planId) {
    setBusy(planId)
    setError('')
    try {
      const data = await startCheckout(planId)
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.billing) setBilling(data.billing)
      if (data.message) setNotice(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const card = billing?.paymentMethod
  const paid = billing && billing.plan !== 'starter' && billing.subscriptionStatus === 'active'

  return (
    <>
      {standalone ? (
        <div className="dash-page__header">
          <h1>Billing</h1>
          <p>Your CrewUp plan, payment method, and billing cycle.</p>
        </div>
      ) : (
        <PageHead
          title="Subscription"
          crumb="Subscription"
          lead="Your CrewUp plan and billing cycle."
        />
      )}
      {notice ? <p className="bill-notice">{notice}</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}
      {loading ? <p className="dash-empty">Loading billing…</p> : null}
      {billing && (
        <>
          <div className="bill-grid">
            <article className="dash-table-card bill-card">
              <div className="dash-table-card__head">
                <h3>Current plan</h3>
              </div>
              <div className="bill-card__body">
                <p className="bill-plan">
                  {billing.planName}{' '}
                  <span className="bill-status">{statusLabel(billing.subscriptionStatus)}</span>
                </p>
                <p className="bill-price">
                  {billing.priceLabel}
                  {billing.period}
                </p>
                {billing.currentPeriodEnd ? (
                  <p className="dash-muted">
                    {billing.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {formatDate(billing.currentPeriodEnd)}
                  </p>
                ) : (
                  <p className="dash-muted">Free Starter plan.</p>
                )}
                {!billing.stripeReady ? (
                  <p className="bill-warn">
                    Stripe keys are not set yet. Paid checkout stays disabled until you add them to
                    backend/.env.
                  </p>
                ) : null}
                <div className="bill-actions">
                  {paid && !billing.cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={async () => {
                        const data = await cancelSubscription()
                        setBilling(data.billing)
                      }}
                    >
                      Cancel subscription
                    </button>
                  ) : null}
                  {billing.cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        const data = await resumeSubscription()
                        setBilling(data.billing)
                      }}
                    >
                      Keep my plan
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
            <article className="dash-table-card bill-card">
              <div className="dash-table-card__head">
                <h3>Payment method</h3>
              </div>
              <div className="bill-card__body">
                {card ? (
                  <>
                    <p className="bill-card-line">
                      <strong>{card.brand}</strong> ending in {card.last4}
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={async () => {
                        const data = await openBillingPortal()
                        if (data.url) window.location.href = data.url
                      }}
                    >
                      Update card
                    </button>
                  </>
                ) : (
                  <p className="dash-empty" style={{ padding: 0 }}>
                    No card on file.
                  </p>
                )}
              </div>
            </article>
          </div>
          <div className="set-pricing">
            <div className="pricing__grid">
              {plans.map((plan) => {
                const current = billing.plan === plan.id
                const disabled =
                  current || !!busy || (plan.id !== 'starter' && !billing.stripeReady)
                let cta = `Start ${plan.name} Plan`
                if (current && plan.id === 'starter') cta = 'Current / Starter'
                else if (current) cta = `Current / ${plan.name}`
                else if (busy === plan.id) cta = 'Redirecting…'
                else if (plan.id === 'starter') cta = 'Switch to Starter'

                return (
                  <article key={plan.id} className={`plan${plan.popular ? ' plan--popular' : ''}`}>
                    {plan.popular && <div className="plan__badge">Most Popular</div>}
                    <h3 className="plan__name">{plan.name}</h3>
                    <div className="plan__price">
                      <span className="plan__amount">{plan.priceLabel}</span>
                      {plan.period && <span className="plan__period">{plan.period}</span>}
                    </div>
                    <p className="plan__blurb">{plan.blurb}</p>
                    <ul className="plan__features">
                      {(plan.features || []).map((f) => (
                        <li key={f}>
                          <PlanCheck />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`btn btn-lg plan__cta ${plan.popular && !current ? 'btn-primary' : 'btn-outline'}`}
                      disabled={disabled}
                      onClick={() => checkout(plan.id)}
                    >
                      {cta}
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export function ActivityPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchActivity()
        if (!cancelled) setItems(data.activity || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
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
      <PageHead
        title="Activity Log"
        crumb="Activity Log"
        lead="Review important account activity and changes."
      />
      {error ? <p className="dash-form-error">{error}</p> : null}
      <div className="set-card">
        {loading ? <p className="dash-empty">Loading activity…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="dash-empty" style={{ padding: 0 }}>
            No account activity yet. Sign-ins, profile edits, uploads, and billing changes will show
            up here.
          </p>
        ) : (
          <ul className="set-activity">
            {items.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.title}</strong>
                  {a.detail ? <p>{a.detail}</p> : null}
                </div>
                <time dateTime={a.createdAt}>{formatWhen(a.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
