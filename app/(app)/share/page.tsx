'use client'

import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { trackEvent } from '@/lib/gtag'

interface CardData {
  innerWeather: string
  recentMoods: string[]
  totalEntries: number
  growthStage: string
  referralCode?: string
}

type Variant = 'square' | 'story'

// ─── Card tree SVG ────────────────────────────────────────────────────────────

function CardTree({ growthStage }: { growthStage: string }) {
  const isSapling = growthStage === 'seed' || growthStage === 'sapling'
  const isPlant   = growthStage === 'plant'
  const trunkH    = isSapling ? 60 : isPlant ? 100 : 140
  const trunkW    = isSapling ? 5  : isPlant ? 7   : 11
  const gy        = 360
  const ty        = gy - trunkH

  return (
    <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <line x1="180" y1={gy} x2="420" y2={gy} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d={`M 300 ${gy} Q 278 ${gy+18} 256 ${gy+30}`} stroke="#3D6B3D" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d={`M 300 ${gy} Q 300 ${gy+16} 300 ${gy+32}`} stroke="#3D6B3D" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d={`M 300 ${gy} Q 322 ${gy+18} 344 ${gy+30}`} stroke="#3D6B3D" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d={`M 300 ${gy} C 303 ${gy - trunkH*0.4} 297 ${gy - trunkH*0.7} 300 ${ty}`}
        stroke="#4A7A3A" strokeWidth={trunkW} fill="none" strokeLinecap="round"/>
      {!isSapling && (<>
        <path d={`M 300 ${gy - trunkH*0.55} Q 270 ${gy - trunkH*0.63} 244 ${gy - trunkH*0.76}`}
          stroke="#4A7A3A" strokeWidth={trunkW * 0.5} fill="none" strokeLinecap="round"/>
        <path d={`M 300 ${gy - trunkH*0.55} Q 330 ${gy - trunkH*0.63} 356 ${gy - trunkH*0.76}`}
          stroke="#4A7A3A" strokeWidth={trunkW * 0.5} fill="none" strokeLinecap="round"/>
      </>)}
      {(growthStage === 'tree' || growthStage === 'ancient tree') && (<>
        <path d={`M 300 ${gy - trunkH*0.78} Q 276 ${gy - trunkH*0.87} 258 ${gy - trunkH*0.96}`}
          stroke="#4A7A3A" strokeWidth={trunkW * 0.38} fill="none" strokeLinecap="round"/>
        <path d={`M 300 ${gy - trunkH*0.78} Q 324 ${gy - trunkH*0.87} 342 ${gy - trunkH*0.96}`}
          stroke="#4A7A3A" strokeWidth={trunkW * 0.38} fill="none" strokeLinecap="round"/>
      </>)}
      {isSapling && (<>
        <ellipse cx="300" cy={ty-10} rx="11" ry="15" fill="#C5E5C5" opacity="0.9" transform={`rotate(-8, 300, ${ty-10})`}/>
        <ellipse cx="288" cy={ty-2}  rx="9"  ry="12" fill="#A8D8A8" opacity="0.8" transform={`rotate(14, 288, ${ty-2})`}/>
        <ellipse cx="312" cy={ty-2}  rx="9"  ry="12" fill="#D4F4D4" opacity="0.8" transform={`rotate(-14, 312, ${ty-2})`}/>
      </>)}
      {isPlant && (<>
        <ellipse cx="300" cy={ty-12} rx="12" ry="16" fill="#C5E5C5" opacity="0.9" transform={`rotate(-5, 300, ${ty-12})`}/>
        <ellipse cx="286" cy={ty-4}  rx="10" ry="13" fill="#A8D8A8" opacity="0.85" transform={`rotate(15, 286, ${ty-4})`}/>
        <ellipse cx="314" cy={ty-4}  rx="10" ry="13" fill="#D4F4D4" opacity="0.85" transform={`rotate(-15, 314, ${ty-4})`}/>
        <ellipse cx="244" cy={gy - trunkH*0.76 - 10} rx="11" ry="14" fill="#B8E0B8" opacity="0.8" transform={`rotate(20, 244, ${gy - trunkH*0.76 - 10})`}/>
        <ellipse cx="356" cy={gy - trunkH*0.76 - 10} rx="11" ry="14" fill="#B8E0B8" opacity="0.8" transform={`rotate(-20, 356, ${gy - trunkH*0.76 - 10})`}/>
        <ellipse cx="276" cy={ty-8}  rx="8"  ry="11" fill="#D4F4D4" opacity="0.75" transform={`rotate(8, 276, ${ty-8})`}/>
        <ellipse cx="324" cy={ty-8}  rx="8"  ry="11" fill="#C5E5C5" opacity="0.75" transform={`rotate(-8, 324, ${ty-8})`}/>
      </>)}
      {(growthStage === 'tree' || growthStage === 'ancient tree') && (<>
        <ellipse cx="300" cy={ty-14} rx="14" ry="18" fill="#C5E5C5" opacity="0.9" transform={`rotate(-4, 300, ${ty-14})`}/>
        <ellipse cx="282" cy={ty-5}  rx="12" ry="15" fill="#A8D8A8" opacity="0.85" transform={`rotate(14, 282, ${ty-5})`}/>
        <ellipse cx="318" cy={ty-5}  rx="12" ry="15" fill="#D4F4D4" opacity="0.85" transform={`rotate(-14, 318, ${ty-5})`}/>
        <ellipse cx="268" cy={ty+6}  rx="10" ry="13" fill="#B8E0B8" opacity="0.8" transform={`rotate(20, 268, ${ty+6})`}/>
        <ellipse cx="332" cy={ty+6}  rx="10" ry="13" fill="#C5E5C5" opacity="0.8" transform={`rotate(-20, 332, ${ty+6})`}/>
        <ellipse cx="244" cy={gy - trunkH*0.78} rx="13" ry="16" fill="#A8D8A8" opacity="0.8" transform={`rotate(22, 244, ${gy - trunkH*0.78})`}/>
        <ellipse cx="356" cy={gy - trunkH*0.78} rx="13" ry="16" fill="#B8E0B8" opacity="0.8" transform={`rotate(-22, 356, ${gy - trunkH*0.78})`}/>
        <ellipse cx="258" cy={gy - trunkH*0.97} rx="10" ry="13" fill="#D4F4D4" opacity="0.78" transform={`rotate(16, 258, ${gy - trunkH*0.97})`}/>
        <ellipse cx="342" cy={gy - trunkH*0.97} rx="10" ry="13" fill="#C5E5C5" opacity="0.78" transform={`rotate(-16, 342, ${gy - trunkH*0.97})`}/>
        <ellipse cx="290" cy={ty-22} rx="9" ry="11" fill="#D4F4D4" opacity="0.7"/>
        <ellipse cx="310" cy={ty-22} rx="9" ry="11" fill="#C5E5C5" opacity="0.7"/>
      </>)}
    </svg>
  )
}

// ─── Card layouts ─────────────────────────────────────────────────────────────

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const CARD_BASE: React.CSSProperties = {
  backgroundColor: '#1E3A1F',
  borderRadius: 28,
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

function CardContent({ data, variant }: { data: CardData; variant: Variant }) {
  const isStory = variant === 'story'
  const W = 600
  const H = isStory ? 1067 : 600

  return (
    <div style={{ ...CARD_BASE, width: W, height: H,
      justifyContent: 'space-between',
      padding: isStory ? '96px 64px 80px' : '52px 48px 48px',
    }}>
      {/* Grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: 0.04, backgroundImage: GRAIN_BG,
        backgroundRepeat: 'repeat', backgroundSize: '200px 200px',
      }}/>

      {/* Tree illustration */}
      <div style={{ width: isStory ? 340 : 280, height: isStory ? 320 : 260, position: 'relative', zIndex: 2 }}>
        <CardTree growthStage={data.growthStage}/>
      </div>

      {/* Inner weather */}
      <div style={{ textAlign: 'center', zIndex: 2 }}>
        <p style={{
          fontSize: isStory ? 48 : 40,
          fontWeight: 400,
          color: '#F0F7F0',
          letterSpacing: '0.04em',
          lineHeight: 1.3,
          margin: 0,
        }}>
          {data.innerWeather}
        </p>
      </div>

      {/* Brand mark */}
      <div style={{ textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(240,247,240,0.85)', margin: 0, letterSpacing: '0.08em' }}>
          unposted
        </p>
        <p style={{ fontSize: 12, color: 'rgba(144,190,144,0.7)', margin: '4px 0 0', letterSpacing: '0.05em' }}>
          {data.referralCode
            ? `join via unposted.arre.co.in/${data.referralCode}`
            : 'arre.co.in/unposted'}
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SharePage() {
  const [cardData, setCardData]   = useState<CardData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast]         = useState(false)
  const [variant, setVariant]     = useState<Variant>('square')
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    trackEvent('share_card_opened')
    fetch('/api/share/card-data')
      .then((r) => r.json())
      .then((d) => { setCardData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function exportCard() {
    if (!cardRef.current || !cardData) return
    setExporting(true)
    try {
      let canvas: HTMLCanvasElement
      try {
        canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          foreignObjectRendering: true,
          logging: false,
        })
        // Sanity-check: if the canvas is mostly transparent, SVG wasn't captured
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const pixel = ctx.getImageData(canvas.width / 2, canvas.height / 4, 1, 1).data
          if (pixel[3] === 0) {
            console.warn('html2canvas: SVG not captured, retrying without foreignObjectRendering')
            canvas = await html2canvas(cardRef.current, {
              scale: 2, useCORS: true, backgroundColor: '#1E3A1F', logging: false,
            })
          }
        }
      } catch (e) {
        console.warn('html2canvas error, retrying with safe settings:', e)
        canvas = await html2canvas(cardRef.current, {
          scale: 2, backgroundColor: '#1E3A1F', logging: false,
        })
      }

      const filename = `my-unposted-${variant}.png`

      if (typeof navigator.share === 'function') {
        // Mobile: use Web Share API
        canvas.toBlob(async (blob) => {
          if (!blob) return
          try {
            trackEvent('share_card_shared')
            await navigator.share({
              files: [new File([blob], filename, { type: 'image/png' })],
              title: 'My Unposted card',
            })
          } catch {
            // User cancelled or share failed — fall back to download
            triggerDownload(canvas, filename)
          }
        }, 'image/png')
      } else {
        triggerDownload(canvas, filename)
      }

      setToast(true)
      setTimeout(() => setToast(false), 3500)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
    trackEvent('share_card_exported')
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = filename
    a.click()
  }

  // Preview dimensions
  const SQUARE_DISPLAY = 432
  const STORY_W_DISPLAY = 312
  const STORY_H_DISPLAY = 556 // 312 * (1067/600) ≈ 556

  const isStory = variant === 'story'
  const displayW = isStory ? STORY_W_DISPLAY : SQUARE_DISPLAY
  const displayH = isStory ? STORY_H_DISPLAY : SQUARE_DISPLAY
  const cardW    = 600
  const cardH    = isStory ? 1067 : 600
  const scale    = displayW / cardW

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-24 pt-12">
      <h1 className="text-xl font-semibold text-gray-900">Your card</h1>
      <p className="mt-1 text-sm text-gray-400">Your inner weather, distilled.</p>

      {/* Variant toggle */}
      <div className="mt-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['square', 'story'] as Variant[]).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              variant === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {v === 'square' ? '1:1 Square' : '9:16 Story'}
          </button>
        ))}
      </div>

      {/* Card preview container */}
      <div className="mt-6 flex justify-center" style={{ width: displayW, height: displayH }}>
        {loading ? (
          <div className="flex w-full h-full items-center justify-center rounded-3xl bg-[#1E3A1F]">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400"/>
          </div>
        ) : cardData ? (
          /* Scale wrapper — CSS transform, layout stays at cardW×cardH for html2canvas */
          <div
            ref={cardRef}
            style={{
              width: cardW,
              height: cardH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              flexShrink: 0,
            }}
          >
            <CardContent data={cardData} variant={variant}/>
          </div>
        ) : (
          <div className="flex w-full h-full items-center justify-center rounded-3xl bg-[#1E3A1F]">
            <p className="text-sm text-green-400">Could not load card.</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {cardData && (
        <div className="mt-8 w-full max-w-[432px] flex flex-col gap-3">
          <button
            onClick={exportCard}
            disabled={exporting}
            className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-60"
          >
            {exporting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                Exporting…
              </span>
            ) : (
              'Save to camera roll'
            )}
          </button>
          <button
            onClick={exportCard}
            disabled={exporting}
            className="w-full rounded-2xl border border-green-700 py-3.5 text-base font-medium text-green-700 transition-opacity disabled:opacity-60"
          >
            Share
          </button>
        </div>
      )}

      {/* Toast */}
      <div
        className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-800 px-5 py-2.5 text-sm text-white shadow-lg transition-opacity duration-300"
        style={{ opacity: toast ? 1 : 0, pointerEvents: 'none' }}
      >
        Saved! Post it anywhere you&apos;d like 🌿
      </div>
    </div>
  )
}
