'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/gtag'

interface MoodOption {
  label: string
  emoji: string
  bg: string
  selectedBg: string
  textColor: string
}

const MOODS: MoodOption[] = [
  { label: 'Joyful',    emoji: '🌟', bg: 'rgba(255,243,196,0.45)', selectedBg: 'rgba(255,243,196,0.9)',  textColor: '#92400e' },
  { label: 'Grateful',  emoji: '🤍', bg: 'rgba(255,228,225,0.45)', selectedBg: 'rgba(255,228,225,0.9)',  textColor: '#9f1239' },
  { label: 'Love',      emoji: '💚', bg: 'rgba(232,248,232,0.45)', selectedBg: 'rgba(232,248,232,0.9)',  textColor: '#166534' },
  { label: 'Peaceful',  emoji: '🌿', bg: 'rgba(224,240,224,0.45)', selectedBg: 'rgba(224,240,224,0.9)',  textColor: '#14532d' },
  { label: 'Energetic', emoji: '⚡', bg: 'rgba(255,240,214,0.45)', selectedBg: 'rgba(255,240,214,0.9)',  textColor: '#92400e' },
  { label: 'Focused',   emoji: '🎯', bg: 'rgba(224,238,255,0.45)', selectedBg: 'rgba(224,238,255,0.9)',  textColor: '#1e40af' },
  { label: 'Sad',       emoji: '🌧', bg: 'rgba(224,234,245,0.45)', selectedBg: 'rgba(224,234,245,0.9)',  textColor: '#1e3a5f' },
  { label: 'Worried',   emoji: '😶', bg: 'rgba(240,240,245,0.45)', selectedBg: 'rgba(240,240,245,0.9)',  textColor: '#374151' },
  { label: 'Angry',     emoji: '🔥', bg: 'rgba(255,232,232,0.45)', selectedBg: 'rgba(255,232,232,0.9)',  textColor: '#991b1b' },
  { label: 'Stressed',  emoji: '🌀', bg: 'rgba(240,232,255,0.45)', selectedBg: 'rgba(240,232,255,0.9)',  textColor: '#6b21a8' },
  { label: 'Exhausted', emoji: '🍂', bg: 'rgba(245,237,224,0.45)', selectedBg: 'rgba(245,237,224,0.9)',  textColor: '#78350f' },
  { label: 'Fearful',   emoji: '🌑', bg: 'rgba(232,232,240,0.45)', selectedBg: 'rgba(232,232,240,0.9)',  textColor: '#1e1b4b' },
]

function MoodPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [selected, setSelected] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { trackEvent('mood_check_reached') }, [])

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
    trackEvent('session_completed', { mood: selected! })
    router.push(`/record/done?entryId=${entryId}`)
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-12 pt-14 items-center bg-wave">

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold leading-snug text-gray-900">
          How do you feel after sharing?
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          This shapes the colour of your leaf.
        </p>
      </motion.div>

      {/* Mood grid */}
      <div className="mt-8 grid grid-cols-3 gap-2.5 w-full">
        {MOODS.map(({ label, emoji, bg, selectedBg, textColor }) => {
          const isSelected = selected === label
          return (
            <button
              key={label}
              onClick={() => { setSelected(label); trackEvent('mood_selected', { mood: label }) }}
              className="mood-pill relative flex flex-col items-center gap-1.5 rounded-[18px] px-2 py-4 overflow-hidden min-h-[44px]"
              style={{
                backgroundColor: isSelected ? selectedBg : bg,
                border: `1.5px solid ${isSelected ? `${textColor}40` : 'transparent'}`,
                boxShadow: isSelected ? `0 4px 16px ${textColor}18` : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {/* Selection ripple */}
              {isSelected && (
                <motion.span
                  className="absolute inset-0 rounded-[18px]"
                  style={{ backgroundColor: `${textColor}08` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              )}
              <span className="relative z-10 text-xl leading-none">{emoji}</span>
              <span
                className="relative z-10 text-xs font-medium"
                style={{ color: isSelected ? textColor : '#6b7280' }}
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
      <motion.button
        onClick={handleDone}
        disabled={!selected || isSubmitting}
        animate={{ backgroundColor: selected ? '#2A5C2E' : '#d1d5db' }}
        transition={{ duration: 0.3 }}
        className="mt-8 w-full rounded-full py-4 text-base font-medium text-white transition-opacity disabled:opacity-60 min-h-[44px]"
        style={{ boxShadow: selected ? '0 0 20px rgba(74,124,89,0.25)' : 'none' }}
      >
        {isSubmitting ? 'Saving…' : 'Done'}
      </motion.button>
    </div>
  )
}

export default function MoodPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-wave">
          <div className="h-2 w-2 animate-pulse rounded-full bg-moss" />
        </div>
      }
    >
      <MoodPageInner />
    </Suspense>
  )
}
