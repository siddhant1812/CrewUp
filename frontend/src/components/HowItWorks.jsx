const STEPS = [
  {
    n: 1,
    title: 'Create Your Profile',
    text: 'Sign up as a general contractor or subcontractor and showcase your skills, licenses, and experience.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="2.75" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 15c0-2.9 2.46-5.25 5.5-5.25S14.5 12.1 14.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Post or Search Projects',
    text: 'Browse jobs in your trade or post projects when you need reliable crew on site.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Connect With the Right Pros',
    text: 'Message verified partners, compare quotes, and build relationships that last.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 4.5h12v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 12.5v-8z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 4.5L9 9.5l6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Build Better Together',
    text: 'Stay connected, fill labor gaps fast, and grow a crew you can count on.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 14.5c0-2.2 1.8-4 4-4h0c.85 0 1.64.3 2.26.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.7 11.4A3.9 3.9 0 0 1 12 10.5h0c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const ROWS = [
  { name: 'Riverside Office Reno', loc: 'Austin, TX', due: 'Mar 12', status: 'Active' },
  { name: 'Oak Street Framing', loc: 'Dallas, TX', due: 'Mar 18', status: 'Bidding' },
  { name: 'Harbor HVAC Retrofit', loc: 'Houston, TX', due: 'Apr 02', status: 'Active' },
]

function Dashboard() {
  return (
    <div className="dash" aria-hidden="true">
      <aside className="dash__side">
        <div className="dash__logo">CU</div>
        {['Dashboard', 'Projects', 'Messages', 'Contractors', 'Billing'].map((item, i) => (
          <div key={item} className={`dash__item${i === 0 ? ' active' : ''}`}>
            <span className="dash__dot" />
            {item}
          </div>
        ))}
      </aside>
      <div className="dash__body">
        <p className="dash__hello">Welcome back, John!</p>
        <div className="dash__cards">
          {[
            ['12', 'Active Projects'],
            ['8', 'Messages'],
            ['15', 'Saved Contractors'],
            ['3', 'Project Invites'],
          ].map(([n, label]) => (
            <div key={label} className="dash__card">
              <strong>{n}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="dash__table">
          <div className="dash__table-head">Recent Projects</div>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.loc}</td>
                  <td>{r.due}</td>
                  <td>
                    <span className={`pill pill--${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="container how__grid">
        <div className="how__visual">
          <Dashboard />
        </div>
        <div className="how__copy">
          <p className="eyebrow">How It Works</p>
          <h1 className="h2">How CrewUp Works</h1>
          <p className="lead">
            Whether you&apos;re hiring crew or looking for your next job, CrewUp makes
            connecting simple, fast, and reliable.
          </p>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n} className="steps__item">
                <span className="steps__num">{s.n}</span>
                <span className="steps__icon">{s.icon}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
