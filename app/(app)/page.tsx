'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'

export default function AppPage() {
  const { user, isLoading, isAnonymous, upgradeToEmail } = useSession()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    const { error } = await upgradeToEmail(email)
    setMessage(error ?? 'Check your email to confirm your account.')
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading session...</div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Session status */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-1">
        <p className="text-sm font-semibold text-gray-800">
          {user ? 'Session active' : 'No session'}
        </p>
        {user && (
          <>
            <p className="text-xs font-mono text-gray-400 break-all">{user.id}</p>
            <p className="text-xs text-gray-400">
              {isAnonymous ? 'Anonymous user' : `Registered — ${user.email}`}
            </p>
          </>
        )}
      </div>

      {/* Email upgrade */}
      {isAnonymous && (
        <form onSubmit={handleUpgrade} className="space-y-3">
          <p className="text-sm text-gray-600">
            Save your journal permanently with an email:
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-black py-2 text-sm text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Save my data'}
          </button>
          {message && (
            <p className="text-xs text-gray-500">{message}</p>
          )}
        </form>
      )}
    </div>
  )
}
