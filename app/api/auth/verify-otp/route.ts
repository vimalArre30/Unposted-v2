import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()
    if (!email || !token) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient()

    // Capture any anonymous session BEFORE OTP verification so we can migrate entries.
    // verifyOtp creates/signs in the email user with a different ID.
    const { data: { user: anonUser } } = await supabase.auth.getUser()
    const anonUserId = anonUser?.is_anonymous ? anonUser.id : null

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error || !data.user) {
      console.error('verify-otp: verification failed', error)
      return NextResponse.json(
        { ok: false, error: error?.message ?? 'Invalid or expired code' },
        { status: 400 }
      )
    }

    const newUserId = data.user.id

    // Migrate entries from the anonymous session to the newly authenticated user
    if (anonUserId && anonUserId !== newUserId) {
      const { error: migrateError } = await supabaseAdmin
        .from('entries')
        .update({ user_id: newUserId })
        .eq('user_id', anonUserId)

      if (migrateError) {
        // Non-fatal: user is authenticated; log for investigation
        console.error('verify-otp: entries migration failed', migrateError)
      }
    }

    return NextResponse.json({ ok: true, userId: newUserId })
  } catch (e) {
    console.error('verify-otp: unexpected error', e)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
