import { useEffect, useState } from 'react'

export const COUNTRY_CODES = [
  { code: '+1', label: 'US / Canada' },
  { code: '+91', label: 'India' },
  { code: '+44', label: 'United Kingdom' },
  { code: '+61', label: 'Australia' },
  { code: '+971', label: 'UAE' },
  { code: '+49', label: 'Germany' },
  { code: '+33', label: 'France' },
  { code: '+81', label: 'Japan' },
  { code: '+86', label: 'China' },
  { code: '+65', label: 'Singapore' },
  { code: '+92', label: 'Pakistan' },
  { code: '+880', label: 'Bangladesh' },
  { code: '+94', label: 'Sri Lanka' },
  { code: '+977', label: 'Nepal' },
  { code: '+27', label: 'South Africa' },
  { code: '+234', label: 'Nigeria' },
  { code: '+55', label: 'Brazil' },
  { code: '+52', label: 'Mexico' },
]

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export function formatLocal10(digits) {
  const d = digitsOnly(digits).slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export function composePhone(countryCode, localDigits) {
  const d = digitsOnly(localDigits).slice(0, 10)
  if (!d) return ''
  return `${countryCode}${d}`
}

export function parsePhone(value, preferredCode) {
  const raw = String(value || '').trim()
  if (!raw) return { countryCode: preferredCode || '+1', local: '' }

  const compact = raw.startsWith('+')
    ? `+${digitsOnly(raw)}`
    : digitsOnly(raw)

  const codes = COUNTRY_CODES.map((c) => c.code).sort((a, b) => b.length - a.length)

  if (preferredCode && compact.startsWith(preferredCode)) {
    return {
      countryCode: preferredCode,
      local: digitsOnly(compact.slice(preferredCode.length)).slice(0, 10),
    }
  }

  if (compact.startsWith('+')) {
    for (const code of codes) {
      if (compact.startsWith(code)) {
        return {
          countryCode: code,
          local: digitsOnly(compact.slice(code.length)).slice(0, 10),
        }
      }
    }
  }

  const all = digitsOnly(compact)
  return { countryCode: preferredCode || '+1', local: all.slice(-10) }
}

export function isValidPhone(value) {
  if (!String(value || '').trim()) return true
  return parsePhone(value).local.length === 10
}

export default function PhoneInput({ value, onChange, id, required = false }) {
  const [country, setCountry] = useState(() => parsePhone(value).countryCode)
  const parsed = parsePhone(value, country)
  const display = formatLocal10(parsed.local)

  useEffect(() => {
    const next = parsePhone(value)
    if (value) setCountry(next.countryCode)
    const canonical = composePhone(next.countryCode, next.local)
    if (canonical && canonical !== String(value || '')) onChange(canonical)
  }, [value, onChange])

  function changeCountry(code) {
    setCountry(code)
    onChange(composePhone(code, parsed.local))
  }

  function setLocal(next) {
    onChange(composePhone(country, digitsOnly(next).slice(0, 10)))
  }

  return (
    <div className="phone-input">
      <select
        aria-label="Country code"
        value={country}
        onChange={(e) => changeCountry(e.target.value)}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.label}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(555) 123-4567"
        value={display}
        required={required}
        maxLength={14}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  )
}
