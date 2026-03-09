'use client'

import { getMoodColor } from '@/lib/moodColors'

export interface LeafEntry {
  id: string
  mood_word: string
  created_at: string
  ai_summary_short?: string | null
}

interface FingerprintShape {
  relationship_contexts?: string[]
}

interface LifeTreeProps {
  entries: LeafEntry[]
  totalEntries: number
  onLeafTap?: (entry: LeafEntry) => void
  fingerprint?: FingerprintShape | null
}

type Stage = 'empty' | 'sapling' | 'plant' | 'small-tree' | 'big-tree'

function getStage(n: number): Stage {
  if (n === 0) return 'empty'
  if (n <= 6) return 'sapling'
  if (n <= 15) return 'plant'
  if (n <= 35) return 'small-tree'
  return 'big-tree'
}

function idOff(id: string, salt: number, range = 5): number {
  let h = salt
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  return ((h % (range * 2 + 1)) - range)
}

const CX = 140
const GROUND = 222

const SLOTS: Record<Stage, [number, number][]> = {
  empty: [],
  sapling: [
    [140, 174], [131, 181], [149, 181],
    [124, 170], [156, 170], [140, 163],
  ],
  plant: [
    [138, 144], [144, 138], [132, 132], [148, 132], [140, 126],
    [120, 154], [105, 140], [93, 129], [85, 120],
    [160, 154], [175, 140], [187, 129], [195, 120],
    [128, 165], [152, 165],
  ],
  'small-tree': [
    [140, 83], [132, 77], [148, 77], [124, 72], [156, 72],
    [136, 66], [144, 66], [140, 60],
    [122, 191], [107, 177], [91, 163], [77, 151], [67, 139],
    [158, 191], [173, 177], [189, 163], [203, 151], [213, 139],
    [120, 137], [106, 123], [92, 111], [82, 101],
    [160, 137], [174, 123], [188, 111], [198, 101],
    [130, 161], [150, 161], [127, 179], [153, 179], [135, 149], [145, 149], [140, 172],
  ],
  'big-tree': [
    [140, 26], [130, 20], [150, 20], [120, 16], [160, 16],
    [136, 11], [144, 11], [128, 7], [152, 7], [140, 4],
    [118, 184], [100, 168], [82, 154], [68, 140], [56, 126], [46, 114],
    [162, 184], [180, 168], [198, 154], [212, 140], [224, 126], [234, 114],
    [120, 129], [104, 113], [88, 99], [76, 87],
    [160, 129], [176, 113], [192, 99], [204, 87],
    [126, 69], [112, 57], [100, 47],
    [154, 69], [168, 57], [180, 47],
    [130, 152], [150, 152], [128, 170], [152, 170], [126, 188], [154, 188],
    [134, 33], [146, 33], [138, 40], [142, 40],
  ],
}

const TRUNK: Record<Stage, { height: number; width: number }> = {
  empty:        { height: 0,   width: 0  },
  sapling:      { height: 42,  width: 3  },
  plant:        { height: 82,  width: 5  },
  'small-tree': { height: 142, width: 8  },
  'big-tree':   { height: 202, width: 13 },
}

export default function LifeTree({ entries, totalEntries, onLeafTap, fingerprint }: LifeTreeProps) {
  const stage = getStage(totalEntries)
  const slots = SLOTS[stage]
  const { height: th, width: tw } = TRUNK[stage]
  const trunkTop = GROUND - th
  const ordered = [...entries].reverse()

  const newestId = entries[0]?.id
  const newestAge = entries[0]
    ? (Date.now() - new Date(entries[0].created_at).getTime()) / 1000
    : Infinity
  const hasFreshLeaf = newestAge < 300

  // Widen branches if fingerprint has 3+ relationship contexts
  const wideSpread = (fingerprint?.relationship_contexts?.length ?? 0) >= 3
  const spreadMult = wideSpread ? 1.22 : 1.0

  // Root depth proportional to entry count, 12–42px range
  const rootLen = stage === 'empty' ? 0 : Math.max(12, Math.min((totalEntries / 50) * 42, 42))

  if (stage === 'empty') {
    return (
      <svg viewBox="0 0 280 280" className="w-full max-w-[280px]">
        <text x="140" y="210" textAnchor="middle" fill="#9CA3AF" fontSize="13">
          Plant your first seed 🌱
        </text>
      </svg>
    )
  }

  type Branch = [number, number, number, number]
  const branches: Branch[] = []
  if (stage === 'plant' || stage === 'small-tree' || stage === 'big-tree') {
    const bY = GROUND - th * 0.58
    const ex = 44 * spreadMult
    branches.push([bY, CX - ex, GROUND - th * 0.80, tw * 0.52])
    branches.push([bY, CX + ex, GROUND - th * 0.80, tw * 0.52])
  }
  if (stage === 'small-tree' || stage === 'big-tree') {
    const bY = GROUND - th * 0.78
    const ex = 58 * spreadMult
    branches.push([bY, CX - ex, GROUND - th * 0.93, tw * 0.40])
    branches.push([bY, CX + ex, GROUND - th * 0.93, tw * 0.40])
  }
  if (stage === 'big-tree') {
    const bY = GROUND - th * 0.88
    const ex = 24 * spreadMult
    branches.push([bY, CX - ex, GROUND - th * 0.97, tw * 0.28])
    branches.push([bY, CX + ex, GROUND - th * 0.97, tw * 0.28])
  }

  // Canopy centre for glow
  const canopyY = trunkTop + (th * 0.35)

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px]">
      <defs>
        <radialGradient id="canopyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#2D6A2D" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#2D6A2D" stopOpacity="0"    />
        </radialGradient>
        <style>{`
          @keyframes leafIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @keyframes leafSway {
            0%, 100% { transform: rotate(-2deg); }
            50%      { transform: rotate(2deg);  }
          }
        `}</style>
      </defs>

      {/* Canopy glow */}
      <ellipse
        cx={CX}
        cy={canopyY}
        rx={Math.min(th * 0.55, 72)}
        ry={Math.min(th * 0.50, 65)}
        fill="url(#canopyGlow)"
      />

      {/* Ground */}
      <line x1="55" y1={GROUND} x2="225" y2={GROUND}
        stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" />

      {/* Roots — length proportional to entry count */}
      <path
        d={`M ${CX} ${GROUND} Q ${CX - 18} ${GROUND + rootLen * 0.55} ${CX - rootLen * 0.82} ${GROUND + rootLen}`}
        stroke="#8B6914" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
      <path
        d={`M ${CX} ${GROUND} Q ${CX + 2} ${GROUND + rootLen * 0.48} ${CX + 2} ${GROUND + rootLen}`}
        stroke="#8B6914" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.35" />
      <path
        d={`M ${CX} ${GROUND} Q ${CX + 18} ${GROUND + rootLen * 0.55} ${CX + rootLen * 0.82} ${GROUND + rootLen}`}
        stroke="#8B6914" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />

      {/* Trunk */}
      <path
        d={`M ${CX} ${GROUND} C ${CX + 4} ${GROUND - th * 0.38} ${CX - 3} ${GROUND - th * 0.68} ${CX} ${trunkTop}`}
        stroke="#8B7355"
        strokeWidth={tw}
        fill="none"
        strokeLinecap="round"
      />

      {/* Branches */}
      {branches.map(([fromY, ex, ey, bw], i) => {
        const side = i % 2 === 0 ? -1 : 1
        const cpx = CX + side * tw * 1.2
        return (
          <path
            key={i}
            d={`M ${CX} ${fromY} Q ${cpx} ${(fromY + ey) / 2} ${ex} ${ey}`}
            stroke="#8B7355"
            strokeWidth={Math.max(bw, 1.5)}
            fill="none"
            strokeLinecap="round"
          />
        )
      })}

      {/* Leaves — nested <g> separates positioning, sway, and fresh-scale */}
      {ordered.slice(0, slots.length).map((entry, i) => {
        const [sx, sy] = slots[i]
        const x = sx + idOff(entry.id, 7)
        const y = sy + idOff(entry.id, 13)
        const rot = idOff(entry.id, 19, 20)
        const color = getMoodColor(entry.mood_word)
        const isFreshLeaf = hasFreshLeaf && entry.id === newestId
        const swayDur = (2.8 + (i % 3) * 0.45).toFixed(2)
        const swayDelay = (i * 0.38).toFixed(2)

        return (
          // Outer g: position + base rotation
          <g
            key={entry.id}
            transform={`translate(${x}, ${y}) rotate(${rot})`}
            onClick={() => onLeafTap?.(entry)}
            style={onLeafTap ? { cursor: 'pointer' } : undefined}
          >
            {/* Middle g: continuous sway */}
            <g style={{
              animation: `leafSway ${swayDur}s ${swayDelay}s ease-in-out infinite`,
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}>
              {/* Inner g: fresh-leaf scale-in (only when just added) */}
              <g style={isFreshLeaf ? {
                animation: 'leafIn 0.4s ease-out both',
                transformBox: 'fill-box',
                transformOrigin: 'center',
              } : undefined}>
                <ellipse cx={0} cy={0} rx={6} ry={8} fill={color} opacity="0.9" />
              </g>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
