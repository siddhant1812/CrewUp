export default function Logo({ className = '', markSize = 32, showText = true }) {
  return (
    <span className={`logo ${className}`.trim()}>
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 3.5A12.5 12.5 0 1 0 28.5 16"
          stroke="#0B1B33"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M16 8.5A7.5 7.5 0 1 0 23.5 16V9.5"
          stroke="#0066FF"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="9.5" r="2.2" fill="#0066FF" />
      </svg>
      {showText && <span className="logo__text">CREWUP</span>}
    </span>
  )
}
