import { Link } from 'react-router-dom'

const TRADES = [
  { name: 'Electrical', d: 'M13 2L4 14h7l-1 8 10-14h-7z' },
  { name: 'Plumbing', d: 'M8 3v4M16 3v4M6 7h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V7zM12 16v5' },
  { name: 'HVAC', d: 'M3 8h18v10H3zM7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h8' },
  { name: 'Roofing', d: 'M3 12l9-8 9 8M5 10.5V20h14v-9.5' },
  { name: 'Concrete', d: 'M4 10h16v10H4zM4 14h16M8 10V7h8v3' },
  { name: 'Framing', d: 'M4 20V8l8-5 8 5v12M9 20v-8h6v8' },
  { name: 'Drywall', d: 'M3 4h18v16H3zM3 12h18M12 4v16' },
  { name: 'Painting', d: 'M5 14c0-4 3-8 7-9 0 3 2 5 5 5 0 4-3 8-7 8s-5-1.5-5-4zM9 19v2' },
  { name: 'Flooring', d: 'M3 8l9-4 9 4v12l-9 4-9-4V8zM12 4v16M3 8l9 4 9-4' },
  { name: 'Excavation', d: 'M3 18h18M6 18V11l5-5 2 2v10M13 8l5 2v8' },
  { name: 'Landscaping', d: 'M12 20V10M12 14c-4 0-7-3-7-7 4 0 7 3 7 7zM12 14c4 0 7-3 7-7-4 0-7 3-7 7z' },
  { name: 'Masonry', d: 'M3 4h8v5H3zM13 4h8v5h-8zM7 10h10v5H7zM3 16h8v5H3zM13 16h8v5h-8z' },
]

const IMG =
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1100&q=80'

export default function FindContractors() {
  return (
    <section className="section find-contractors" id="find-contractors">
      <div className="container find-contractors__grid">
        <div className="find-contractors__copy">
          <p className="eyebrow">Find Contractors</p>
          <h2 className="h2">Find Qualified Subcontractors Fast</h2>
          <p className="lead">
            Search verified tradespeople by specialty, location, and availability — then hire
            with confidence.
          </p>
          <div className="trades">
            {TRADES.map((t) => (
              <Link
                key={t.name}
                to={`/dashboard/find-contractors?trade=${encodeURIComponent(t.name)}`}
                className="trade"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d={t.d} stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
          <Link to="/dashboard/find-contractors" className="btn btn-primary btn-lg">
            Find Contractors
          </Link>
        </div>
        <div className="find-contractors__media">
          <img
            src={IMG}
            alt="Two construction workers looking at a tablet together"
            width="560"
            height="480"
          />
        </div>
      </div>
    </section>
  )
}
