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

    // Bug 4: Check for duplicate account via email_hash before proceeding.
    // We store a one-way hash so we can detect duplicates without storing raw email.
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

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('verify-code: unexpected error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
