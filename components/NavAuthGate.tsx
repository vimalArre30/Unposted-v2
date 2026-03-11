'use client'

import { motion } from 'framer-motion'

interface Props {
  tabName: string | null
  onSignUp: () => void
  onDismiss: () => void
}

const HEADINGS: Record<string, string> = {
  garden:    'Your tree is waiting to grow.',
  timeline:  'Your story is starting to take shape.',
  entries:   'Your entries are ready to be saved.',
  list:      'Your entries are ready to be saved.',
  checklist: 'Your entries are ready to be saved.',
}
const DEFAULT_HEADING = 'Your tree is waiting.'
const SUBCOPY = 'Sign up to save your entries and watch your garden grow.'

export default function NavAuthGate({ tabName, onSignUp, onDismiss }: Props) {
  const heading = (tabName && HEADINGS[tabName]) ?? DEFAULT_HEADING

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-8 text-center">
        {/* Sapling illustration */}
        <div className="mb-8">
          <SaplingIllustration />
        </div>

        {/* Copy */}
        <h2 className="mb-3 text-xl font-semibold" style={{ color: '#2A5C2E' }}>
          {heading}
        </h2>
        <p
          className="mb-10 max-w-[260px] text-sm text-gray-500"
          style={{ lineHeight: 1.65 }}
        >
          {SUBCOPY}
        </p>

        {/* CTAs */}
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <button
            onClick={onSignUp}
            className="w-full rounded-full py-4 text-sm font-medium text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: '#1E3A1F' }}
          >
            Sign up — it&apos;s free →
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Not now
          </button>
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <a href="/auth/login" className="text-green-700 underline underline-offset-2">
              Log in
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function SaplingIllustration() {
  return (
    <svg width="88" height="124" viewBox="0 0 88 124" fill="none">
      {/* Ground */}
      <ellipse cx="44" cy="120" rx="34" ry="6" fill="#DFF0D8" />

      {/* Trunk */}
      <path
        d="M43 120 C43 110 41 98 41 86 L47 86 C47 98 45 110 45 120 Z"
        fill="#3A2010"
      />
      <rect x="42" y="72" width="4" height="16" rx="1.5" fill="#3A2010" />

      {/* Left branch */}
      <path d="M42 92 Q26 82 18 70" stroke="#3A2010" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Right branch */}
      <path d="M46 82 Q62 72 70 60" stroke="#3A2010" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Left branch leaf */}
      <g transform="rotate(18 15 66)">
        <ellipse cx="15" cy="66" rx="11" ry="15" fill="#A8D8A8" opacity="0.92" />
        <line x1="15" y1="52" x2="15" y2="80" stroke="rgba(0,0,0,0.1)" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Right branch leaf */}
      <g transform="rotate(-22 72 56)">
        <ellipse cx="72" cy="56" rx="11" ry="15" fill="#66BB6A" opacity="0.92" />
        <line x1="72" y1="42" x2="72" y2="70" stroke="rgba(0,0,0,0.1)" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Top cluster */}
      <ellipse cx="44" cy="60" rx="13" ry="16" fill="#4CAF50" opacity="0.9" />
      <line x1="44" y1="45" x2="44" y2="75" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="30" cy="67" rx="10" ry="12" fill="#81C784" opacity="0.85" />
      <ellipse cx="58" cy="67" rx="10" ry="12" fill="#81C784" opacity="0.85" />
      <ellipse cx="44" cy="48" rx="8"  ry="10" fill="#A5D6A7" opacity="0.85" />
    </svg>
  )
}
