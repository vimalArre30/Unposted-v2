'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const MOODS: { label: string; emoji: string }[] = [
  { label: 'Joyful',    emoji: '🌟' },
  { label: 'Grateful',  emoji: '🤍' },
  { label: 'Love',      emoji: '💚' },
  { label: 'Peaceful',  emoji: '🌿' },
  { label: 'Energetic', emoji: '⚡' },
  { label: 'Focused',   emoji: '🎯' },
  { label: 'Sad',       emoji: '🌧' },
  { label: 'Worried',   emoji: '😶' },
  { label: 'Angry',     emoji: '🔥' },
  { label: 'Stressed',  emoji: '🌀' },
  { label: 'Exhausted', emoji: '🍂' },
  { label: 'Fearful',   emoji: '🌑' },
]

function MoodPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [selected, setSelected] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDone() {
    if (!selected || !sessionId || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const res = await fetch('/api/entries/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, mood: selected }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
      return
    }

    const { entryId } = await res.json()
    router.push(`/record/done?entryId=${entryId}`)
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-16 items-center">
      {/* Heading */}
      <h1 className="text-center text-2xl font-medium leading-snug text-gray-900">
        How do you feel after sharing?
      </h1>
      <p className="mt-2 text-center text-sm text-gray-400">
        This shapes the colour of your leaf.
      </p>

      {/* Mood grid */}
      <div className="mt-10 grid grid-cols-3 gap-3 w-full">
        {MOODS.map(({ label, emoji }) => {
          const isSelected = selected === label
          return (
            <button
              key={label}
              onClick={() => setSelected(label)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3.5 transition-all duration-150 ${
                isSelected
                  ? 'border-green-700 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? 'text-green-800' : 'text-gray-600'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}

      {/* Done button */}
      <button
        onClick={handleDone}
        disabled={!selected || isSubmitting}
        className="mt-10 w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
      >
        {isSubmitting ? 'Saving…' : 'Done'}
      </button>
    </div>
  )
}

export default function MoodPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
        </div>
      }
    >
      <MoodPageInner />
    </Suspense>
  )
}
