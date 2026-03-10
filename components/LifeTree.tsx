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

// Deterministic jitter from entry id + salt
function idInt(id: string, salt: number, min: number, max: number): number {
  let h = salt
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffff
  return min + (Math.abs(h) % (max - min + 1))
}

// ── Geometry ─────────────────────────────────────────────────────────────────

const CX = 180       // trunk centre x
const GROUND_Y = 326 // y where trunk meets ground

// [topY, baseHalfWidth, topHalfWidth]
const TRUNK: Record<Stage, [number, number, number]> = {
  empty:        [GROUND_Y, 0,  0 ],
  sapling:      [278,      7,  4 ],
  plant:        [248,      10, 6 ],
  'small-tree': [212,      13, 8 ],
  'big-tree':   [172,      18, 10],
}

// [x1, y1, x2, y2, strokeWidth]
type Seg = [number, number, number, number, number]

const BRANCHES: Record<Stage, Seg[]> = {
  empty:   [],
  sapling: [],
  plant: [
    [177, 250, 108, 228, 8],  // left
    [183, 250, 252, 228, 8],  // right
  ],
  'small-tree': [
    [174, 252, 52,  285, 10], // far left
    [175, 232, 86,  210, 9],  // left mid
    [177, 215, 112, 172, 8],  // left upper
    [178, 202, 148, 132, 7],  // center-left
    [182, 202, 212, 132, 7],  // center-right
    [183, 215, 248, 172, 8],  // right upper
    [185, 232, 274, 210, 9],  // right mid
    [186, 252, 308, 285, 10], // far right
  ],
  'big-tree': [
    [173, 258, 12,  295, 13], // far-left near-horizontal
    [174, 232, 44,  224, 11], // left mid
    [175, 212, 70,  165, 10], // left upper
    [70,  165, 40,  134, 7],  // left upper secondary
    [177, 196, 116, 114, 9],  // center-left
    [116, 114, 86,  84,  7],  // center-left secondary
    [179, 183, 150, 76,  8],  // top-left
    [181, 183, 210, 76,  8],  // top-right
    [183, 196, 244, 114, 9],  // center-right
    [244, 114, 274, 84,  7],  // center-right secondary
    [185, 212, 290, 165, 10], // right upper
    [290, 165, 320, 134, 7],  // right upper secondary
    [186, 232, 316, 224, 11], // right mid
    [187, 258, 348, 295, 13], // far-right near-horizontal
  ],
}

// Leaf slot positions [x, y] per stage
const LEAF_SLOTS: Record<Stage, [number, number][]> = {
  empty: [],
  sapling: [
    [180, 270], [172, 264], [188, 264],
    [163, 270], [197, 270], [178, 258],
  ],
  plant: [
    [100, 222], [110, 228], [93,  228], [114, 220], // left tip
    [248, 222], [258, 228], [243, 228], [252, 220], // right tip
    [132, 228], [146, 225],                          // left mid
    [214, 228], [228, 225],                          // right mid
    [180, 244], [173, 238],                          // trunk top
  ],
  'small-tree': [
    [44,  279], [58,  287], [38,  273], [56,  274],       // far left
    [80,  204], [92,  212], [76,  212],                    // left mid
    [106, 167], [118, 163], [102, 174],                    // left upper
    [142, 126], [152, 120], [138, 132],                    // center-left
    [218, 126], [208, 120], [222, 132],                    // center-right
    [244, 167], [256, 163], [250, 174],                    // right upper
    [270, 204], [282, 212], [274, 212],                    // right mid
    [304, 279], [316, 287], [298, 273], [310, 274],        // far right
    [180, 196], [172, 188], [188, 188], [165, 184],        // top area
  ],
  'big-tree': [
    // Far-left cluster
    [6,   288], [18,  298], [12,  282], [26,  292], [14,  302],
    // Left mid cluster
    [36,  218], [50,  226], [44,  212],
    // Left upper cluster
    [62,  158], [74,  165], [66,  172], [56,  163],
    // Left upper secondary cluster
    [33,  128], [48,  124], [40,  136],
    // Center-left cluster
    [110, 108], [120, 114], [106, 120],
    // Center-left secondary cluster
    [80,  78],  [90,  85],  [84,  92],
    // Top-left cluster
    [142, 70],  [154, 77],  [146, 82],  [158, 67],
    // Top-right cluster
    [202, 70],  [214, 77],  [207, 82],  [220, 67],
    // Center-right cluster
    [240, 108], [250, 114], [254, 120],
    // Center-right secondary cluster
    [270, 78],  [280, 85],  [274, 92],
    // Right upper cluster
    [284, 158], [296, 165], [288, 172], [302, 163],
    // Right upper secondary cluster
    [314, 128], [328, 124], [320, 136],
    // Right mid cluster
    [310, 218], [322, 226], [316, 212],
    // Far-right cluster
    [342, 288], [354, 298], [347, 282], [358, 292], [345, 302],
  ],
}

// Grass tuft x-positions at trunk base
const GRASS_X = [138, 152, 163, 173, 181, 190, 200, 211, 223]

// ── Component ────────────────────────────────────────────────────────────────

export default function LifeTree({ entries, totalEntries, onLeafTap }: LifeTreeProps) {
  const stage = getStage(totalEntries)
  const slots = LEAF_SLOTS[stage]
  const segs = BRANCHES[stage]
  const [topY, baseHW, topHW] = TRUNK[stage]
  const ordered = [...entries].reverse()

  const newestId = entries[0]?.id
  const newestAge = entries[0]
    ? (Date.now() - new Date(entries[0].created_at).getTime()) / 1000
    : Infinity
  const hasFreshLeaf = newestAge < 300

  if (stage === 'empty') {
    return (
      <svg viewBox="0 0 360 380" className="w-full max-w-[280px]">
        <text x="180" y="240" textAnchor="middle" fill="#9CA3AF" fontSize="14">
          Plant your first seed 🌱
        </text>
      </svg>
    )
  }

  const trunkH = GROUND_Y - topY
  const trunkPath = [
    `M ${CX - baseHW} ${GROUND_Y}`,
    `C ${CX - baseHW} ${GROUND_Y - trunkH * 0.3}`,
    `  ${CX - topHW - 1} ${topY + trunkH * 0.25}`,
    `  ${CX - topHW} ${topY}`,
    `L ${CX + topHW} ${topY}`,
    `C ${CX + topHW + 1} ${topY + trunkH * 0.25}`,
    `  ${CX + baseHW} ${GROUND_Y - trunkH * 0.3}`,
    `  ${CX + baseHW} ${GROUND_Y} Z`,
  ].join(' ')

  return (
    <svg viewBox="0 0 360 380" className="w-full max-w-[280px]">
      <defs>
        <style>{`
          @keyframes leafIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @keyframes leafSway {
            0%, 100% { transform: rotate(-1.8deg); }
            50%       { transform: rotate(1.8deg); }
          }
        `}</style>
      </defs>

      {/* Ground hill */}
      <ellipse cx="180" cy="368" rx="215" ry="50" fill="#DFF0D8" />
      <ellipse cx="75"  cy="355" rx="105" ry="34" fill="#D0EAC5" opacity="0.55" />

      {/* Branches — before trunk so trunk covers their roots */}
      {segs.map(([x1, y1, x2, y2, w], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#3A2010"
          strokeWidth={w}
          strokeLinecap="round"
        />
      ))}

      {/* Trunk — filled tapered polygon drawn over branch roots */}
      <path d={trunkPath} fill="#3A2010" />

      {/* Grass tufts at trunk base */}
      {GRASS_X.map((gx, i) => {
        const h = 10 + (i % 3) * 5
        const tilt = i % 2 === 0 ? -1 : 1
        return (
          <g key={i} transform={`translate(${gx}, ${GROUND_Y})`}>
            <path d={`M 0,0 Q ${tilt * 3},-${h * 0.55} ${tilt},-${h}`}
              stroke="#1E5C1E" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={`M 0,0 Q ${tilt * -2},-${h * 0.5} 0,-${h * 0.82}`}
              stroke="#2D7A2D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d={`M 0,0 Q ${tilt},-${h * 0.45} ${tilt * -1},-${h * 0.72}`}
              stroke="#1E5C1E" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )
      })}

      {/* Leaves */}
      {ordered.slice(0, slots.length).map((entry, i) => {
        const [sx, sy] = slots[i]
        const dx = idInt(entry.id, 7,  -4, 4)
        const dy = idInt(entry.id, 13, -4, 4)
        const rot = idInt(entry.id, 19, -30, 30)
        const color = getMoodColor(entry.mood_word)
        const isFresh = hasFreshLeaf && entry.id === newestId
        const swayDur   = (2.6 + (i % 5) * 0.42).toFixed(2)
        const swayDelay = ((i * 0.31) % 2.8).toFixed(2)

        return (
          <g
            key={entry.id}
            transform={`translate(${sx + dx}, ${sy + dy}) rotate(${rot})`}
            onClick={() => onLeafTap?.(entry)}
            style={onLeafTap ? { cursor: 'pointer' } : undefined}
          >
            {/* Continuous sway */}
            <g style={{
              animation: `leafSway ${swayDur}s ${swayDelay}s ease-in-out infinite`,
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}>
              {/* Scale-in for freshly added leaf */}
              <g style={isFresh ? {
                animation: 'leafIn 0.45s ease-out both',
                transformBox: 'fill-box',
                transformOrigin: 'center',
              } : undefined}>
                <ellipse cx={0} cy={0} rx={11} ry={15} fill={color} opacity="0.92" />
                <line x1={0} y1={-13} x2={0} y2={13}
                  stroke="rgba(0,0,0,0.14)" strokeWidth="1" strokeLinecap="round" />
              </g>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
