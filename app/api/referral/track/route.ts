import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { referralCode } = await req.json()

  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing referralCode' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, referral_count')
    .eq('referral_code', referralCode.toUpperCase())
    .single()

  if (error || !profile) {
    return NextResponse.json({ ok: true, referrerFound: false })
  }

  await supabase
    .from('profiles')
    .update({ referral_count: (profile.referral_count ?? 0) + 1 })
    .eq('user_id', profile.user_id)

  return NextResponse.json({ ok: true, referrerFound: true })
}
