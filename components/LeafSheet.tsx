'use client'

import { getMoodColor } from '@/lib/moodColors'
import type { LeafEntry } from '@/components/LifeTree'

interface LeafSheetProps {
  entry: LeafEntry | null
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LeafSheet({ entry, onClose }: LeafSheetProps) {
  const isOpen = entry !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 rounded-t-2xl bg-white px-6 pb-10 pt-5 shadow-xl transition-transform duration-300"
        style={{ transform: `translateX(-50%) translateY(${isOpen ? '0%' : '100%'})` }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-sm text-gray-400 hover:text-gray-700"
        >
          ✕ Close
        </button>

        {entry && (
          <>
            {/* Mood row */}
            <div className="flex items-center gap-2 pr-16">
              <svg width="14" height="18" viewBox="0 0 12 16">
                <ellipse
                  cx="6" cy="8" rx="6" ry="8"
                  fill={getMoodColor(entry.mood_word)}
                  opacity="0.9"
                />
              </svg>
              <span className="text-sm font-medium text-gray-800">{entry.mood_word}</span>
              <span className="ml-auto text-xs text-gray-400">{formatDate(entry.created_at)}</span>
            </div>

            <hr className="my-3 border-gray-100" />

            {/* Summary */}
            {entry.ai_summary_short ? (
              <p className="text-base italic leading-relaxed text-gray-700">
                &ldquo;{entry.ai_summary_short}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-gray-400">Summary being generated...</p>
            )}
          </>
        )}
      </div>
    </>
  )
}
