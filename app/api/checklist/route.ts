import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

const EMPTY = { emotional: [], utility: [] }

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entryId } = await req.json()
  if (!entryId) return NextResponse.json(EMPTY)

  // Fetch entry + session in parallel
  const [entryResult, sessionResult] = await Promise.all([
    supabase
      .from('entries')
      .select('mood_word')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('sessions')
      .select('questions_asked, transcripts')
      .eq('entry_id', entryId)
      .single(),
  ])

  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json(EMPTY)
  }

  const { questions_asked, transcripts } = sessionResult.data
  const moodWord = entryResult.data?.mood_word ?? ''

  // Zip questions + answers into a readable Q/A string
  const qa = (questions_asked as string[] ?? [])
    .map((q: string, i: number) => {
      const a = (transcripts as string[] ?? [])[i] ?? ''
      return a ? `Q: ${q}\nA: ${a}` : null
    })
    .filter(Boolean)
    .join('\n\n')

  if (!qa) return NextResponse.json(EMPTY)

  const contextBlock = [
    moodWord ? `Mood after session: ${moodWord}` : null,
    `Session transcript:\n${qa}`,
  ].filter(Boolean).join('\n\n')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a warm, grounded companion reviewing a private journal session. Based on this conversation, generate two small checklists.
Return a JSON object with exactly these two fields:
{
  "emotional": string[],
  "utility": string[]
}

Rules:
- emotional: 2–3 short items. Internal awareness prompts. Start each with an active verb (Notice, Give, Allow, Acknowledge, Sit with). Grounded in what was actually said.
- utility: 2–3 short items. Concrete micro-actions. Start each with an active verb (Send, Block, Write, Call, Set, Schedule). Specific to what came up.
- lowercase only
- maximum 12 words per item
- no bullet symbols
- no generic advice unrelated to the session
- if the session was vague or very brief, return 2 items in each array
- return valid JSON only`,
        },
        {
          role: 'user',
          content: contextBlock,
        },
      ],
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw)

    const emotional = Array.isArray(parsed.emotional) ? parsed.emotional.slice(0, 3) : []
    const utility   = Array.isArray(parsed.utility)   ? parsed.utility.slice(0, 3)   : []

    return NextResponse.json({ emotional, utility })
  } catch {
    return NextResponse.json(EMPTY)
  }
}
