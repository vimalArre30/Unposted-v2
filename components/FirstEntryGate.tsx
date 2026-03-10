'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getMoodColor } from '@/lib/moodColors'

interface Props {
  moodWord?: string | null
  onDismiss: () => void
}

export default function FirstEntryGate({ moodWord, onDismiss }: Props) {
  const router = useRouter()
  const leafColor = getMoodColor(moodWord ?? '')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {/* Animated checkmark */}
        <div className="mb-5">
          <AnimatedCheckmark />
        </div>

        {/* Leaf on branch — feels like their entry is alive */}
        <div className="mb-7">
          <MoodLeaf color={leafColor} />
        </div>

        {/* Copy */}
        <h1 className="mb-3 text-[1.6rem] font-bold leading-snug" style={{ color: '#1E3A1F' }}>
          Your first entry is in.
        </h1>
        <p className="mb-10 max-w-[260px] text-sm leading-relaxed text-gray-400">
          To keep it — and everything you share next — sign up. It takes 20 seconds.
        </p>

        {/* CTAs */}
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <button
            onClick={() => router.push('/account')}
            className="w-full rounded-full py-4 text-sm font-medium text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: '#1E3A1F' }}
          >
            Save my entries →
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >
            Not now
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AnimatedCheckmark() {
  return (
    <>
      <style>{`
        @keyframes checkCircleIn {
          from { transform: scale(0.65); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0;  }
        }
        .check-circle-anim {
          animation: checkCircleIn 0.3s ease-out forwards;
          transform-origin: 36px 36px;
        }
        .check-path-anim {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck 0.6s ease-out 0.25s forwards;
        }
      `}</style>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle className="check-circle-anim" cx="36" cy="36" r="32" fill="#EBF3EB" />
        <circle cx="36" cy="36" r="32" stroke="#4A7C59" strokeWidth="1.8" opacity="0.35" />
        <path
          className="check-path-anim"
          d="M22 36l10 10 18-18"
          stroke="#1E3A1F"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  )
}

function MoodLeaf({ color }: { color: string }) {
  return (
    <svg width="54" height="62" viewBox="0 0 54 62" fill="none">
      {/* Trunk */}
      <path d="M27 62V36" stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round" />
      {/* Branch */}
      <path d="M27 48C27 48 18 44 14 38" stroke="#A8C5A0" strokeWidth="1.6" strokeLinecap="round" />
      {/* Leaf */}
      <ellipse cx="10" cy="34" rx="10" ry="7" fill={color} opacity="0.88"
        transform="rotate(18 10 34)" />
      {/* Leaf vein */}
      <path d="M16 31C13 33 10 35 6 36" stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  )
}
