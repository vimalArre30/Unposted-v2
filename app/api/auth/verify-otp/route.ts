import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, token } = await req.json()
  if (!email || !token) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const supabase = createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: 'Invalid code' })
  }

  return NextResponse.json({ ok: true, userId: data.user.id })
}
