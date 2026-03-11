'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/hooks/useSession'

interface SavePromptProps {
  onDismiss: () => void
}

export default function SavePrompt({ onDismiss }: SavePromptProps) {
  const { upgradeToEmail } = useSession()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus email input when modal opens
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    if (success) {
      const t = setTimeout(onDismiss, 3000)
      return () => clearTimeout(t)
    }
  }, [success, onDismiss])

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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      {/* Sheet */}
      <div className="w-full max-w-[480px] rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Save your journal permanently</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Your thoughts are saved on this device for now. Add an email to keep them forever — even if you switch devices.
        </p>

        {success ? (
          <p className="mt-5 text-center text-sm font-medium text-green-700">
            Check your inbox to confirm ✓
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full rounded-xl bg-green-700 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? 'Saving…' : 'Save my journal'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <a href="/auth/login" className="text-green-700 underline underline-offset-2">
            Log in
          </a>
        </p>
        <button
          onClick={onDismiss}
          className="mt-2 w-full text-center text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
