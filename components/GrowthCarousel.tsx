'use client'

import { useEffect, useRef, useState } from 'react'

interface GrowthCarouselProps {
  onClose: () => void
}

const SLIDES = [
  {
    icon: '🍃',
    title: 'One entry, one leaf',
    body: 'Each time you share something, a new leaf grows on your tree. Tap any leaf to see what you said that day.',
    illustration: (
      <svg viewBox="0 0 120 120" className="w-28 h-28">
        <ellipse cx="60" cy="60" rx="28" ry="38" fill="#A8D8A8" opacity="0.9"
          transform="rotate(-20, 60, 60)" />
        <line x1="60" y1="98" x2="60" y2="60" stroke="#8B7355" strokeWidth="2.5"
          strokeLinecap="round" />
      </svg>
    ),
  },
  {
    icon: '🎨',
    title: 'Your feelings shape the colours',
    body: 'The mood you choose at the end of each entry gives your leaf its colour. Every tree tells a unique story.',
    illustration: (
      <svg viewBox="0 0 140 100" className="w-36 h-24">
        {[
          ['#FFD166', -48, 0, -15],
          ['#FF8FAB', -20, -8, 10],
          ['#AED9E0', 10, 4, -8],
          ['#A8D8A8', 36, -4, 20],
          ['#C9A96E', 60, 6, -12],
        ].map(([fill, dx, dy, rot]) => (
          <ellipse key={String(dx)} cx={70 + Number(dx)} cy={50 + Number(dy)}
            rx="16" ry="22" fill={String(fill)} opacity="0.9"
            transform={`rotate(${rot}, ${70 + Number(dx)}, ${50 + Number(dy)})`} />
        ))}
      </svg>
    ),
  },
  {
    icon: '🌳',
    title: 'Your journey of growth',
    body: 'Your tree evolves as you do — from a tiny sapling to a full, leafy tree as your entries grow. 1–6, 7–15, 16–35, 36–50.',
    illustration: (
      <svg viewBox="0 0 200 130" className="w-48 h-32">
        {/* Sapling */}
        <line x1="28" y1="110" x2="28" y2="90" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="28" cy="83" rx="8" ry="10" fill="#A8D8A8" opacity="0.85" />
        {/* Plant */}
        <line x1="72" y1="110" x2="72" y2="80" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" />
        <path d="M72 95 Q56 88 50 80" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M72 95 Q88 88 94 80" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="72" cy="74" rx="12" ry="14" fill="#6EBF6E" opacity="0.85" />
        <ellipse cx="52" cy="77" rx="7" ry="9" fill="#A8D8A8" opacity="0.8" />
        <ellipse cx="92" cy="77" rx="7" ry="9" fill="#A8D8A8" opacity="0.8" />
        {/* Tree */}
        <line x1="130" y1="110" x2="130" y2="55" stroke="#8B7355" strokeWidth="5" strokeLinecap="round" />
        <path d="M130 85 Q108 76 96 65" stroke="#8B7355" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M130 85 Q152 76 164 65" stroke="#8B7355" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="130" cy="50" rx="24" ry="28" fill="#4A9C4A" opacity="0.85" />
        <ellipse cx="96" cy="62" rx="14" ry="17" fill="#6EBF6E" opacity="0.8" />
        <ellipse cx="164" cy="62" rx="14" ry="17" fill="#6EBF6E" opacity="0.8" />
        {/* Ground */}
        <line x1="8" y1="110" x2="192" y2="110" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    icon: '🌱',
    title: "There's always room to grow",
    body: "Once a tree is complete, a new sapling starts beside it. A new chapter, growing alongside everything that came before.",
    illustration: (
      <svg viewBox="0 0 180 130" className="w-44 h-32">
        {/* Full tree */}
        <line x1="70" y1="110" x2="70" y2="45" stroke="#8B7355" strokeWidth="7" strokeLinecap="round" />
        <path d="M70 80 Q46 70 34 58" stroke="#8B7355" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M70 80 Q94 70 106 58" stroke="#8B7355" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="70" cy="40" rx="30" ry="34" fill="#4A9C4A" opacity="0.85" />
        <ellipse cx="34" cy="55" rx="17" ry="20" fill="#6EBF6E" opacity="0.8" />
        <ellipse cx="106" cy="55" rx="17" ry="20" fill="#6EBF6E" opacity="0.8" />
        {/* Sapling beside it */}
        <line x1="138" y1="110" x2="138" y2="88" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="138" cy="82" rx="9" ry="12" fill="#A8D8A8" opacity="0.9" />
        {/* Ground */}
        <line x1="8" y1="110" x2="172" y2="110" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function GrowthCarousel({ onClose }: GrowthCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const isLast = index === SLIDES.length - 1

  // Keyboard navigation
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white pb-10 pt-6 shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top row */}
        <div className="flex items-center justify-between px-6">
          <span className="text-xs text-gray-300">{index + 1} / {SLIDES.length}</span>
          {!isLast && (
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
              Skip
            </button>
          )}
        </div>

        {/* Slide content — overflow hidden clip for slide transition */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className="w-full shrink-0 flex flex-col items-center px-8 pt-6 pb-2"
              >
                {/* Illustration */}
                <div className="flex h-36 items-center justify-center">
                  {s.illustration}
                </div>

                {/* Icon + heading */}
                <p className="mt-4 text-3xl">{s.icon}</p>
                <h2 className="mt-2 text-center text-xl font-semibold text-gray-900 leading-snug">
                  {s.title}
                </h2>
                <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed max-w-[300px]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? 'w-5 bg-green-700' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* CTA on last slide */}
        {isLast && (
          <div className="mt-6 px-8">
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity active:opacity-80"
            >
              View your garden →
            </button>
          </div>
        )}

        {/* Nav arrows (non-last slides) */}
        {!isLast && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="text-sm text-green-700 font-medium hover:underline"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
