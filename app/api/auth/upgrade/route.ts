import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const email = body?.email

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = createClient()

  // Verify there's an active session to upgrade
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'No active session.' }, { status: 401 })
  }

  // Link the email to the existing anonymous account.
  // Supabase sends a confirmation email; once clicked the account is no longer anonymous.
  const { error } = await supabase.auth.updateUser({ email })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Mark the profile as no longer anonymous (will be fully confirmed after email verification)
  await supabase
    .from('profiles')
    .update({ email, is_anonymous: false })
    .eq('id', user.id)

  return NextResponse.json({
    ok: true,
    message: 'Check your email to confirm your account. All your entries will be preserved.',
  })
}
