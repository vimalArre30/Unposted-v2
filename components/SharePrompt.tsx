'use client'

import Link from 'next/link'

const SESSION_KEY = 'sharePromptDismissed'

interface Props {
  onDismiss: () => void
}

export default function SharePrompt({ onDismiss }: Props) {
  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    onDismiss()
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
      <div className="w-full max-w-[480px] glass rounded-3xl px-5 py-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Your tree is worth sharing 🌿</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Share your inner weather card with friends.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="mt-0.5 shrink-0 text-gray-300 hover:text-gray-500 text-base leading-none"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href="/share"
            className="flex-1 rounded-xl bg-green-700 py-2 text-center text-sm font-medium text-white"
          >
            See my card →
          </Link>
          <button
            onClick={dismiss}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-400 hover:text-gray-700"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

export function shouldShowSharePrompt(): boolean {
  if (typeof window === 'undefined') return false
  return !sessionStorage.getItem(SESSION_KEY)
}
