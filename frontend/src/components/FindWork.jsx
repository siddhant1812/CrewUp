const FEATURES = [
  'Search by trade',
  'Search by location',
  'Direct contractor messaging',
  'Company profiles',
  'Project alerts',
  'Mobile friendly',
]

const IMG =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1100&q=80'

export default function FindWork() {
  return (
    <section className="section find-work" id="find-work">
      <div className="container find-work__grid">
        <div className="find-work__media">
          <img
            src={IMG}
            alt="Construction worker reviewing blueprints on a job site"
            width="560"
            height="420"
          />
        </div>
        <div className="find-work__copy">
          <p className="eyebrow eyebrow-light">Find Work</p>
          <h2 className="h2 h2-light">Find Your Next Opportunity</h2>
          <p className="lead lead-light">
            Browse projects that match your trade, location, and schedule — then connect
            directly with general contractors who need your skills.
          </p>
          <ul className="check-grid">
            {FEATURES.map((f) => (
              <li key={f}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="8" fill="rgba(77,148,255,0.2)" stroke="#5B9BFF" strokeWidth="1.2" />
                  <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#8FBAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <a href="#browse-jobs" className="btn btn-primary btn-lg">Browse Jobs</a>
        </div>
      </div>
    </section>
  )
}
