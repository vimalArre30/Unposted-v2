import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function GET() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
    max_tokens: 50,
  })

  const message = completion.choices[0].message.content

  return NextResponse.json({ ok: true, message })
}
