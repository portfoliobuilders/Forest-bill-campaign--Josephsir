type IconProps = {
  className?: string
}

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconPencil({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 20h4.2L19.2 9l-4.2-4.2L4 15.8V20Z" />
      <path {...stroke} d="m13.2 6.6 4.2 4.2" />
    </svg>
  )
}

export function IconChevronRight({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function IconClock({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconPeople({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="9" cy="8" r="2.4" />
      <path {...stroke} d="M4.5 18c.4-2.8 2.4-4.3 4.5-4.3s4.1 1.5 4.5 4.3" />
      <circle {...stroke} cx="16.5" cy="8.5" r="2" />
      <path {...stroke} d="M15 13.8c1.7.2 3.3 1.4 3.7 4.2" />
    </svg>
  )
}

export function IconList({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M8 7h12M8 12h12M8 17h12" />
      <path {...stroke} d="M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  )
}

export function IconPerson({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="12" cy="8" r="2.6" />
      <path {...stroke} d="M6 18.5c.5-3.2 2.8-5 6-5s5.5 1.8 6 5" />
    </svg>
  )
}

export function IconPlane({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M3 11.5 21 4 14 21l-2.8-6.2L3 11.5Z" />
    </svg>
  )
}

export function IconCheck({ className = 'size-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="m5 12 5 5 9-10" />
    </svg>
  )
}

export function IconEnvelope({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...stroke} x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path {...stroke} d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function IconCopy({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...stroke} x="8" y="8" width="11" height="12" rx="1.5" />
      <path {...stroke} d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v12A1.5 1.5 0 0 0 5.5 19H8" />
    </svg>
  )
}

export function IconInfo({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="M12 11v5.5" />
      <path {...stroke} d="M12 8h.01" />
    </svg>
  )
}

export function IconGmail({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M2.5 6.4v11.2A2.4 2.4 0 0 0 4.9 20h1.7V11l5.4 4 5.4-4v9h1.7a2.4 2.4 0 0 0 2.4-2.4V6.4L12 13.2 2.5 6.4Z" />
      <path fill="#34A853" d="M19.1 4H16L12 7.2 8 4H4.9A2.4 2.4 0 0 0 2.5 6.4V7l9.5 6.8L21.5 7v-.6A2.4 2.4 0 0 0 19.1 4Z" />
      <path fill="#FBBC04" d="M2.5 6.4A2.4 2.4 0 0 1 4.9 4H8v3.2L2.5 7v-.6Z" />
      <path fill="#4285F4" d="M21.5 6.4V7l-5.5.2V4h2.1a2.4 2.4 0 0 1 2.4 2.4Z" />
    </svg>
  )
}

export function IconMic({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...stroke} x="9" y="3.5" width="6" height="11" rx="3" />
      <path {...stroke} d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5" />
    </svg>
  )
}

export function IconSpeaker({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 9.5h3.2L12 5.5v13l-4.8-4H4V9.5Z" />
      <path {...stroke} d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7 7 0 0 1 0 10" />
    </svg>
  )
}

export function IconSparkle({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9 12 3.5Z" />
      <path {...stroke} d="M18 15.5 18.6 17.4 20.5 18 18.6 18.6 18 20.5 17.4 18.6 15.5 18 17.4 17.4 18 15.5Z" />
    </svg>
  )
}

export function IconPause({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M8 6h2.8v12H8zM13.2 6H16v12h-2.8z" />
    </svg>
  )
}

export function IconStop({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...stroke} x="6.5" y="6.5" width="11" height="11" rx="1" />
    </svg>
  )
}

export function IconPlay({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="m8 6 11 6-11 6V6Z" />
    </svg>
  )
}
