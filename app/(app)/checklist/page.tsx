'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ChecklistItem {
  id: string
  text: string
  type: 'emotional' | 'utility' | 'insight'
  source_entry_id: string | null
  is_checked: boolean
  created_at: string
  checked_at: string | null
}

const TYPE_LABEL: Record<string, string> = {
  emotional: 'for your heart',
  utility: 'worth doing',
  insight: 'pattern',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getGroup(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000)
  if (d >= todayStart) return 'Today'
  if (d >= yesterdayStart) return 'Yesterday'
  if (d >= weekStart) return 'This week'
  return 'Earlier'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier']

function EmptyState() {
  return (
    <div className="flex flex-col items-center pt-24 px-6 text-center">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path
          d="M9 43C9 43 19 33 25 27C31 21 43 9 43 9C43 9 39 13 33 19C27 25 17 37 9 43Z"
          fill="#D4E8D4"
          stroke="#A8C5A0"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M25 27L18 34"
          stroke="#4A7C59"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      <p className="mt-5 text-sm text-gray-400 leading-relaxed max-w-[210px]">
        Your checklist grows with each session. Start a new entry.
      </p>
    </div>
  )
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/checklist/items')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = useCallback(async (id: string, current: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_checked: !current } : item))
    )
    try {
      await fetch('/api/checklist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, isChecked: !current }),
      })
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_checked: current } : item))
      )
    }
  }, [])

  const uncheckedCount = items.filter((i) => !i.is_checked).length

  // Group items by date
  const grouped: Record<string, ChecklistItem[]> = {}
  for (const item of items) {
    const g = getGroup(item.created_at)
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(item)
  }

  if (loading) {
    return (
      <div className="px-4 pt-12 pb-28">
        <div className="h-7 w-32 bg-gray-100 rounded-lg mb-8 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-11 bg-gray-50 rounded-xl mb-3 animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="px-4 pt-12 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800">checklist</h1>
        {uncheckedCount > 0 && (
          <span
            className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: '#4A7C59' }}
          >
            {uncheckedCount}
          </span>
        )}
      </div>

      {/* Date groups */}
      {GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
        <div key={group} className="mb-7">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-3">
            {group}
          </p>
          <div className="flex flex-col">
            {grouped[group].map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                onClick={() => toggle(item.id, item.is_checked)}
                className="flex items-start gap-3 w-full text-left py-2.5"
              >
                {/* Checkbox */}
                <span
                  className="mt-0.5 flex-shrink-0 h-4 w-4 flex items-center justify-center transition-all duration-200"
                  style={{
                    border: `1.5px solid ${item.is_checked ? '#4A7C59' : '#C4D9C4'}`,
                    backgroundColor: item.is_checked ? '#4A7C59' : 'transparent',
                    borderRadius: '4px',
                  }}
                >
                  {item.is_checked && (
                    <svg viewBox="0 0 16 16" fill="none" width="10" height="10">
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>

                {/* Text + meta */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm leading-relaxed transition-all duration-200"
                    style={{
                      color: item.is_checked ? '#9ca3af' : '#374151',
                      textDecoration: item.is_checked ? 'line-through' : 'none',
                      opacity: item.is_checked ? 0.6 : 1,
                    }}
                  >
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#EBF3EB', color: '#4A7C59' }}
                    >
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span className="text-[10px] text-gray-300">
                      {relativeTime(item.created_at)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
