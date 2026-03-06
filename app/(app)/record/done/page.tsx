'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function formatFriendlyDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function DonePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get('entryId')

  const [reflection, setReflection] = useState<string | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  const [cardDismissed, setCardDismissed] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!entryId) return

    // Fire reflect in background — do not block celebration
    fetch('/api/entries/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.reflection) setReflection(data.reflection)
      })
      .catch(() => {/* silent — reflection is a gift, not required */})

    // Slide up card after 2.5s regardless (will show once reflection arrives)
    const timer = setTimeout(() => setCardVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [entryId])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  function handleSave() {
    setToastVisible(true)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-10 pt-10"
         style={{ backgroundColor: '#E8F5E9' }}>

      {/* Leaf celebration */}
      <div className="flex flex-col items-center gap-6 text-center">
        <LeafSVG />
        <h1 className="text-2xl font-medium text-gray-800">
          Your garden just grew a new leaf.
        </h1>
        <p className="text-sm text-gray-500">{formatFriendlyDate(new Date())}</p>
      </div>

      {/* Action buttons */}
      <div className="mt-14 flex w-full flex-col items-center gap-4">
        <button
          onClick={() => router.push('/garden')}
          className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white"
        >
          Go to my garden
        </button>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-700"
        >
          Record another entry
        </button>
      </div>

      {/* Reflection card — slides up from bottom */}
      {!cardDismissed && reflection && (
        <div
          className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-6 transition-transform duration-500 ease-out"
          style={{ transform: cardVisible ? 'translateY(0)' : 'translateY(110%)' }}
        >
          <div
            onClick={() => setCardDismissed(true)}
            className="w-full max-w-[480px] cursor-pointer rounded-3xl bg-white px-5 py-5 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-green-700 shrink-0">
                <SmallLeafIcon />
              </span>
              <p className="text-sm italic leading-relaxed text-gray-600">{reflection}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-700"
              >
                Save this
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gray-800 px-4 py-2 text-xs text-white shadow-md transition-opacity duration-300"
        style={{ opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}
      >
        Saved ✓
      </div>
    </div>
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
      <svg
        className="leaf-grow"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stem */}
        <path
          d="M48 88 C48 70 44 56 36 44"
          stroke="#4CAF50"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Leaf body */}
        <path
          d="M48 16 C68 16 80 32 76 52 C72 68 60 76 48 80 C36 76 24 68 20 52 C16 32 28 16 48 16Z"
          fill="#66BB6A"
          opacity="0.9"
        />
        {/* Midrib */}
        <path
          d="M48 24 C48 44 48 62 48 80"
          stroke="#388E3C"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Veins */}
        <path d="M48 38 C42 34 34 34 28 38" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 52 C40 46 32 47 26 52" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 38 C54 34 62 34 68 38" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M48 52 C56 46 64 47 70 52" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    </>
  )
}

function SmallLeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2 C12 2 14 6 13 10 C12 13 10 14 8 15 C6 14 4 13 3 10 C2 6 4 2 8 2Z"
        fill="#66BB6A"
      />
      <path d="M8 4 C8 8 8 12 8 15" stroke="#388E3C" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

export default function DonePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
        </div>
      }
    >
      <DonePageInner />
    </Suspense>
  )
}
