'use client'

import { useEffect, useRef, useState } from 'react'

interface GrowthCarouselProps {
  onClose: () => void
}

const BG = ['#F7FAF7', '#FDF8F0', '#F5F0FA', '#F0F7F7']

// ── Decorative hill (bottom-left of every slide) ─────────────────────────────

function SageHill() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0"
      width="160" height="100" viewBox="0 0 160 100" fill="none"
    >
      <path d="M0 100 Q40 40 120 60 Q160 70 160 100 Z" fill="#C8E6C0" opacity="0.45" />
      <path d="M0 100 Q20 60 80 72 Q110 78 140 100 Z" fill="#A8D8A0" opacity="0.3" />
    </svg>
  )
}

// ── Chevron icons ─────────────────────────────────────────────────────────────

function ChevLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4L6 9l5 5" />
    </svg>
  )
}

function ChevRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4l5 5-5 5" />
    </svg>
  )
}

// ── Slide illustrations ───────────────────────────────────────────────────────

function Slide1Illustration() {
  // Sapling stage tree + floating tooltip
  return (
    <svg viewBox="0 0 200 180" className="w-full h-full" fill="none">
      {/* Ground hill */}
      <ellipse cx="100" cy="168" rx="90" ry="20" fill="#DFF0D8" />

      {/* Sapling trunk */}
      <path
        d="M100 155 C100 148 98 142 98 135 L102 135 C102 142 100 148 100 155 Z"
        fill="#3A2010"
      />
      {/* Trunk top narrow bit */}
      <rect x="99" y="128" width="2" height="8" rx="1" fill="#3A2010" />

      {/* Sapling leaves cluster */}
      <ellipse cx="100" cy="122" rx="10" ry="13" fill="#66BB6A" opacity="0.9" />
      <line x1="100" y1="110" x2="100" y2="134" stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="89"  cy="127" rx="8"  ry="10" fill="#81C784" opacity="0.85" />
      <line x1="89" y1="118" x2="89" y2="136" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="111" cy="127" rx="8"  ry="10" fill="#A5D6A7" opacity="0.85" />
      <line x1="111" y1="118" x2="111" y2="136" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="100" cy="113" rx="7"  ry="9"  fill="#4CAF50" opacity="0.9" />

      {/* Connector line from leaf to tooltip */}
      <path d="M107 118 Q130 108 138 98" stroke="#A8C5A0" strokeWidth="1.2" strokeDasharray="3 2" strokeLinecap="round" />

      {/* Tooltip bubble */}
      <rect x="112" y="58" width="76" height="40" rx="10" fill="white"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }} />
      {/* Bubble tail */}
      <path d="M136 98 L130 105 L144 98 Z" fill="white" />
      <text x="122" y="76" fontSize="8.5" fill="#4A7C59" fontWeight="600" fontFamily="system-ui, sans-serif">Mon, 3 June</text>
      <text x="122" y="90" fontSize="7.5" fill="#9CA3AF" fontFamily="system-ui, sans-serif">Felt lighter talking</text>
      <text x="122" y="100" fontSize="7.5" fill="#9CA3AF" fontFamily="system-ui, sans-serif">about my week...</text>

      {/* Dot indicator on leaf */}
      <circle cx="107" cy="120" r="3.5" fill="#4A7C59" opacity="0.8" />
      <circle cx="107" cy="120" r="6" fill="#4A7C59" opacity="0.15" />
    </svg>
  )
}

function Slide2Illustration() {
  // Canopy close-up — branches + colorful leaves, no trunk
  const LEAVES: [number, number, number, string][] = [
    [64,  80, -25, '#FFD166'],
    [78,  62, 15,  '#FF8FAB'],
    [95,  55, -10, '#AED9E0'],
    [112, 58, 20,  '#A8D8A8'],
    [128, 68, -18, '#C9A96E'],
    [58,  98, 30,  '#A8D8A8'],
    [140, 85, 25,  '#66BB6A'],
    [50,  70, -35, '#FF6B35'],
    [145, 60, -12, '#B5A7C9'],
    [100, 48, 5,   '#4CAF50'],
    [82,  90, -15, '#FFD166'],
    [118, 92, 22,  '#AED9E0'],
  ]

  return (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      {/* Main branch — horizontal */}
      <path d="M30 130 Q100 110 170 130" stroke="#3A2010" strokeWidth="6" strokeLinecap="round" />
      {/* Sub-branches going up */}
      <line x1="60"  y1="122" x2="55"  y2="80"  stroke="#3A2010" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="90"  y1="116" x2="82"  y2="62"  stroke="#3A2010" strokeWidth="3"   strokeLinecap="round" />
      <line x1="100" y1="114" x2="100" y2="50"  stroke="#3A2010" strokeWidth="3"   strokeLinecap="round" />
      <line x1="115" y1="116" x2="122" y2="60"  stroke="#3A2010" strokeWidth="3"   strokeLinecap="round" />
      <line x1="140" y1="122" x2="145" y2="62"  stroke="#3A2010" strokeWidth="3.5" strokeLinecap="round" />
      {/* Small twigs */}
      <line x1="55"  y1="95"  x2="42"  y2="82"  stroke="#3A2010" strokeWidth="2"   strokeLinecap="round" />
      <line x1="55"  y1="95"  x2="68"  y2="83"  stroke="#3A2010" strokeWidth="2"   strokeLinecap="round" />
      <line x1="145" y1="78"  x2="133" y2="68"  stroke="#3A2010" strokeWidth="2"   strokeLinecap="round" />
      <line x1="145" y1="78"  x2="157" y2="70"  stroke="#3A2010" strokeWidth="2"   strokeLinecap="round" />

      {/* Leaves */}
      {LEAVES.map(([cx, cy, rot, color], i) => (
        <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="10" ry="14" fill={color} opacity="0.9" />
          <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12}
            stroke="rgba(0,0,0,0.12)" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}

function Slide3Illustration() {
  // 4 circles in size progression with mini trees inside + entry labels
  const STAGES = [
    { cx: 30,  r: 24, label: '1–6',   tree: 'sapling'    },
    { cx: 78,  r: 28, label: '7–15',  tree: 'plant'      },
    { cx: 132, r: 34, label: '16–35', tree: 'small-tree' },
    { cx: 188, r: 40, label: '36+',   tree: 'big-tree'   },
  ]

  return (
    <svg viewBox="0 0 224 130" className="w-full h-full" fill="none">
      {/* Dashed arrows between circles */}
      {[
        [54, 65, 50, 65],
        [106, 65, 98, 65],
        [166, 65, 154, 65],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#A8C5A0" strokeWidth="1.5" strokeDasharray="3 2"
          markerEnd="url(#arr)" />
      ))}
      <defs>
        <marker id="arr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0 0 L5 2.5 L0 5 Z" fill="#A8C5A0" />
        </marker>
      </defs>

      {STAGES.map(({ cx, r, label, tree }) => (
        <g key={label}>
          {/* Circle bg */}
          <circle cx={cx} cy={65} r={r} fill="white"
            style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.08))' }} />
          <circle cx={cx} cy={65} r={r} stroke="#C8E6C0" strokeWidth="1.5" />

          {/* Mini tree per stage — clipped to circle */}
          <clipPath id={`clip-${label}`}>
            <circle cx={cx} cy={65} r={r - 2} />
          </clipPath>
          <g clipPath={`url(#clip-${label})`}>
            <MiniTree cx={cx} groundY={65 + r - 6} stage={tree} r={r} />
          </g>

          {/* Label */}
          <text x={cx} y={65 + r + 12} textAnchor="middle"
            fontSize="7.5" fill="#6B7280" fontFamily="system-ui, sans-serif">
            {label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function MiniTree({ cx, groundY, stage, r }: { cx: number; groundY: number; stage: string; r: number }) {
  const scale = r / 40

  if (stage === 'sapling') {
    const ty = groundY - 14 * scale
    return (
      <>
        <rect x={cx - 1.5 * scale} y={ty} width={3 * scale} height={14 * scale} rx={1} fill="#3A2010" />
        <ellipse cx={cx} cy={ty} rx={6 * scale} ry={8 * scale} fill="#66BB6A" opacity="0.9" />
      </>
    )
  }
  if (stage === 'plant') {
    const ty = groundY - 20 * scale
    return (
      <>
        <rect x={cx - 2 * scale} y={ty} width={4 * scale} height={20 * scale} rx={1} fill="#3A2010" />
        <line x1={cx} y1={ty + 8 * scale} x2={cx - 8 * scale} y2={ty + 3 * scale} stroke="#3A2010" strokeWidth={2 * scale} strokeLinecap="round" />
        <line x1={cx} y1={ty + 8 * scale} x2={cx + 8 * scale} y2={ty + 3 * scale} stroke="#3A2010" strokeWidth={2 * scale} strokeLinecap="round" />
        <ellipse cx={cx} cy={ty} rx={8 * scale} ry={10 * scale} fill="#4CAF50" opacity="0.9" />
        <ellipse cx={cx - 8 * scale} cy={ty + 4 * scale} rx={5 * scale} ry={7 * scale} fill="#81C784" opacity="0.85" />
        <ellipse cx={cx + 8 * scale} cy={ty + 4 * scale} rx={5 * scale} ry={7 * scale} fill="#81C784" opacity="0.85" />
      </>
    )
  }
  if (stage === 'small-tree') {
    const ty = groundY - 28 * scale
    return (
      <>
        <rect x={cx - 3 * scale} y={ty} width={6 * scale} height={28 * scale} rx={1.5} fill="#3A2010" />
        {[-12, -6, 6, 12].map((dx, i) => (
          <line key={i} x1={cx} y1={ty + 12 * scale} x2={cx + dx * scale} y2={ty + 6 * scale} stroke="#3A2010" strokeWidth={1.5 * scale} strokeLinecap="round" />
        ))}
        <ellipse cx={cx} cy={ty} rx={12 * scale} ry={14 * scale} fill="#388E3C" opacity="0.9" />
        <ellipse cx={cx - 10 * scale} cy={ty + 6 * scale} rx={7 * scale} ry={9 * scale} fill="#66BB6A" opacity="0.85" />
        <ellipse cx={cx + 10 * scale} cy={ty + 6 * scale} rx={7 * scale} ry={9 * scale} fill="#66BB6A" opacity="0.85" />
      </>
    )
  }
  // big-tree
  const ty = groundY - 34 * scale
  return (
    <>
      <rect x={cx - 4 * scale} y={ty} width={8 * scale} height={34 * scale} rx={2} fill="#3A2010" />
      {[-16, -8, 8, 16].map((dx, i) => (
        <line key={i} x1={cx} y1={ty + 14 * scale} x2={cx + dx * scale} y2={ty + 5 * scale} stroke="#3A2010" strokeWidth={2 * scale} strokeLinecap="round" />
      ))}
      <ellipse cx={cx} cy={ty - 2 * scale} rx={16 * scale} ry={18 * scale} fill="#2E7D32" opacity="0.9" />
      <ellipse cx={cx - 13 * scale} cy={ty + 8 * scale} rx={9 * scale} ry={11 * scale} fill="#388E3C" opacity="0.85" />
      <ellipse cx={cx + 13 * scale} cy={ty + 8 * scale} rx={9 * scale} ry={11 * scale} fill="#388E3C" opacity="0.85" />
      <ellipse cx={cx} cy={ty - 14 * scale} rx={10 * scale} ry={10 * scale} fill="#43A047" opacity="0.85" />
    </>
  )
}

function Slide4Illustration() {
  // Large mature tree + tiny new sapling beside it
  return (
    <svg viewBox="0 0 200 170" className="w-full h-full" fill="none">
      {/* Ground */}
      <ellipse cx="100" cy="160" rx="95" ry="16" fill="#DFF0D8" />

      {/* Large tree — trunk */}
      <path
        d="M80 155 C80 140 76 128 76 112 L84 112 C84 128 80 140 80 155 Z"
        fill="#3A2010"
      />
      {/* trunk wider bottom */}
      <path d="M73 155 C73 145 76 130 76 112 L84 112 C84 130 87 145 87 155 Z" fill="#3A2010" />

      {/* Large tree — branches */}
      <line x1="78" y1="130" x2="42" y2="115" stroke="#3A2010" strokeWidth="5" strokeLinecap="round" />
      <line x1="80" y1="120" x2="52" y2="96"  stroke="#3A2010" strokeWidth="4" strokeLinecap="round" />
      <line x1="81" y1="112" x2="62" y2="78"  stroke="#3A2010" strokeWidth="3" strokeLinecap="round" />
      <line x1="82" y1="108" x2="80" y2="52"  stroke="#3A2010" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="82" y1="108" x2="100" y2="52" stroke="#3A2010" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="83" y1="112" x2="102" y2="78" stroke="#3A2010" strokeWidth="3" strokeLinecap="round" />
      <line x1="84" y1="120" x2="112" y2="96" stroke="#3A2010" strokeWidth="4" strokeLinecap="round" />
      <line x1="82" y1="130" x2="118" y2="115" stroke="#3A2010" strokeWidth="5" strokeLinecap="round" />

      {/* Large tree — leaves */}
      {([
        [80, 48, '#2E7D32'],  [90, 44, '#388E3C'],  [70, 44, '#43A047'],
        [60, 74, '#66BB6A'],  [100, 74, '#4CAF50'],
        [45, 110, '#81C784'], [118, 110, '#81C784'],
        [40, 112, '#A5D6A7'], [122, 112, '#A5D6A7'],
        [68, 62, '#388E3C'],  [94, 62, '#388E3C'],
        [55, 94, '#66BB6A'],  [108, 94, '#66BB6A'],
      ] as [number, number, string][]).map(([cx, cy, fill], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={12} ry={16} fill={fill} opacity="0.9" />
          <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14}
            stroke="rgba(0,0,0,0.10)" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}

      {/* Tiny sapling beside the big tree */}
      <rect x="148" y="138" width="3" height="17" rx="1" fill="#3A2010" />
      <ellipse cx="149.5" cy="135" rx="7" ry="9" fill="#66BB6A" opacity="0.9" />
      <ellipse cx="144" cy="139" rx="5" ry="6" fill="#81C784" opacity="0.85" />
      <ellipse cx="155" cy="139" rx="5" ry="6" fill="#A5D6A7" opacity="0.85" />

      {/* Small sparkle near sapling — signals "new" */}
      <circle cx="162" cy="125" r="2" fill="#FFD166" opacity="0.8" />
      <line x1="162" y1="119" x2="162" y2="131" stroke="#FFD166" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="156" y1="125" x2="168" y2="125" stroke="#FFD166" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'One entry,\none leaf.',
    body: 'Each time you record something, a new leaf grows on your tree. Tap any leaf to revisit what you said that day.',
    Illustration: Slide1Illustration,
  },
  {
    title: 'Your feelings\nshape the colours.',
    body: 'The mood you choose colours the leaf. Joyful leaves are golden, peaceful ones are blue — your tree is yours alone.',
    Illustration: Slide2Illustration,
  },
  {
    title: 'Your journey\nof growth.',
    body: 'Your tree evolves as you share more. From a tiny sapling to a full, leafy canopy — each stage is a milestone.',
    Illustration: Slide3Illustration,
  },
  {
    title: "There's always\nroom to grow.",
    body: 'Once a tree is complete, a new sapling starts beside it. A new chapter, growing alongside everything before.',
    Illustration: Slide4Illustration,
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function GrowthCarousel({ onClose }: GrowthCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const isLast = index === SLIDES.length - 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, SLIDES.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40) setIndex((i) => Math.min(i + 1, SLIDES.length - 1))
    if (dx > 40)  setIndex((i) => Math.max(i - 1, 0))
    touchStartX.current = null
  }

  const slide = SLIDES[index]

  return (
    // Outer: covers full viewport, centred column inside
    <div className="fixed inset-0 z-50 flex flex-col items-center" style={{ backgroundColor: BG[index], transition: 'background-color 0.35s ease' }}>
      <div className="flex w-full max-w-[480px] flex-1 flex-col overflow-hidden">

      {/* Forest green header strip */}
      <div
        className="flex h-10 shrink-0 items-center justify-between px-5"
        style={{ backgroundColor: '#1E3A1F' }}
      >
        <span className="text-xs font-medium text-white/60 tabular-nums">
          {index + 1} / {SLIDES.length}
        </span>
        {!isLast ? (
          <button
            onClick={onClose}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Skip
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Main slide area */}
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides strip */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{
            width: `${SLIDES.length * 100}%`,
            transform: `translateX(-${(index * 100) / SLIDES.length}%)`,
          }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="relative flex flex-col px-7 pt-8 pb-6"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              {/* Sage hill decoration */}
              <SageHill />

              {/* Heading — left-aligned, forest green */}
              <h2
                className="relative z-10 whitespace-pre-line text-[1.65rem] font-bold leading-tight"
                style={{ color: '#1E3A1F' }}
              >
                {s.title}
              </h2>
              <p className="relative z-10 mt-3 text-sm leading-relaxed text-gray-500 max-w-[280px]">
                {s.body}
              </p>

              {/* Illustration box + nav arrows */}
              <div className="relative z-10 mt-auto flex items-center justify-center gap-3 pb-2">
                {/* Left arrow */}
                <button
                  onClick={() => setIndex((v) => Math.max(v - 1, 0))}
                  disabled={index === 0}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all"
                  style={{
                    backgroundColor: index === 0 ? 'transparent' : 'rgba(74,124,89,0.12)',
                    color: index === 0 ? 'transparent' : '#4A7C59',
                  }}
                  aria-label="Previous"
                >
                  <ChevLeft />
                </button>

                {/* Illustration */}
                <div className="h-44 w-full max-w-[220px]">
                  <s.Illustration />
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => setIndex((v) => Math.min(v + 1, SLIDES.length - 1))}
                  disabled={isLast}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all"
                  style={{
                    backgroundColor: isLast ? 'transparent' : 'rgba(74,124,89,0.12)',
                    color: isLast ? 'transparent' : '#4A7C59',
                  }}
                  aria-label="Next"
                >
                  <ChevRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar — dots + CTA */}
      <div className="shrink-0 px-7 pb-10 pt-2">
        {/* Dot progress */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: i === index ? 20 : 6,
                backgroundColor: i === index ? '#4A7C59' : '#D1D5DB',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA on last slide */}
        {isLast && (
          <button
            onClick={onClose}
            className="w-full rounded-full py-4 text-base font-medium text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: '#1E3A1F' }}
          >
            Open my garden →
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
