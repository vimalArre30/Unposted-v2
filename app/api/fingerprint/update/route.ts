import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { openai } from '@/lib/openai'

function mergeSignals(existing: string[] | null, incoming: string[]): string[] {
  const combined = [...(existing ?? []), ...incoming]
  return Array.from(new Set(combined)).slice(0, 10)
}

export async function POST(req: NextRequest) {
  const { entryId, userId } = await req.json()

  if (!entryId || !userId) {
    return NextResponse.json({ error: 'Missing entryId or userId' }, { status: 400 })
  }

  // Fetch session linked to this entry
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('recording_sessions')
    .select('questions_asked, transcripts')
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .single()

  if (sessionError || !session) {
    console.error('Fingerprint update: session not found', sessionError)
    return NextResponse.json({ ok: true })
  }

  const questions: string[] = session.questions_asked ?? []
  const answers: string[] = session.transcripts ?? []

  if (questions.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const conversationText = questions
    .map((q, i) => `Q: ${q}\nA: ${answers[i] ?? ''}`)
    .join('\n\n')

  // Fetch existing fingerprint (may be null for new users)
  const { data: existing } = await supabaseAdmin
    .from('emotion_fingerprint')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Extract signals via GPT-4o
  let extracted: {
    new_themes: string[]
    new_emotions: string[]
    relationship_contexts: string[]
    life_phase_signals: string[]
  } | null = null

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a private journal entry to extract emotional signals.
Given the conversation below, return a JSON object with exactly these fields:
{
  "new_themes": string[],            // 1-3 recurring life themes mentioned (e.g. "career", "family", "identity")
  "new_emotions": string[],          // 1-2 dominant emotional tones (e.g. "anxious", "hopeful")
  "relationship_contexts": string[], // people/roles mentioned (e.g. "mother", "colleague", "partner") — first name only if given, else role
  "life_phase_signals": string[]     // broad signals (e.g. "in transition", "building something", "processing loss")
}
Be conservative — only include what is clearly present. Return valid JSON only.`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    extracted = JSON.parse(raw)
  } catch (err) {
    console.error('Fingerprint GPT extraction failed:', err)
    return NextResponse.json({ ok: true })
  }

  if (!extracted) return NextResponse.json({ ok: true })

  const { error: upsertError } = await supabaseAdmin
    .from('emotion_fingerprint')
    .upsert(
      {
        user_id: userId,
        themes: mergeSignals(existing?.themes ?? null, extracted.new_themes ?? []),
        dominant_emotions: mergeSignals(existing?.dominant_emotions ?? null, extracted.new_emotions ?? []),
        relationship_contexts: mergeSignals(existing?.relationship_contexts ?? null, extracted.relationship_contexts ?? []),
        life_phase_signals: mergeSignals(existing?.life_phase_signals ?? null, extracted.life_phase_signals ?? []),
        entry_count: (existing?.entry_count ?? 0) + 1,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    console.error('Fingerprint upsert failed:', upsertError)
  }

  return NextResponse.json({ ok: true })
}
