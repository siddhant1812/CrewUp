import { Link } from 'react-router-dom'

export default function FooterCta() {
  return (
    <section className="footer-cta" id="resources">
      <div className="container footer-cta__row">
        <div className="footer-cta__copy">
          <h2>Ready To Build Better Together?</h2>
          <p>
            Join thousands of contractors and subcontractors using CrewUp to find work,
            fill crews, and grow lasting partnerships.
          </p>
        </div>
        <div className="footer-cta__actions">
          <Link to="/#find-work" className="btn btn-white btn-lg">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12.2 12.2L15.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Find Work
          </Link>
          <Link to="/dashboard/find-contractors" className="btn btn-ghost-light btn-lg">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2.5 14.5c0-2.2 1.8-4 4-4 .85 0 1.64.3 2.26.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9.7 11.4A3.9 3.9 0 0 1 12 10.5c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Find Contractors
          </Link>
        </div>
      </div>
    </section>
  )
}
