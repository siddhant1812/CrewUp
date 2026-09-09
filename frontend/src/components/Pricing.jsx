import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '../api/auth'
import { fetchPlans, startCheckout } from '../api/billing'

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="rgba(0,102,255,0.1)" stroke="#0066FF" strokeWidth="1.2" />
      <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Pricing() {
  const session = getSession()
  const [plans, setPlans] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPlans()
        if (!cancelled) setPlans(data.plans || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load plans.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCta(plan) {
    if (plan.id === 'starter') {
      window.location.href = session?.user ? '/dashboard/settings' : '/signup'
      return
    }
    if (!session?.user) {
      window.location.href = `/signup?plan=${plan.id}`
      return
    }
    setBusy(plan.id)
    setError('')
    try {
      const data = await startCheckout(plan.id)
      if (data.url) {
        window.location.href = data.url
        return
      }
      window.location.href = '/dashboard/settings'
    } catch (err) {
      setError(err.message || 'Checkout failed.')
      setBusy('')
    }
  }

  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <div className="pricing__intro">
          <p className="eyebrow">Pricing</p>
          <h2 className="h2">Simple Pricing For Construction Professionals</h2>
          <p className="lead lead-center">No hidden fees. Upgrade when you&apos;re ready.</p>
        </div>
        {error ? <p className="lead lead-center" style={{ color: '#b91c1c' }}>{error}</p> : null}
        <div className="pricing__grid">
          {plans.map((p) => (
            <article key={p.id} className={`plan${p.popular ? ' plan--popular' : ''}`}>
              {p.popular && <div className="plan__badge">Most Popular</div>}
              <h3 className="plan__name">{p.name}</h3>
              <div className="plan__price">
                <span className="plan__amount">{p.priceLabel}</span>
                {p.period && <span className="plan__period">{p.period}</span>}
              </div>
              <p className="plan__blurb">{p.blurb}</p>
              <ul className="plan__features">
                {p.features.map((f) => (
                  <li key={f}>
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`btn btn-lg plan__cta ${p.popular ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleCta(p)}
                disabled={busy === p.id}
              >
                {busy === p.id
                  ? 'Redirecting…'
                  : p.id === 'starter'
                    ? session?.user
                      ? 'Current / Starter'
                      : 'Get Started'
                    : `Start ${p.name} Plan`}
              </button>
            </article>
          ))}
        </div>
        {!plans.length && !error ? (
          <p className="lead lead-center">Loading plans…</p>
        ) : null}
        <p className="lead lead-center" style={{ marginTop: '1.25rem' }}>
          Manage cards and invoices in{' '}
          <Link to="/dashboard/settings">Settings → Billing</Link>.
        </p>
      </div>
    </section>
  )
}
