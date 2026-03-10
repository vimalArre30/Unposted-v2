import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

export interface EntryNode {
  id: string
  date: string
  type: 'entry'
  mood: string | null
  summary: string | null
  branch: null
}

export interface FingerprintBranch {
  id: string
  type: 'fingerprint'
  entity: string
  branch: 'left' | 'right'
  firstSignal: string
  entryIndex: number
}

// Module-level cache: `${userId}:${entryCount}` → branches
// Avoids repeated GPT-4o calls for the same fingerprint snapshot.
const branchCache = new Map<string, FingerprintBranch[]>()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '10', 10), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Entry nodes (paginated, chronological ASC) ──────────────────────────────
  const { data: entries, error: entriesError, count: totalCount } = await supabase
    .from('entries')
    .select('id, mood_word, ai_summary_short, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 })
  }

  const total = totalCount ?? 0
  const nodes: EntryNode[] = (entries ?? []).map((e) => ({
    id: e.id,
    date: e.created_at,
    type: 'entry',
    mood: e.mood_word ?? null,
    summary: e.ai_summary_short ?? null,
    branch: null,
  }))

  // ── Fingerprint branch nodes (not paginated — max 8) ────────────────────────
  const { data: fp } = await supabase
    .from('emotion_fingerprint')
    .select('themes, relationship_contexts, recurring_themes, entry_count')
    .eq('user_id', user.id)
    .single()

  let fingerprintBranches: FingerprintBranch[] = []

  if (fp && (fp.entry_count ?? 0) >= 3) {
    const cacheKey = `${user.id}:${fp.entry_count}`

    if (branchCache.has(cacheKey)) {
      fingerprintBranches = branchCache.get(cacheKey)!
    } else {
      // Evict old keys for this user before inserting new one
      Array.from(branchCache.keys())
        .filter((k) => k.startsWith(`${user.id}:`))
        .forEach((k) => branchCache.delete(k))

      const fpText = [
        fp.themes?.length            ? `themes: ${fp.themes.join(', ')}`                           : null,
        fp.relationship_contexts?.length ? `people mentioned: ${fp.relationship_contexts.join(', ')}` : null,
        fp.recurring_themes?.length  ? `recurring themes: ${fp.recurring_themes.join(', ')}`       : null,
        `total entries recorded: ${fp.entry_count}`,
      ].filter(Boolean).join('\n')

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are analyzing a user's private emotion fingerprint to build a narrative timeline.
Identify 5–8 of the most significant people or topics they have discussed.
For each provide:
- entity: the name (lowercase, concise — e.g. "your mother", "work stress", "the decision")
- branch: "left" if it is a person or relationship, "right" if it is a theme or life area
- first_signal: a very short phrase about when it first appeared, e.g. "mentioned early on", "emerged around entry 5", "a recurring undercurrent"
Return ONLY valid JSON: { "entities": [{ "entity": string, "branch": "left"|"right", "first_signal": string }] }
Rules: only include entities with meaningful recurrence. max 8 items. lowercase only. no filler.`,
            },
            { role: 'user', content: fpText },
          ],
          max_tokens: 400,
        })

        const raw = completion.choices[0]?.message?.content ?? '{}'
        const parsed = JSON.parse(raw)
        const rawEntities: { entity: string; branch: string; first_signal: string }[] =
          Array.isArray(parsed.entities) ? parsed.entities.slice(0, 8) : []

        const T = fp.entry_count ?? 1
        const N = rawEntities.length

        fingerprintBranches = rawEntities.map((e, i) => ({
          id: `fp-${i}`,
          type: 'fingerprint',
          entity: e.entity,
          branch: e.branch === 'left' ? 'left' : 'right',
          firstSignal: e.first_signal,
          // Distribute evenly across the total entry range
          entryIndex: Math.max(1, Math.round((i + 1) * T / (N + 1))),
        }))

        branchCache.set(cacheKey, fingerprintBranches)
      } catch (err) {
        console.error('timeline: fingerprint entity generation failed', err)
      }
    }
  }

  return NextResponse.json({
    nodes,
    fingerprintBranches,
    total,
    hasMore: offset + limit < total,
  })
}
