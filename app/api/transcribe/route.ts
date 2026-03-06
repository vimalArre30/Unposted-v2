import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

const AMBIENT_MARKERS = [
  '[silence]', '[music]', '[noise]', '[applause]',
  '(silence)', '(music)',
]

function isAmbient(text: string): boolean {
  if (!text || text.trim().length < 10) return true
  const lower = text.toLowerCase().trim()
  return AMBIENT_MARKERS.some((m) => lower === m || lower.startsWith(m))
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audioFile = formData.get('audio')
  const language = (formData.get('language') as string | null) ?? 'en'
  const mix = (formData.get('mix') as string | null) ?? 'false'

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  // Language logic:
  // - mix=true OR language=en → omit language param (auto-detect handles code-switching best)
  // - mix=false AND language is 'ta' or 'hi' → force native script via language param
  const whisperLang =
    mix === 'true' || language === 'en'
      ? null
      : language === 'ta' || language === 'hi'
        ? language
        : null

  const result = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
    ...(whisperLang && { language: whisperLang }),
  })

  if (isAmbient(result.text)) {
    return NextResponse.json({ transcript: null, ambient: true })
  }

  return NextResponse.json({ transcript: result.text })
}
