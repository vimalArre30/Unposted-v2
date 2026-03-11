import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const normalised = email.toLowerCase().trim()

  try {
    // Early duplicate check: block before sending OTP if the email already has an account.
    // NOTE: legacy accounts created before the email_hash feature have email_hash = NULL —
    // NULL != hash in SQL so they won't accidentally block new signups.
    const emailHash = hashEmail(normalised)
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email_hash', emailHash)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'An account already exists for this email. Please log in instead.' },
        { status: 409 },
      )
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email: normalised,
      options: { shouldCreateUser: true },
    })
    if (error) {
      console.error('send-otp error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('send-otp exception:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
