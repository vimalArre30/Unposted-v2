'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EntryCard, { type EntryData } from '@/components/EntryCard'
import SavePrompt from '@/components/SavePrompt'
import { useSession } from '@/hooks/useSession'

function LeafEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
      <path d="M2 22 C2 22 8 16 12 12 C16 8 22 2 22 2 C22 2 16 4 12 8 C8 12 4 18 2 22Z" />
      <path d="M12 12 L7 17" />
    </svg>
  )
}

export default function EntriesPage() {
  const router = useRouter()
  const { isAnonymous, isLoading: sessionLoading } = useSession()
  const [entries, setEntries] = useState<EntryData[] | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  useEffect(() => {
    fetch('/api/entries/list')
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
  }, [])

  useEffect(() => {
    if (sessionLoading) return
    setShowSavePrompt(isAnonymous)
  }, [sessionLoading, isAnonymous])

  if (entries === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pb-24 pt-12">
      {showSavePrompt && <SavePrompt onDismiss={() => setShowSavePrompt(false)} />}
      <h1 className="text-xl font-semibold text-gray-900">Your entries</h1>

      {entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <LeafEmptyIcon />
          <p className="text-sm text-gray-400">Your first entry will appear here.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 rounded-2xl bg-green-700 px-6 py-2.5 text-sm font-medium text-white"
          >
            Record your first entry
          </button>
        </div>
      ) : (
        <div className="mt-5 md:columns-2 md:gap-3 flex flex-col gap-2 md:block">
          {entries.map((entry, i) => (
            <div key={entry.id} className="md:mb-3 md:break-inside-avoid">
              <EntryCard entry={entry} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
