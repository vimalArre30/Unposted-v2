import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    .from('recording_sessions')
    .select('current_mode, questions_asked')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
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
    .from('recording_sessions')
    .update({ entry_id: entry.id, status: 'complete' })
    .eq('id', sessionId)

  return NextResponse.json({ entryId: entry.id })
}
