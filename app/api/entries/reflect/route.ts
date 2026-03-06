import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

const SYSTEM_PROMPT = `You are a gentle, perceptive companion. Based on what this person shared, generate a quiet 2-3 line reflection.
Rules:
- Sound like a warm friend who noticed something, not a therapist
- No bullet points or lists — just flowing, warm sentences
- Can mention a practical nudge OR a reflective observation — not both
- Never start with "You" or "I notice" — be indirect and warm
- Maximum 40 words total
Examples of the right tone:
"Carrying that for three weeks is a lot. You don't have to solve it today."
"Your mother came up twice. Might be worth a call this week."
"Something in how you described that feels unfinished. Maybe that's okay for now."`

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await req.json()
  if (!entryId) {
    return NextResponse.json({ error: 'Missing entryId' }, { status: 400 })
  }

  // Fetch session linked to this entry
  const { data: session } = await supabase
    .from('sessions')
    .select('questions_asked, transcripts')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .single()

  // Build conversation context
  const questions: string[] = session?.questions_asked ?? []
  const answers: string[] = session?.transcripts ?? []

  const conversationText = questions
    .map((q, i) => `Q: ${q}\nA: ${answers[i] ?? '(no answer)'}`)
    .join('\n\n')

  const userMessage = conversationText.trim()
    ? `Here is what the person shared:\n\n${conversationText}`
    : 'The person recorded a voice entry but no transcript is available.'

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 80,
    temperature: 0.8,
  })

  const reflection = completion.choices[0]?.message?.content?.trim() ?? ''

  // Persist to entry
  await supabase
    .from('entries')
    .update({ ai_summary: reflection })
    .eq('id', entryId)
    .eq('user_id', user.id)

  return NextResponse.json({ reflection })
}
