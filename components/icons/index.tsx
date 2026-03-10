// Unposted icon set — thin stroke, rounded linecaps, forest green identity
// All icons accept optional `size` and `active` props

interface IconProps {
  active?: boolean
  size?: number
  className?: string
}

export function HomeIcon({ active = false, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
      <path d="M9 21V13h6v8" />
    </svg>
  )
}

export function EntriesIcon({ active = false, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  )
}

export function GardenIcon({ active = false, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22V12" />
      <path d="M12 12C12 12 6 10 4 4c4 0 8 2 8 8z" />
      <path d="M12 12C12 12 18 10 20 4c-4 0-8 2-8 8z" />
      <path d="M12 16C12 16 8 14 6 10c3 0 6 2 6 6z" />
    </svg>
  )
}

export function ChecklistIcon({ active = false, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.5 12l2.5 2.5L15.5 9" />
    </svg>
  )
}

export function ShareIcon({ active = false, size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className={className}>
      <text x="12" y="17.5" textAnchor="middle" fontSize="17"
        fontWeight={active ? '700' : '400'} stroke="none">✦</text>
    </svg>
  )
}

export function MicIcon({ size = 24, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3M9 22h6" />
    </svg>
  )
}

export function BackIcon({ size = 20, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

export function CloseIcon({ size = 18, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function LeafIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 22C2 22 8 16 12 12C16 8 22 2 22 2C22 2 16 4 12 8C8 12 4 18 2 22Z" />
      <path d="M12 12L7 17" />
    </svg>
  )
}

// ── Mode-specific icons ──────────────────────────────────────────────────────

export function MemoryIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6M9 11h5" />
    </svg>
  )
}

export function PulseIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12h4l3-8 4 16 3-8h6" />
    </svg>
  )
}

export function ClockIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function ForwardIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function VentIcon({ size = 22, className }: Omit<IconProps, 'active'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8c2-3 6-4 9-2s4 6 1 8-7 1-8 4" />
      <path d="M6 16c1-2 4-3 6-2" />
      <path d="M3 20h2" />
    </svg>
  )
}
