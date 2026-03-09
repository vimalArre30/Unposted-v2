import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function hashAnswer(answer: string): string {
  return createHash('sha256').update(answer.toLowerCase().trim()).digest('hex')
}

// Simple in-memory rate limiter: max 5 attempts per 10 minutes per username
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const { username, securityAnswer } = await req.json()
  if (!username || !securityAnswer) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
  }

  const key = username.toLowerCase().trim()

  if (!checkRateLimit(key)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Wait 10 minutes.' })
  }

  const answerHash = hashAnswer(securityAnswer)

  // Look up profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', key)
    .eq('security_answer_hash', answerHash)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Username or answer incorrect' })
  }

  // Generate a magic link for their private email, then exchange for a real session
  const privateEmail = `${profile.id}@private.unposted.app`
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: privateEmail,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ ok: false, error: 'Session creation failed' }, { status: 500 })
  }

  // Exchange hashed token for a session via the SSR client (sets cookie)
  const supabase = createClient()
  const { error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (sessionError) {
    return NextResponse.json({ ok: false, error: 'Session creation failed' }, { status: 500 })
  }

  // Reset rate limit on success
  attempts.delete(key)

  return NextResponse.json({ ok: true })
}
