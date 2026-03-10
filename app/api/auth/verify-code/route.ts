import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
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

  // Mark code as used immediately to prevent replay
  await supabaseAdmin
    .from('verification_codes')
    .update({ used: true })
    .eq('id', record.id)

  // Get the current user session (anonymous user from cookie)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 })
  }

  // Upgrade anonymous user: set email + mark as confirmed (no second email sent)
  const { error: upgradeError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email, email_confirm: true },
  )

  if (upgradeError) {
    console.error('verify-code: upgrade failed', upgradeError)
    return NextResponse.json({ error: upgradeError.message }, { status: 500 })
  }

  // Update profiles table to reflect email and non-anonymous state
  await supabaseAdmin
    .from('profiles')
    .update({ email, is_anonymous: false })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
