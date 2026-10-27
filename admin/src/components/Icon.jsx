// Same outline-icon style as the main CrewUp app, kept as its own small copy
// here since this is a separate standalone app with no shared package.
const PATHS = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.46-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.6" />
      <path d="M16.5 14.3c2.5.4 4 2.1 4 4.7" />
    </>
  ),
  folder: (
    <path d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h3.59a1.5 1.5 0 0 1 1.06.44L11.5 7.9a1.5 1.5 0 0 0 1.06.44H18.5A1.5 1.5 0 0 1 20 9.84V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7.5Z" />
  ),
  fileText: (
    <>
      <path d="M7 3.5h7l4 4V19.5a1.3 1.3 0 0 1-1.3 1.3H7A1.3 1.3 0 0 1 5.7 19.5V4.8A1.3 1.3 0 0 1 7 3.5Z" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H9" />
      <path d="M14.5 8 19 12l-4.5 4" />
      <path d="M19 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </>
  ),
  shield: (
    <path d="M12 3.5 5 6v5.5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6l-7-2.5Z" />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.8 9.8c0-1.1-1.1-2-2.8-2-1.6 0-2.8.9-2.8 2 0 2.6 5.6 1.3 5.6 3.9 0 1.1-1.2 2-2.8 2s-2.8-.9-2.8-2" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 18 5M15.5 7.5 18 5l2 2-2.5 2.5M14 9l2 2" />
    </>
  ),
}

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  const body = PATHS[name]
  if (!body) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {body}
    </svg>
  )
}
