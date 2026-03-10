'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getMoodColor } from '@/lib/moodColors'
import type { EntryNode, FingerprintBranch } from '@/app/api/timeline/route'

const PAGE_SIZE = 10

type DisplayItem =
  | { kind: 'entry';  node: EntryNode }
  | { kind: 'branch'; node: FingerprintBranch }

function buildDisplay(entries: EntryNode[], branches: FingerprintBranch[]): DisplayItem[] {
  const result: DisplayItem[] = []
  entries.forEach((entry, i) => {
    result.push({ kind: 'entry', node: entry })
    // Insert branch nodes whose entryIndex points to this position (1-based)
    branches
      .filter((b) => b.entryIndex === i + 1)
      .forEach((b) => result.push({ kind: 'branch', node: b }))
  })
  return result
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Node components ───────────────────────────────────────────────────────────

function EntryNodeRow({ node }: { node: EntryNode }) {
  const color = getMoodColor(node.mood ?? '')
  return (
    <div className="relative flex flex-col items-center py-4">
      <span className="text-[10px] text-gray-400 mb-1.5 tabular-nums">{formatDate(node.date)}</span>
      {/* Mood dot sits on the spine */}
      <div
        className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm z-10"
        style={{ backgroundColor: color }}
      />
      {node.summary && (
        <p className="mt-2.5 max-w-[calc(100%-40px)] rounded-2xl bg-white/80 px-3.5 py-2.5 text-xs text-gray-600 leading-relaxed shadow-sm border border-gray-100/80 text-center">
          {node.summary}
        </p>
      )}
    </div>
  )
}

function BranchNodeRow({ node }: { node: FingerprintBranch }) {
  const isLeft = node.branch === 'left'
  const pill = (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-3 py-1.5 max-w-[140px]">
      <div className="flex items-center gap-1.5">
        {isLeft ? <PersonBranchIcon /> : <ThemeBranchIcon />}
        <span className="text-[11px] font-medium text-gray-700 leading-tight truncate">{node.entity}</span>
      </div>
      <p className="mt-0.5 text-[9px] text-gray-400 leading-tight truncate">{node.firstSignal}</p>
    </div>
  )

  const connector = (
    <div className="w-6 shrink-0 h-px" style={{ backgroundColor: 'rgba(30,58,31,0.15)' }} />
  )
  const dot = (
    <div
      className="h-2 w-2 rounded-full z-10 shrink-0"
      style={{ backgroundColor: '#4A7C59' }}
    />
  )

  if (isLeft) {
    return (
      <div className="relative flex items-center py-1.5">
        <div className="flex flex-1 items-center justify-end">
          {pill}
          {connector}
        </div>
        {dot}
        <div className="flex-1" />
      </div>
    )
  }

  return (
    <div className="relative flex items-center py-1.5">
      <div className="flex-1" />
      {dot}
      <div className="flex flex-1 items-center">
        {connector}
        {pill}
      </div>
    </div>
  )
}

function SkeletonNode({ i }: { i: number }) {
  const isLeft = i % 3 === 1
  const isCenter = i % 3 === 0
  if (isCenter) {
    return (
      <div className="relative flex flex-col items-center py-4">
        <div className="h-2 w-20 rounded-full bg-gray-100 animate-pulse mb-1.5" />
        <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
        <div className="mt-2.5 h-8 max-w-[calc(100%-40px)] w-full rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    )
  }
  return (
    <div className="relative flex items-center py-1.5">
      {isLeft ? (
        <>
          <div className="flex flex-1 justify-end">
            <div className="h-8 w-28 rounded-xl bg-gray-100 animate-pulse" />
            <div className="w-6 h-px bg-gray-100 self-center ml-0" />
          </div>
          <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1" />
        </>
      ) : (
        <>
          <div className="flex-1" />
          <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex flex-1">
            <div className="w-6 h-px bg-gray-100 self-center" />
            <div className="h-8 w-28 rounded-xl bg-gray-100 animate-pulse" />
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 gap-5">
      {/* Simple timeline line illustration */}
      <svg width="48" height="100" viewBox="0 0 48 100" fill="none">
        <line x1="24" y1="0" x2="24" y2="100" stroke="#C8E6C0" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
        <circle cx="24" cy="18" r="5" fill="#A8D8A8" />
        <circle cx="24" cy="50" r="3.5" fill="#C8E6C0" />
        <circle cx="24" cy="76" r="2.5" fill="#D4EDD4" />
      </svg>
      <p className="text-center text-sm text-gray-400 leading-relaxed max-w-[240px]">
        Your timeline grows as you journal.<br />Start your first entry.
      </p>
    </div>
  )
}

// ── Inline icon components ────────────────────────────────────────────────────

function PersonBranchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function ThemeBranchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22C2 22 8 16 12 12C16 8 22 2 22 2C22 2 16 4 12 8C8 12 4 18 2 22Z" />
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const [entries, setEntries]       = useState<EntryNode[]>([])
  const [branches, setBranches]     = useState<FingerprintBranch[]>([])
  const [total, setTotal]           = useState(0)
  const [hasMore, setHasMore]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef   = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPage = useCallback(async (offset: number, isFirstLoad: boolean) => {
    if (isFirstLoad) setLoading(true); else setLoadingMore(true)
    try {
      const res = await fetch(`/api/timeline?limit=${PAGE_SIZE}&offset=${offset}`)
      const data = await res.json()
      if (data.error) return
      setEntries((prev) => isFirstLoad ? data.nodes : [...prev, ...data.nodes])
      if (isFirstLoad) setBranches(data.fingerprintBranches ?? [])
      setTotal(data.total)
      setHasMore(data.hasMore)
      offsetRef.current = offset + PAGE_SIZE
    } catch {
      /* swallow */
    } finally {
      if (isFirstLoad) setLoading(false); else setLoadingMore(false)
    }
  }, [])

  // Initial load
  useEffect(() => { fetchPage(0, true) }, [fetchPage])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(offsetRef.current, false)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, fetchPage])

  const displayItems = buildDisplay(entries, branches)

  return (
    <div
      className="relative min-h-screen px-5 pt-12 pb-32"
      style={{ background: 'linear-gradient(180deg, #F4FAF4 0%, #FDFAF6 100%)' }}
    >
      {/* Page heading */}
      <h1
        className="mb-8 text-2xl font-bold lowercase leading-tight tracking-tight"
        style={{ color: '#1E3A1F' }}
      >
        your story so far
      </h1>

      {loading ? (
        // Initial loading — show skeletons
        <div className="relative">
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
            style={{ width: 1, borderLeft: '2px dashed rgba(30,58,31,0.12)' }}
          />
          {[0, 1, 2].map((i) => <SkeletonNode key={i} i={i} />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          {/* Centre spine */}
          <div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
            style={{ width: 1, borderLeft: '2px dashed rgba(30,58,31,0.14)' }}
          />

          {/* Entry count badge */}
          <div className="mb-4 flex justify-center">
            <span
              className="rounded-full px-3 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'rgba(30,58,31,0.06)', color: '#4A7C59' }}
            >
              {total} {total === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Timeline nodes */}
          {displayItems.map((item) =>
            item.kind === 'entry'
              ? <EntryNodeRow  key={item.node.id}   node={item.node} />
              : <BranchNodeRow key={item.node.id}   node={item.node} />
          )}

          {/* Load-more skeletons */}
          {loadingMore && (
            <>{[0, 1, 2].map((i) => <SkeletonNode key={`sk-${i}`} i={i} />)}</>
          )}

          {/* Sentinel for IntersectionObserver */}
          <div ref={sentinelRef} className="h-1" />

          {/* End of timeline marker */}
          {!hasMore && entries.length > 0 && (
            <div className="relative flex flex-col items-center pt-6 pb-4">
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{ borderColor: 'rgba(30,58,31,0.2)', backgroundColor: '#F4FAF4' }}
              />
              <p className="mt-2 text-[10px] text-gray-400">beginning of your story</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
