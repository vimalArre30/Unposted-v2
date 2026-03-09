import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId, mood } = await req.json()

  if (!sessionId || !mood) {
    return NextResponse.json({ error: 'Missing sessionId or mood' }, { status: 400 })
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('current_mode, questions_asked, transcripts')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('entries/create: session fetch failed', sessionError)
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Create entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      mode: session.current_mode,
      mood_word: mood,
      processing_status: 'complete',
    })
    .select('id')
    .single()

  if (entryError || !entry) {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }

  // Update session
  await supabase
    .from('sessions')
    .update({ entry_id: entry.id, status: 'complete' })
    .eq('id', sessionId)

  // Fire-and-forget: generate ai_summary_short from session transcripts
  ;(async () => {
    try {
      const transcripts: string[] = session.transcripts ?? []
      if (transcripts.length === 0) return
      const transcript = transcripts.join(' ')
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `In 10 words or less, summarize the emotional core of this journal entry: ${transcript}. Return only the summary, no punctuation at start or end.`,
          },
        ],
        max_tokens: 25,
      })
      const summary = completion.choices[0]?.message?.content?.trim() ?? ''
      if (!summary) return
      await supabaseAdmin
        .from('entries')
        .update({ ai_summary_short: summary })
        .eq('id', entry.id)
    } catch (err) {
      console.error('Summary generation failed:', err)
    }
  })().catch(() => {})

  // Fire-and-forget: build/update emotion fingerprint in the background
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/fingerprint/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entryId: entry.id, userId: user.id }),
  }).catch((err) => console.error('Fingerprint update dispatch failed:', err))

  return NextResponse.json({ entryId: entry.id })
}
