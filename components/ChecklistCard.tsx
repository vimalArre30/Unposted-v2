'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  emotional: string[]
  utility: string[]
}

function SmallLeafIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M6.5 1.5C9 1.5 11 4 10.5 7C10 9.5 8.5 10.5 6.5 11.5C4.5 10.5 3 9.5 2.5 7C2 4 4 1.5 6.5 1.5Z"
        fill="#A8C5A0"
      />
      <path d="M6.5 3C6.5 6 6.5 9 6.5 11.5" stroke="#4A7C59" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function SmallCircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="#A8C5A0" strokeWidth="1.4" />
      <circle cx="6.5" cy="6.5" r="2" fill="#A8C5A0" />
    </svg>
  )
}

function Section({
  items,
  icon,
  label,
}: {
  items: string[]
  icon: React.ReactNode
  label: string
}) {
  // Track checked state at section level for header fade
  const [checkedMap, setCheckedMap] = useState<boolean[]>(() => items.map(() => false))
  const allChecked = checkedMap.every(Boolean)

  function toggle(i: number) {
    setCheckedMap((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center gap-1.5 mb-2.5 transition-opacity duration-500"
        style={{ opacity: allChecked ? 0.4 : 1 }}
      >
        <span>{icon}</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#4A7C59' }}
        >
          {label}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {items.map((text, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="flex items-start gap-2.5 text-left w-full py-0.5"
          >
            <span
              className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border transition-all duration-200 flex items-center justify-center"
              style={{
                borderColor: checkedMap[i] ? '#4A7C59' : '#C4D9C4',
                backgroundColor: checkedMap[i] ? '#4A7C59' : 'transparent',
                boxShadow: checkedMap[i] ? '0 0 0 2px rgba(74,124,89,0.15)' : 'none',
              }}
            >
              {checkedMap[i] && (
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                  <path d="M4 8.5L7 11.5L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span
              className="text-sm leading-relaxed transition-all duration-200"
              style={{
                color: checkedMap[i] ? '#9ca3af' : '#374151',
                textDecoration: checkedMap[i] ? 'line-through' : 'none',
              }}
            >
              {text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChecklistCard({ emotional, utility }: Props) {
  if (emotional.length === 0 && utility.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full rounded-[16px] px-4 py-4"
      style={{
        backgroundColor: '#F2F7F2',
        border: '1px solid #D4E8D4',
      }}
    >
      {emotional.length > 0 && (
        <Section items={emotional} icon={<SmallLeafIcon />} label="for your heart" />
      )}

      {emotional.length > 0 && utility.length > 0 && (
        <div className="my-3.5" style={{ borderTop: '1px solid #D4E8D4' }} />
      )}

      {utility.length > 0 && (
        <Section items={utility} icon={<SmallCircleIcon />} label="worth doing" />
      )}
    </motion.div>
  )
}
