'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [shake, setShake] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [sendError, setSendError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startResendCountdown() {
    setResendCountdown(30)
    countdownRef.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(countdownRef.current!); return 0 }
        return n - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || isSending) return
    setIsSending(true)
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    setIsSending(false)
    if (res.ok) {
      setSendError('')
      setPhase('otp')
      startResendCountdown()
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } else {
      const data = await res.json()
      setSendError(data.error || 'Failed to send code. Try again.')
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return
    await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    startResendCountdown()
    setDigits(['', '', '', '', '', ''])
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }

  async function verifyOtp(code: string) {
    setIsVerifying(true)
    setOtpError('')
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), code }),
    })
    const data = await res.json()
    setIsVerifying(false)
    if (data.success) {
      // Exchange the one-time token for a real Supabase session.
      // refreshSession() is unreliable here because Supabase invalidates the anonymous
      // session when the user is upgraded to an email account via the admin API.
      const { error: sessionError } = await createClient().auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      })
      if (sessionError) {
        setOtpError('Code verified but session failed. Please try again.')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => { setShake(false); inputRefs.current[0]?.focus() }, 600)
        return
      }
      router.push('/auth/setup')
    } else {
      setShake(true)
      setOtpError(data.error || 'Incorrect code, try again')
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => { setShake(false); inputRefs.current[0]?.focus() }, 600)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '')) {
      verifyOtp(next.join(''))
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-10">
      <div className="w-full max-w-[400px]">
        {/* EMAIL PHASE */}
        {phase === 'email' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">Create your space</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Your email is only used once to verify you. We won&apos;t store it.
              </p>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              required
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
            />
            {sendError && (
              <p className="text-sm text-red-500">{sendError}</p>
            )}
            <button
              type="submit"
              disabled={!email.trim() || isSending}
              className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
            >
              {isSending ? 'Sending…' : 'Send code'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Already have an account?{' '}
              <a href="/auth/login" className="text-green-700 underline underline-offset-2">
                Log in
              </a>
            </p>
          </form>
        )}

        {/* OTP PHASE */}
        {phase === 'otp' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Check your inbox</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-600">{email}</span>
              </p>
            </div>

            {/* Digit inputs */}
            <div
              className={`flex gap-2 justify-center ${shake ? 'animate-shake' : ''}`}
              style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
            >
              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  20%       { transform: translateX(-6px); }
                  40%       { transform: translateX(6px); }
                  60%       { transform: translateX(-4px); }
                  80%       { transform: translateX(4px); }
                }
              `}</style>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  disabled={isVerifying}
                  className={`h-12 w-10 rounded-xl border text-center text-lg font-semibold focus:outline-none transition-colors ${
                    shake
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : d
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white text-gray-800'
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-center text-sm text-red-500">{otpError}</p>
            )}

            {isVerifying && (
              <p className="text-center text-sm text-gray-400">Verifying…</p>
            )}

            {/* Resend */}
            <p className="text-center text-xs text-gray-400">
              {resendCountdown > 0 ? (
                <>Resend in {resendCountdown}s</>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-green-700 underline underline-offset-2"
                >
                  Resend code
                </button>
              )}
            </p>

            <button
              onClick={() => setPhase('email')}
              className="text-center text-xs text-gray-400 underline underline-offset-2"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
