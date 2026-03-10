'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

export default function AuthModal() {
  const router = useRouter()
  const { upgradeToEmail } = useSession()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    const { error: err } = await upgradeToEmail(email.trim())
    setIsSubmitting(false)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-white">
      {/* Content column — constrained to 480px so close button stays near content on desktop */}
      <div className="relative flex w-full max-w-[480px] flex-1 flex-col">
        {/* Dismiss — goes home, not back to a blank profile */}
        <button
          onClick={() => router.replace('/')}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" width="15" height="15"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Centered content */}
        <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Wordmark */}
        <div className="mb-8 flex items-center gap-2">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="#1E3A1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22C2 22 8 16 12 12C16 8 22 2 22 2C22 2 16 4 12 8C8 12 4 18 2 22Z" />
            <path d="M12 12L7 17" />
          </svg>
          <span className="text-base font-semibold tracking-wide text-gray-800">unposted</span>
        </div>

        {/* Mini tree illustration */}
        <div className="mb-8">
          <MiniTree />
        </div>

        {/* Copy */}
        <h1 className="mb-3 text-center text-2xl font-semibold" style={{ color: '#1E3A1F' }}>
          Save your entries
        </h1>
        <p className="mb-9 max-w-[230px] text-center text-sm leading-relaxed text-gray-400">
          Your words deserve a home. Sign up to keep your tree growing.
        </p>

        {/* Form / success state */}
        {success ? (
          <div className="text-center">
            <p className="text-sm font-medium text-green-700">Check your inbox to confirm ✓</p>
            <p className="mt-2 text-xs text-gray-400">
              Your entries will be waiting when you&apos;re back.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full max-w-[320px] flex-col gap-3">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-full border border-gray-200 px-5 py-3.5 text-base text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-green-700"
            />
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full rounded-full py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#1E3A1F' }}
            >
              {isSubmitting ? 'Sending…' : 'Continue with email →'}
            </button>
          </form>
        )}

        <p className="mt-5 text-[11px] text-gray-300">Your data stays private. No spam.</p>
        </div>
      </div>
    </div>
  )
}

function MiniTree() {
  return (
    <svg width="76" height="92" viewBox="0 0 76 92" fill="none">
      {/* Trunk */}
      <path d="M38 92V50" stroke="#4A7C59" strokeWidth="2.4" strokeLinecap="round" />
      {/* Left branch */}
      <path d="M38 68C38 68 26 62 20 52" stroke="#4A7C59" strokeWidth="1.7" strokeLinecap="round" />
      {/* Right branch */}
      <path d="M38 58C38 58 50 52 56 42" stroke="#4A7C59" strokeWidth="1.7" strokeLinecap="round" />
      {/* Leaf — right */}
      <ellipse cx="58" cy="38" rx="10" ry="7" fill="#A8C5A0" opacity="0.9"
        transform="rotate(-22 58 38)" />
      {/* Leaf — left */}
      <ellipse cx="18" cy="48" rx="9" ry="6" fill="#C5DBC5" opacity="0.85"
        transform="rotate(16 18 48)" />
      {/* Top bud */}
      <ellipse cx="38" cy="30" rx="7" ry="9" fill="#4A7C59" opacity="0.45" />
    </svg>
  )
}
