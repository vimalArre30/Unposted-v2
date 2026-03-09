'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LifeTree, { type LeafEntry } from '@/components/LifeTree'
import LeafSheet from '@/components/LeafSheet'
import GrowthCarousel from '@/components/GrowthCarousel'
import SavePrompt from '@/components/SavePrompt'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'

interface FingerprintData {
  relationship_contexts?: string[]
}

// Static particle config — computed once, stable across renders
const PARTICLES = [
  { left: '12%',  bottom: '8%',  dur: '18s', delay: '0s',   size: 10 },
  { left: '72%',  bottom: '14%', dur: '23s', delay: '6s',   size: 8  },
  { left: '38%',  bottom: '5%',  dur: '20s', delay: '11s',  size: 7  },
  { left: '58%',  bottom: '20%', dur: '25s', delay: '3s',   size: 9  },
]

function AmbientParticles() {
  return (
    <>
      {PARTICLES.map((p, i) => (
        <svg
          key={i}
          className="garden-particle"
          style={{ left: p.left, bottom: p.bottom, animationDuration: p.dur, animationDelay: p.delay, width: p.size, height: p.size + 4 }}
          viewBox="0 0 10 14"
        >
          <ellipse cx="5" cy="7" rx="5" ry="7" fill="#4A9C4A" opacity="0.7" />
        </svg>
      ))}
    </>
  )
}

function getStageLabel(count: number): string {
  if (count === 0) return ''
  if (count <= 6) return 'Your sapling 🌱'
  if (count <= 15) return 'Your plant 🌿'
  if (count <= 35) return 'Your tree 🌳'
  return 'Your ancient tree 🌲'
}

export default function GardenPage() {
  const router = useRouter()
  const supabase = createClient()
  const { isAnonymous, isLoading: sessionLoading } = useSession()
  const [entries, setEntries] = useState<LeafEntry[] | null>(null)
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LeafEntry | null>(null)
  const [showCarousel, setShowCarousel] = useState(false)

  useEffect(() => {
    fetch('/api/entries/list')
      .then((r) => r.json())
      .then((data: { entries: LeafEntry[] }) => {
        setEntries(data.entries ?? [])
        if ((data.entries ?? []).length === 0) {
          const seen = localStorage.getItem('hasSeenCarousel')
          if (!seen) setShowCarousel(true)
        }
      })
      .catch(() => setEntries([]))

    // Fetch fingerprint for branch spread
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('emotion_fingerprint')
        .select('relationship_contexts')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => { if (data) setFingerprint(data) })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCloseCarousel() {
    localStorage.setItem('hasSeenCarousel', '1')
    setShowCarousel(false)
  }

  useEffect(() => {
    if (!sessionLoading && isAnonymous) {
      setShowSavePrompt(true)
    }
  }, [sessionLoading, isAnonymous])

  if (entries === null) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F0F7F0' }}>
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
      </div>
    )
  }

  const stageLabel = getStageLabel(entries.length)

  return (
    <div
      className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 pb-28 pt-12"
      style={{ background: '#F0F7F0' }}
    >
      {/* Ambient floating particles */}
      <AmbientParticles />

      {showSavePrompt && <SavePrompt onDismiss={() => setShowSavePrompt(false)} />}
      {showCarousel && <GrowthCarousel onClose={handleCloseCarousel} />}

      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-semibold text-green-800">🌿 Your garden</h1>
        <button
          onClick={() => setShowCarousel(true)}
          aria-label="How the garden works"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-sm text-gray-400 hover:text-gray-700"
        >
          ?
        </button>
      </div>

      <div className="mt-6 flex w-full items-center justify-center">
        <LifeTree
          entries={entries}
          totalEntries={entries.length}
          onLeafTap={(entry) => setSelectedEntry(entry)}
          fingerprint={fingerprint}
        />
      </div>

      <LeafSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} />

      {stageLabel && (
        <div className="mt-4 text-center">
          <p className="text-base font-medium text-gray-700">{stageLabel}</p>
          <p className="mt-1 text-sm text-gray-400">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => router.push('/')}
        aria-label="Record an entry"
        className="fixed bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-2xl shadow-lg transition-transform active:scale-95"
      >
        ✏️
      </button>
    </div>
  )
}
