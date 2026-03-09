import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  try {
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
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
