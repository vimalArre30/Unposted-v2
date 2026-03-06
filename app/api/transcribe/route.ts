import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audioFile = formData.get('audio')

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  const result = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
  })

  return NextResponse.json({ transcript: result.text })
}
