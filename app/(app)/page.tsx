'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/gtag'
import StreakWidget from '@/components/StreakWidget'
import {
  LeafIcon, MemoryIcon, PulseIcon, ClockIcon, ForwardIcon, VentIcon,
} from '@/components/icons'

const MODES = [
  {
    id: 'life-stories',
    label: 'Life Stories',
    sub: 'A memory worth keeping',
    bg: 'rgba(255, 248, 238, 0.9)',
    iconColor: '#b45309',
    Icon: MemoryIcon,
  },
  {
    id: 'feeling-now',
    label: 'Feeling Right Now',
    sub: "What's alive in you",
    bg: 'rgba(232, 245, 232, 0.9)',
    iconColor: '#2d6a36',
    Icon: PulseIcon,
  },
  {
    id: 'past-event',
    label: 'Something That Happened',
    sub: 'An event that stayed with you',
    bg: 'rgba(235, 242, 255, 0.9)',
    iconColor: '#2b4aab',
    Icon: ClockIcon,
  },
  {
    id: 'future-event',
    label: 'Something Coming Up',
    sub: "What's ahead and what it stirs",
    bg: 'rgba(244, 240, 255, 0.9)',
    iconColor: '#5b3e9b',
    Icon: ForwardIcon,
  },
  {
    id: 'vent',
    label: 'Just Vent',
    sub: 'No questions. Just you.',
    bg: 'rgba(255, 240, 240, 0.9)',
    iconColor: '#b54040',
    Icon: VentIcon,
  },
] as const

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

type StreakData = { current_streak: number; week_days: boolean[]; total_entries: number }

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entryCount, setEntryCount] = useState<number | null>(null)
  const [streakData, setStreakData] = useState<StreakData | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      fetch('/api/referral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: ref }),
      }).catch(() => {})
    }

    fetch('/api/entries/list')
      .then((r) => r.json())
      .then((data) => setEntryCount(data.entries?.length ?? 0))
      .catch(() => setEntryCount(0))

    fetch('/api/streak')
      .then((r) => r.json())
      .then((data) => setStreakData(data))
      .catch(() => {})
  }, [searchParams])

  useEffect(() => {
    if (streakData === null) return
    trackEvent('home_viewed', {
      personalisation_active: (entryCount ?? 0) >= 3,
      streak_length: streakData.current_streak,
    })
  }, [streakData, entryCount])

  return (
    <div className="flex min-h-screen flex-col pb-24">

      {/* Hero band — sage → cream gradient */}
      <div className="hero-gradient px-6 pb-6 pt-12">
        {/* Wordmark row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <LeafIcon size={20} className="text-moss" />
            <span className="text-base font-semibold tracking-wide text-forest">
              unposted
            </span>
          </div>
          {entryCount !== null && entryCount > 0 && (
            <Link
              href="/entries"
              className="text-xs text-gray-400 hover:text-moss transition-colors rounded-full bg-white/70 px-3 py-1 shadow-card"
            >
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </Link>
          )}
        </div>

        {/* Greeting */}
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-gray-900">
          {getGreeting()}
          <br />
          <span className="text-gray-400 font-normal text-2xl leading-relaxed">
            What&apos;s alive in you today?
          </span>
        </h1>

        {/* Streak — woven into hero */}
        {streakData && (
          <div className="mt-6">
            <StreakWidget
              streak={streakData.current_streak}
              weekDays={streakData.week_days}
              totalEntries={streakData.total_entries}
            />
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div className="px-5 mt-2 flex flex-col gap-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => { trackEvent('mode_selected', { mode: mode.id }); router.push(`/record?mode=${mode.id}`) }}
            className="w-full rounded-[20px] px-5 py-4 text-left transition-all duration-150 active:scale-[0.98] hover:shadow-soft min-h-[44px]"
            style={{
              backgroundColor: mode.bg,
              boxShadow: '0 2px 14px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: mode.iconColor }}>
                <mode.Icon size={20} />
              </span>
              <div>
                <p className="text-base font-medium text-gray-900 leading-snug">{mode.label}</p>
                <p className="mt-0.5 text-sm text-gray-400">{mode.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quote badge */}
      <div className="mt-auto px-5 pt-8 pb-2">
        <div className="rounded-[20px] bg-white/60 px-5 py-4 shadow-card">
          <p className="text-sm text-gray-500 leading-relaxed italic">
            &quot;The act of writing is the act of discovering what you believe.&quot;
          </p>
          <p className="mt-1.5 text-xs text-moss">— David Hare</p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-moss" />
        </div>
      }
    >
      <HomePageInner />
    </Suspense>
  )
}
