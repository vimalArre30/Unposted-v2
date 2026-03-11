'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is the name of the street you grew up on?",
  "What was the model of your first phone?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
]

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0])
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Guard: must be authenticated (but not fully set up) to be here
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/signup')
        return
      }
      // If setup is already complete (email expunged), go home
      if (user.email?.endsWith('@private.unposted.app')) {
        router.replace('/')
      }
    })
  }, [router, supabase.auth])

  // Debounced username check
  useEffect(() => {
    const raw = username.toLowerCase().trim()
    if (!raw) { setUsernameStatus('idle'); return }
    if (!USERNAME_RE.test(raw)) { setUsernameStatus('invalid'); return }

    setUsernameStatus('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(raw)}`)
      const data = await res.json()
      setUsernameStatus(data.available ? 'available' : 'taken')
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username])

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    const res = await fetch('/api/auth/complete-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        securityQuestion: question,
        securityAnswer: answer,
        answerHint: hint,
      }),
    })
    const data = await res.json()
    setIsSubmitting(false)
    if (data.ok) {
      // Refresh the session so the cookie reflects the new @private.unposted.app email.
      // The middleware setup guard checks this email — without the refresh it would
      // redirect back to /auth/setup on the next navigation.
      await supabase.auth.refreshSession()
      router.push('/')
    } else {
      setError(data.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-10">
      <div className="w-full max-w-[400px]">
        {/* Step indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* STEP 1 — Username */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pick your name</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                This is how you&apos;ll log in. No email needed after this.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
              />
              {usernameStatus === 'available' && (
                <p className="text-xs text-green-600 pl-1">✓ Available</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-xs text-red-500 pl-1">✗ Already taken</p>
              )}
              {usernameStatus === 'invalid' && (
                <p className="text-xs text-gray-400 pl-1">3–20 chars, letters, numbers and _ only</p>
              )}
              {usernameStatus === 'checking' && (
                <p className="text-xs text-gray-400 pl-1">Checking…</p>
              )}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={usernameStatus !== 'available'}
              className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 — Security question */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Set a recovery key</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                If you ever lose access, this is your way back in.
              </p>
            </div>
            <select
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-green-600 focus:outline-none"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              autoFocus
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
            />
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="A hint only you'd understand (optional but recommended)"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
            />
            <button
              onClick={() => setStep(3)}
              disabled={!answer.trim()}
              className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
            >
              Continue →
            </button>
            <button onClick={() => setStep(1)} className="text-center text-xs text-gray-400 underline underline-offset-2">
              ← Back
            </button>
          </div>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">One last thing</h1>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                We&apos;re about to remove your email from our system. After this, you&apos;ll log in with your
                username and security answer only. Make sure you remember them.
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-28 shrink-0">Username</span>
                <span className="text-gray-800 font-medium">@{username.toLowerCase().trim()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-28 shrink-0">Security Q</span>
                <span className="text-gray-700">{question}</span>
              </div>
              {hint && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-28 shrink-0">Hint</span>
                  <span className="text-gray-500 italic">{hint}</span>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? 'Setting up…' : 'Confirm & enter my space'}
            </button>
            <button onClick={() => setStep(2)} className="text-center text-xs text-gray-400 underline underline-offset-2">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
