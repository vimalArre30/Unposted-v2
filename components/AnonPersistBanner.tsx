'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SESSION_KEY = 'anon_banner_dismissed'

export default function AnonPersistBanner() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
    >
      <div
        className="flex w-full max-w-[480px] items-center justify-between gap-3 rounded-2xl px-4 py-3"
        style={{ backgroundColor: '#F2F7F2', border: '1px solid #D4E8D4' }}
      >
        <p className="text-sm text-gray-600 leading-snug">
          🌿 Sign up to save your tree permanently
        </p>
        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            onClick={() => router.push('/account')}
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: '#1E3A1F' }}
          >
            Sign up →
          </button>
          <button
            onClick={dismiss}
            className="text-gray-300 transition-colors hover:text-gray-500"
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
