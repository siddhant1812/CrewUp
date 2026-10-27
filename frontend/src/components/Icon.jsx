// Shared outline icon set — one <svg> per name, same stroke style throughout
// the app (24x24 viewbox, round caps/joins, currentColor), so every icon
// reads as part of one consistent system instead of mixed styles.

const PATHS = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  folder: (
    <path d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h3.59a1.5 1.5 0 0 1 1.06.44L11.5 7.9a1.5 1.5 0 0 0 1.06.44H18.5A1.5 1.5 0 0 1 20 9.84V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7.5Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </>
  ),
  message: (
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-8Z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.46-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.6" />
      <path d="M16.5 14.3c2.5.4 4 2.1 4 4.7" />
    </>
  ),
  card: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 11.64 2.5V2.4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56h.08a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08c.26.72.84 1.26 1.56 1.46" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H9" />
      <path d="M14.5 8 19 12l-4.5 4" />
      <path d="M19 12H9" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3.5" width="10" height="17" rx="1" />
      <path d="M8.5 7.5h.01M11.5 7.5h.01M8.5 11h.01M11.5 11h.01M8.5 14.5h.01M11.5 14.5h.01" />
      <path d="M15 10.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-3" />
    </>
  ),
  industry: (
    <>
      <path d="M4 20V11l4.5 3V11l4.5 3V11l4.5 3v6Z" />
      <path d="M4 20h17" />
      <path d="M9 8V5M13.5 8V5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6.5 3.5h11M6.5 20.5h11" />
      <path d="M7.5 3.5v2.3a5 5 0 0 0 2.2 4.15L12 11.5l2.3-1.55a5 5 0 0 0 2.2-4.15V3.5" />
      <path d="M7.5 20.5v-2.3a5 5 0 0 1 2.2-4.15L12 12.5l2.3 1.55a5 5 0 0 1 2.2 4.15v2.3" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M14.8 9.8c0-1.1-1.1-2-2.8-2-1.6 0-2.8.9-2.8 2 0 2.6 5.6 1.3 5.6 3.9 0 1.1-1.2 2-2.8 2s-2.8-.9-2.8-2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  fileText: (
    <>
      <path d="M7 3.5h7l4 4V19.5a1.3 1.3 0 0 1-1.3 1.3H7A1.3 1.3 0 0 1 5.7 19.5V4.8A1.3 1.3 0 0 1 7 3.5Z" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.3M12 8.2v.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
}

export default function Icon({ name, size = 18, strokeWidth = 1.7, className = '' }) {
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
