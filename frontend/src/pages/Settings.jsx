import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  cancelSubscription,
  fetchBilling,
  fetchPlans,
  openBillingPortal,
  resumeSubscription,
  startCheckout,
} from '../api/billing'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
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

export default function Settings() {
  const { user } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const [billing, setBilling] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [me, catalog] = await Promise.all([fetchBilling(), fetchPlans()])
      setBilling(me.billing)
      setPlans(catalog.plans || [])
    } catch (err) {
      setError(err.message || 'Failed to load billing.')
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
    setNotice('')
    try {
      const data = await startCheckout(planId)
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.billing) setBilling(data.billing)
      if (data.message) setNotice(data.message)
    } catch (err) {
      setError(err.message || 'Checkout failed.')
    } finally {
      setBusy('')
    }
  }

  async function portal() {
    setBusy('portal')
    setError('')
    try {
      const data = await openBillingPortal()
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Could not open the billing portal.')
    } finally {
      setBusy('')
    }
  }

  async function cancel() {
    if (!window.confirm('Cancel at the end of the current billing period?')) return
    setBusy('cancel')
    setError('')
    try {
      const data = await cancelSubscription()
      setBilling(data.billing)
      setNotice('Subscription will end at the current period, then you’ll be on Starter.')
    } catch (err) {
      setError(err.message || 'Could not cancel.')
    } finally {
      setBusy('')
    }
  }

  async function resume() {
    setBusy('resume')
    setError('')
    try {
      const data = await resumeSubscription()
      setBilling(data.billing)
      setNotice('Cancellation undone. Your paid plan stays active.')
    } catch (err) {
      setError(err.message || 'Could not resume.')
    } finally {
      setBusy('')
    }
  }

  const card = billing?.paymentMethod
  const paid = billing && billing.plan !== 'starter' && billing.subscriptionStatus === 'active'

  return (
    <section className="dash-page">
      <div className="dash-page__header">
        <h1>Settings</h1>
        <p>Update account preferences, notifications, and billing.</p>
      </div>

      <div className="dash-welcome">
        <div className="dash-welcome__text">
          <h2>Account</h2>
          <p>
            Signed in as <strong>{user.workEmail}</strong>
            {user.company ? (
              <>
                {' '}
                at <strong>{user.company}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      {notice ? <p className="bill-notice">{notice}</p> : null}
      {error ? <p className="dash-form-error">{error}</p> : null}

      <div className="bill-grid">
        <article className="dash-table-card bill-card">
          <div className="dash-table-card__head">
            <h3>Current plan</h3>
          </div>
          {loading || !billing ? (
            <p className="dash-empty">Loading billing…</p>
          ) : (
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
                <p className="dash-muted">Free Starter plan — add a card when you upgrade.</p>
              )}
              {!billing.stripeReady ? (
                <p className="bill-warn">
                  Stripe keys are not set yet. Paid checkout stays disabled until you add them to
                  backend/.env.
                </p>
              ) : null}
              <div className="bill-actions">
                {paid && !billing.cancelAtPeriodEnd ? (
                  <button type="button" className="btn btn-outline btn-sm" onClick={cancel} disabled={!!busy}>
                    Cancel subscription
                  </button>
                ) : null}
                {billing.cancelAtPeriodEnd ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={resume} disabled={!!busy}>
                    Keep my plan
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </article>

        <article className="dash-table-card bill-card">
          <div className="dash-table-card__head">
            <h3>Payment method</h3>
          </div>
          {loading || !billing ? (
            <p className="dash-empty">Loading…</p>
          ) : card ? (
            <div className="bill-card__body">
              <p className="bill-card-line">
                <strong>{card.brand}</strong> ending in {card.last4}
              </p>
              {card.expMonth && card.expYear ? (
                <p className="dash-muted">
                  Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                </p>
              ) : null}
              <div className="bill-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={portal} disabled={!!busy}>
                  {busy === 'portal' ? 'Opening…' : 'Update card'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bill-card__body">
              <p className="dash-empty" style={{ padding: 0 }}>
                No card on file. Upgrade to Pro or Business to add a payment method through Stripe
                Checkout.
              </p>
            </div>
          )}
        </article>
      </div>

      <div className="dash-table-card">
        <div className="dash-table-card__head">
          <h3>Change plan</h3>
        </div>
        <div className="bill-plans">
          {plans.map((plan) => {
            const current = billing?.plan === plan.id
            return (
              <article key={plan.id} className={`bill-plan-tile${plan.popular ? ' is-popular' : ''}`}>
                <h4>{plan.name}</h4>
                <p className="bill-plan-tile__price">
                  {plan.priceLabel}
                  {plan.period}
                </p>
                <p>{plan.blurb}</p>
                <button
                  type="button"
                  className={`btn btn-sm ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                  disabled={current || !!busy || (plan.id !== 'starter' && billing && !billing.stripeReady)}
                  onClick={() => checkout(plan.id)}
                >
                  {current
                    ? 'Current plan'
                    : busy === plan.id
                      ? 'Redirecting…'
                      : plan.id === 'starter'
                        ? 'Switch to Starter'
                        : `Subscribe to ${plan.name}`}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
