import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

// GET — count unchecked insight items (used for nav badge)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('checklist_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'insight')
    .eq('is_checked', false)

  return NextResponse.json({ count: count ?? 0 })
}

// POST — generate 1–2 insight nudges from fingerprint + unchecked items
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ inserted: 0 })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [fpResult, uncheckedResult] = await Promise.all([
    supabase
      .from('emotion_fingerprint')
      .select('themes, dominant_emotions, relationship_contexts, life_phase_signals, entry_count')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('checklist_items')
      .select('text, type')
      .eq('user_id', user.id)
      .eq('is_checked', false)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const fp = fpResult.data
  const unchecked = uncheckedResult.data ?? []

  // Need at least 2 entries worth of fingerprint data to be meaningful
  if (!fp || (fp.entry_count ?? 0) < 2) return NextResponse.json({ inserted: 0 })

  const fingerprintText = [
    fp.themes?.length ? `themes: ${fp.themes.join(', ')}` : null,
    fp.dominant_emotions?.length ? `emotions: ${fp.dominant_emotions.join(', ')}` : null,
    fp.relationship_contexts?.length ? `people mentioned: ${fp.relationship_contexts.join(', ')}` : null,
    fp.life_phase_signals?.length ? `life phase: ${fp.life_phase_signals.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const uncheckedText =
    unchecked.length > 0
      ? `Uncompleted items from the last 7 days:\n${unchecked.map((i) => `- ${i.text}`).join('\n')}`
      : ''

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are analyzing a user's private emotional fingerprint and uncompleted journal checklist items.
Generate 1–2 insight-based checklist prompts — observational nudges that reflect patterns the user may not have noticed.
Examples: "you've mentioned your father three times this week — might be worth a conversation", "you keep deferring the same decision — what's the real hesitation?"
Rules: lowercase. max 20 words. grounded in actual data below. never generic. return JSON: { "insight": string[] }`,
        },
        {
          role: 'user',
          content: [fingerprintText, uncheckedText].filter(Boolean).join('\n\n'),
        },
      ],
      max_tokens: 200,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const insights: string[] = Array.isArray(parsed.insight) ? parsed.insight.slice(0, 2) : []

    if (insights.length === 0) return NextResponse.json({ inserted: 0 })

    const { data: inserted } = await supabase
      .from('checklist_items')
      .insert(insights.map((text) => ({ user_id: user.id, text, type: 'insight' })))
      .select('id')

    return NextResponse.json({ inserted: inserted?.length ?? 0 })
  } catch (err) {
    console.error('Insight generation failed:', err)
    return NextResponse.json({ inserted: 0 })
  }
}
