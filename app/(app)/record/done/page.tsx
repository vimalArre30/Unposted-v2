'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LifeTree, { type LeafEntry } from '@/components/LifeTree'
import SharePrompt, { shouldShowSharePrompt } from '@/components/SharePrompt'
import ChecklistCard from '@/components/ChecklistCard'
import FirstEntryGate from '@/components/FirstEntryGate'
import AnonPersistBanner from '@/components/AnonPersistBanner'
import { useSession } from '@/hooks/useSession'

function formatFriendlyDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ── Leaf burst confetti ──────────────────────────────────────────────────────

const BURST = [
  { x: -75, y: -105, rotate: 42,  color: '#66BB6A', delay: 0    },
  { x:  55, y: -120, rotate: -28, color: '#A8C5A0', delay: 0.04 },
  { x: 115, y:  -55, rotate:  68, color: '#4CAF50', delay: 0.09 },
  { x:  85, y:   45, rotate: -52, color: '#81C784', delay: 0.03 },
  { x: -38, y:  115, rotate:  32, color: '#A5D6A7', delay: 0.07 },
  { x: -118, y:  28, rotate: -65, color: '#66BB6A', delay: 0.14 },
  { x:  10, y: -130, rotate:  18, color: '#C8E6C9', delay: 0.05 },
  { x: -95, y:  -70, rotate: -40, color: '#4CAF50', delay: 0.11 },
]

function LeafBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {BURST.map((leaf, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 0.95 }}
          animate={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate, scale: 0.25, opacity: 0 }}
          transition={{ duration: 1.9, delay: leaf.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
            <ellipse cx="6.5" cy="8.5" rx="5.5" ry="7.5" fill={leaf.color} opacity="0.88" />
            <path d="M6.5 3 C6.5 8 6.5 13 6.5 16" stroke={leaf.color} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

function SmallLeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2 C12 2 14 6 13 10 C12 13 10 14 8 15 C6 14 4 13 3 10 C2 6 4 2 8 2Z" fill="#66BB6A" />
      <path d="M8 4 C8 8 8 12 8 15" stroke="#388E3C" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function LeafSVG() {
  return (
    <>
      <style>{`
        @keyframes leafGrow {
          from { transform: scale(0.1); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .leaf-grow {
          animation: leafGrow 1s ease-out forwards;
          transform-origin: center bottom;
        }
      `}</style>
      <svg className="leaf-grow" width="96" height="96" viewBox="0 0 96 96" fill="none">
        <path d="M48 88 C48 70 44 56 36 44" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M48 16 C68 16 80 32 76 52 C72 68 60 76 48 80 C36 76 24 68 20 52 C16 32 28 16 48 16Z" fill="#66BB6A" opacity="0.9" />
        <path d="M48 24 C48 44 48 62 48 80" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M48 38 C42 34 34 34 28 38" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 52 C40 46 32 47 26 52" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 38 C54 34 62 34 68 38" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 52 C56 46 64 47 70 52" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    </>
  )
}

// ── Main done page ───────────────────────────────────────────────────────────

function DonePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get('entryId')
  const { isAnonymous } = useSession()

  const [reflection, setReflection] = useState<string | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  const [cardDismissed, setCardDismissed] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [freshEntry, setFreshEntry] = useState<LeafEntry | null>(null)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [burstDone, setBurstDone] = useState(false)
  const [checklist, setChecklist] = useState<{ emotional: string[]; utility: string[] } | null>(null)
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [totalEntries, setTotalEntries] = useState<number | null>(null)
  const [gateDismissed, setGateDismissed] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!entryId) return

    fetch('/api/entries/list')
      .then((r) => r.json())
      .then((data: { entries: LeafEntry[] }) => {
        const entries = data.entries ?? []
        const match = entries.find((e) => e.id === entryId) ?? entries[0] ?? null
        setFreshEntry(match)
        setTotalEntries(entries.length)
        if (entries.length >= 3 && shouldShowSharePrompt()) {
          setShowSharePrompt(true)
        }
      })
      .catch(() => {})

    fetch('/api/entries/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.reflection) setReflection(data.reflection) })
      .catch(() => {})

    // Checklist — independent, fire-and-forget with 6s timeout
    setChecklistLoading(true)
    const checklistTimeout = setTimeout(() => setChecklistLoading(false), 6000)
    fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(checklistTimeout)
        const hasItems = data.emotional?.length > 0 || data.utility?.length > 0
        setChecklist(hasItems ? data : null)
        setChecklistLoading(false)
      })
      .catch(() => {
        clearTimeout(checklistTimeout)
        setChecklistLoading(false)
      })

    const timer = setTimeout(() => setCardVisible(true), 2500)
    const burstTimer = setTimeout(() => setBurstDone(true), 2200)
    return () => { clearTimeout(timer); clearTimeout(burstTimer); clearTimeout(checklistTimeout) }
  }, [entryId])

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }
  }, [])

  function handleSave() {
    setToastVisible(true)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500)
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-10 pt-10 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 38%, #D4EDDA 0%, #EDF7EE 40%, #FDF8F0 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="done-glow" aria-hidden="true" />

      {/* Leaf burst — brief, fades automatically */}
      <AnimatePresence>
        {!burstDone && <LeafBurst />}
      </AnimatePresence>

      {/* Celebration content */}
      <motion.div
        className="flex flex-col items-center gap-4 text-center relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {freshEntry ? (
          <LifeTree entries={[freshEntry]} totalEntries={1} fingerprint={null} />
        ) : (
          <LeafSVG />
        )}
        <h1 className="text-2xl font-semibold text-gray-800 leading-snug">
          Your garden just grew a new leaf.
        </h1>
        <p className="text-sm text-gray-400">{formatFriendlyDate(new Date())}</p>
      </motion.div>

      {/* Action buttons */}
      <div className="relative z-10 mt-12 flex w-full flex-col items-center gap-3">
        <button
          onClick={() => router.push('/garden')}
          className="btn-forest w-full py-4 text-base"
        >
          Go to my garden
        </button>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-700 transition-colors"
        >
          Record another entry
        </button>
      </div>

      {/* Checklist — below action buttons */}
      {checklistLoading && !checklist && (
        <div className="relative z-10 mt-6 w-full rounded-[16px] px-4 py-4"
          style={{ backgroundColor: '#F2F7F2', border: '1px solid #D4E8D4' }}>
          <div className="h-3 w-24 rounded-full bg-gray-200 animate-pulse mb-3" />
          <div className="h-3 w-full rounded-full bg-gray-200 animate-pulse mb-2" />
          <div className="h-3 w-4/5 rounded-full bg-gray-200 animate-pulse" />
        </div>
      )}
      {checklist && (
        <div className="relative z-10 mt-6 w-full">
          <ChecklistCard emotional={checklist.emotional} utility={checklist.utility} />
        </div>
      )}

      {/* Share prompt */}
      {showSharePrompt && <SharePrompt onDismiss={() => setShowSharePrompt(false)} />}

      {/* Reflection card — elevated glass */}
      {!cardDismissed && reflection && (
        <div
          className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-6 transition-transform duration-500 ease-out"
          style={{ transform: cardVisible ? 'translateY(0)' : 'translateY(110%)' }}
        >
          <div
            onClick={() => setCardDismissed(true)}
            className="w-full max-w-[480px] cursor-pointer rounded-[24px] px-5 py-5"
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(168,197,160,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-moss">
                <SmallLeafIcon />
              </span>
              <p className="text-[0.95rem] italic leading-relaxed text-gray-600">{reflection}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); handleSave() }}
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-700 transition-colors"
              >
                Save this
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gray-800 px-4 py-2 text-xs text-white shadow-soft transition-opacity duration-300"
        style={{ opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}
      >
        Saved ✓
      </div>

      {/* Anonymous user — first entry: full-screen gate */}
      {isAnonymous && totalEntries === 1 && !gateDismissed && (
        <FirstEntryGate
          moodWord={freshEntry?.mood_word}
          onDismiss={() => setGateDismissed(true)}
        />
      )}

      {/* Anonymous user — returning: slim persistent banner */}
      {isAnonymous && totalEntries !== null && totalEntries > 1 && (
        <AnonPersistBanner />
      )}
    </div>
  )
}

export default function DonePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at 50% 38%, #D4EDDA 0%, #EDF7EE 40%, #FDF8F0 100%)' }}
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-moss" />
        </div>
      }
    >
      <DonePageInner />
    </Suspense>
  )
}
