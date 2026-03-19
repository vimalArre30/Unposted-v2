import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json()
    const email = (body?.email ?? '').trim().toLowerCase()
    const code  = (body?.code  ?? '').trim()

    if (!email || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Look up most recent unused, unexpired code for this email
    const now = new Date().toISOString()
    const { data: record } = await supabaseAdmin
      .from('verification_codes')
      .select('id, code')
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    if (record.code !== code) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
    }

    // Second-layer duplicate check (first layer is in send-code). Guards against race conditions
    // where two requests arrive simultaneously, or the first-layer check was bypassed.
    // NOTE: legacy accounts created before the email_hash feature have email_hash = NULL —
    // NULL != hash in SQL so they won't accidentally block new signups.
    const emailHash = hashEmail(email)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email_hash', emailHash)
      .maybeSingle()

    if (existingProfile) {
      // Consume the code to prevent replay, then reject
      await supabaseAdmin.from('verification_codes').update({ used: true }).eq('id', record.id)
      return NextResponse.json(
        { error: 'An account already exists for this email. Please log in instead.' },
        { status: 409 }
      )
    }

    // Mark code as used immediately to prevent replay
    await supabaseAdmin
      .from('verification_codes')
      .update({ used: true })
      .eq('id', record.id)

    // Get the current user session (anonymous user from cookie)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('verify-code: no active session found')
      return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 401 })
    }

    // Upgrade anonymous user: set email + mark as confirmed (no confirmation email sent)
    const { error: upgradeError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email, email_confirm: true },
    )

    if (upgradeError) {
      console.error('verify-code: upgrade failed', upgradeError)
      return NextResponse.json({ error: upgradeError.message }, { status: 500 })
    }

    // Mark profile as non-anonymous — do NOT store raw email (privacy promise)
    await supabaseAdmin
      .from('profiles')
      .update({ is_anonymous: false })
      .eq('id', user.id)

    // Generate a one-time magic-link token so the client can establish a real session.
    // admin.generateLink does NOT send any email — it just returns a token.
    // This replaces refreshSession() which fails when Supabase invalidates the
    // anonymous session after upgrading the user's identity to an email account.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('verify-code: generateLink failed', linkError)
      return NextResponse.json({ error: 'Verified, but failed to create session. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, token_hash: linkData.properties.hashed_token })
  } catch (e) {
    console.error('verify-code: unexpected error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
