'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'otp' | 'success'
const N = 6

/* ─── OTP 6-box input ──────────────────────────────────────────────── */

function OtpInput({
  onComplete,
  hasError,
  disabled,
}: {
  onComplete: (code: string) => void
  hasError: boolean
  disabled: boolean
}) {
  const [digits, setDigits] = useState<string[]>(Array(N).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  function submit(d: string[]) {
    onComplete(d.join(''))
  }

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = digit
    setDigits(next)
    if (digit && i < N - 1) {
      refs.current[i + 1]?.focus()
    }
    if (next.every((d) => d !== '')) {
      submit(next)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        const next = [...digits]
        next[i] = ''
        setDigits(next)
      } else if (i > 0) {
        const next = [...digits]
        next[i - 1] = ''
        setDigits(next)
        refs.current[i - 1]?.focus()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, N)
    if (!pasted) return
    const next = Array(N).fill('')
    pasted.split('').forEach((ch, idx) => {
      next[idx] = ch
    })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, N - 1)
    refs.current[focusIdx]?.focus()
    if (next.every((d) => d !== '')) {
      submit(next)
    }
  }

  return (
    <div className={`flex gap-2 ${hasError ? 'otp-shake' : ''}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-10 rounded-lg border text-center text-lg font-semibold text-gray-800 outline-none transition-colors focus:border-green-700"
          style={{
            borderColor: hasError ? '#ef4444' : d ? '#4A7C59' : '#e5e7eb',
            backgroundColor: d ? '#F2F7F2' : '#fff',
          }}
        />
      ))}
    </div>
  )
}

/* ─── AuthModal ────────────────────────────────────────────────────── */

export default function AuthModal() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  function startCountdown() {
    setCountdown(30)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Try again.')
      return
    }

    setStep('otp')
    startCountdown()
  }

  async function handleVerifyCode(code: string) {
    setIsSubmitting(true)
    setError(null)
    setOtpError(false)

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
    })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) {
      setOtpError(true)
      setError(data.error ?? 'Incorrect code. Try again.')
      // Reset shake after animation
      setTimeout(() => setOtpError(false), 500)
      return
    }

    // Refresh session so useSession picks up the upgraded user
    const supabase = createClient()
    await supabase.auth.refreshSession()

    setStep('success')
  }

  async function handleResend() {
    if (countdown > 0 || isSubmitting) return
    await handleSendCode()
  }

  return (
    <>
      <style>{`
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .otp-shake { animation: otpShake 0.45s ease-out; }
      `}</style>

      <div className="fixed inset-0 z-50 flex flex-col items-center bg-white">
        {/* Content column — constrained to 480px */}
        <div className="relative flex w-full max-w-[480px] flex-1 flex-col">
          {/* Dismiss */}
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

            {/* ── Step: email ── */}
            {step === 'email' && (
              <>
                <h1 className="mb-3 text-center text-2xl font-semibold" style={{ color: '#1E3A1F' }}>
                  Save your entries
                </h1>
                <p className="mb-9 max-w-[230px] text-center text-sm leading-relaxed text-gray-400">
                  Your words deserve a home. Sign up to keep your tree growing.
                </p>

                <form onSubmit={handleSendCode} className="flex w-full max-w-[320px] flex-col gap-3">
                  <input
                    ref={emailRef}
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

                <p className="mt-5 text-[11px] text-gray-300">Your data stays private. No spam.</p>
              </>
            )}

            {/* ── Step: otp ── */}
            {step === 'otp' && (
              <>
                <h1 className="mb-2 text-center text-2xl font-semibold" style={{ color: '#1E3A1F' }}>
                  Check your email
                </h1>
                <p className="mb-1 max-w-[260px] text-center text-sm leading-relaxed text-gray-400">
                  We sent a 6-digit code to
                </p>
                <p className="mb-8 text-center text-sm font-medium text-gray-700">{email}</p>

                <OtpInput
                  onComplete={handleVerifyCode}
                  hasError={otpError}
                  disabled={isSubmitting}
                />

                {error && (
                  <p className="mt-4 text-center text-xs text-red-500">{error}</p>
                )}

                <div className="mt-7 flex flex-col items-center gap-2">
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || isSubmitting}
                    className="text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                  <button
                    onClick={() => { setStep('email'); setError(null); setOtpError(false) }}
                    className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    ← Use a different email
                  </button>
                </div>
              </>
            )}

            {/* ── Step: success ── */}
            {step === 'success' && (
              <div className="text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-sm font-medium text-green-700">Verified</p>
                <p className="mt-2 text-xs text-gray-400">
                  Your entries are saved. Your tree keeps growing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
