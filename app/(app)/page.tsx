'use client'

import { useRouter } from 'next/navigation'

const MODES = [
  {
    id: 'life-stories',
    label: 'Life Stories',
    sub: 'A memory worth keeping',
  },
  {
    id: 'feeling-now',
    label: 'Feeling Right Now',
    sub: "What's alive in you",
  },
  {
    id: 'past-event',
    label: 'Something That Happened',
    sub: 'An event that stayed with you',
  },
  {
    id: 'future-event',
    label: 'Something Coming Up',
    sub: "What's ahead and what it stirs",
  },
  {
    id: 'vent',
    label: 'Just Vent',
    sub: 'No questions. Just you.',
  },
] as const

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

function LeafIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-700"
    >
      <path d="M2 22 C2 22 8 16 12 12 C16 8 22 2 22 2 C22 2 16 4 12 8 C8 12 4 18 2 22Z" />
      <path d="M12 12 L7 17" />
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-12">
      {/* Wordmark + leaf */}
      <div className="flex items-center gap-2 mb-1">
        <LeafIcon />
        <span className="text-lg font-semibold tracking-tight text-gray-900">
          unposted
        </span>
      </div>

      {/* Greeting */}
      <p className="mt-6 text-3xl font-semibold text-gray-900 leading-tight">
        {getGreeting()}
        <br />
        <span className="text-gray-400 font-normal text-2xl">
          What do you want to explore?
        </span>
      </p>

      {/* Mode cards */}
      <div className="mt-8 flex flex-col gap-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => router.push(`/record?mode=${mode.id}`)}
            className="w-full rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-green-200 hover:shadow-md"
          >
            <p className="text-base font-medium text-gray-900">{mode.label}</p>
            <p className="mt-0.5 text-sm text-gray-400">{mode.sub}</p>
          </button>
        ))}
      </div>

      {/* Quote badge */}
      <div className="mt-auto pt-10">
        <div className="rounded-2xl bg-green-50 px-5 py-4">
          <p className="text-sm text-green-800 leading-relaxed italic">
            &quot;The act of writing is the act of discovering what you believe.&quot;
          </p>
          <p className="mt-1.5 text-xs text-green-600">— David Hare</p>
        </div>
      </div>
    </div>
  )
}
