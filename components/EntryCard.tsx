'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getMoodColor } from '@/lib/moodColors'

export interface EntryData {
  id: string
  mode: string
  mood_word: string | null
  ai_summary: string | null
  ai_summary_short: string | null
  created_at: string
}

const MODE_LABELS: Record<string, string> = {
  'life-stories':  'Life stories',
  'feeling-now':   'Feeling right now',
  'past-event':    'Something that happened',
  'future-event':  'Something coming up',
  'vent':          'Just venting',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function EntryCard({
  entry,
  index = 0,
}: {
  entry: EntryData
  index?: number
}) {
  const [expanded, setExpanded] = useState(false)

  const color = getMoodColor(entry.mood_word ?? '')
  const shortText =
    entry.ai_summary_short ??
    (entry.ai_summary ? entry.ai_summary.slice(0, 100) : null) ??
    'Entry recorded'
  const fullText = entry.ai_summary ?? shortText

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="glass w-full text-left overflow-hidden"
      >
        <div className="flex">
          <div className="w-1 shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />
          <motion.div layout className="flex flex-1 flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {entry.mood_word ?? 'Entry'}
              </span>
              <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
            </div>
            <span className="text-xs text-gray-400">
              {MODE_LABELS[entry.mode] ?? entry.mode}
            </span>
            <motion.p layout className="mt-1 text-sm text-gray-600 leading-relaxed">
              {expanded ? fullText : shortText}
              {!expanded && fullText !== shortText && (
                <span className="text-green-700"> …more</span>
              )}
            </motion.p>
          </motion.div>
        </div>
      </button>
    </motion.div>
  )
}
