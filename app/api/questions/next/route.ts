import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

const MODE_ARCS: Record<string, string> = {
  'life-stories': 'Help the user ground in a specific memory, then zoom to meaning, then forward to identity.',
  'feeling-now': 'Help the user name the feeling, locate it, understand it, then gently release it.',
  'past-event': 'Help the user describe what happened, how it landed, and what feels unresolved.',
  'future-event': "Help the user name what's ahead, surface the fear underneath, and find one true thing to hold.",
  'vent': 'No arc. Just listen. Reflect back warmly. The user just needs to feel heard.',
}

const STYLE_RULES = `
Style rules (follow strictly):
- Never assume relationship type, emotional valence, gender, or life situation
- Never ask two heavy questions back to back
- Keep questions under 15 words
- Never sound clinical or therapeutic
- Always give the user a way out ("...if you want to share")
- Never stack more than 3 open-ended questions in a row`

export async function POST(req: NextRequest) {
  const { mode, sessionId: _sessionId, conversationSoFar, fingerprint } = await req.json()

  const modeArc = MODE_ARCS[mode] ?? MODE_ARCS['vent']

  // After 4+ exchanges (8+ messages), check if it's time to wrap up
  if (conversationSoFar.length >= 8) {
    const wrapCheck = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are evaluating a journaling conversation.' },
        ...conversationSoFar,
        { role: 'user', content: 'Is this a natural point to move to the mood check? Reply only YES or NO.' },
      ],
      max_tokens: 3,
    })
    const answer = wrapCheck.choices[0]?.message?.content?.trim().toUpperCase()
    if (answer === 'YES') {
      return NextResponse.json({ done: true })
    }
  }

  let systemPrompt = `You are a warm, curious, non-judgmental journaling companion for Unposted.
${STYLE_RULES}

Mode arc for this session (${mode}): ${modeArc}`

  if (fingerprint) {
    const themes = (fingerprint as Record<string, string[]>).recurring_themes?.join(', ') || 'not yet known'
    const emotions = (fingerprint as Record<string, string[]>).dominant_emotions?.join(', ') || 'not yet known'
    systemPrompt += `\n\nThis user's recurring themes are: ${themes}. Their recent emotional signals: ${emotions}. Tailor your questions gently to feel personal without being assumptive.`
  }

  systemPrompt += '\n\nReturn ONLY the next question as plain text. No JSON. No preamble. No explanation.'

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationSoFar,
    ],
    max_tokens: 60,
  })

  const question =
    completion.choices[0]?.message?.content?.trim() ??
    "What's on your mind right now, if you want to share?"

  return NextResponse.json({ question })
}
