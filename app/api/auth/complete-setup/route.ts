import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/*
  Required migration (run once in Supabase SQL editor):

  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username text unique,
    ADD COLUMN IF NOT EXISTS security_question text,
    ADD COLUMN IF NOT EXISTS security_answer_hash text,
    ADD COLUMN IF NOT EXISTS answer_hint text,
    ADD COLUMN IF NOT EXISTS email_expunged boolean default false;
*/

function hashAnswer(answer: string): string {
  return createHash('sha256').update(answer.toLowerCase().trim()).digest('hex')
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, securityQuestion, securityAnswer, answerHint } = await req.json()
  if (!username || !securityQuestion || !securityAnswer) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const answerHash = hashAnswer(securityAnswer)

  // Upsert profile — use admin client to bypass RLS
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user.id,
      username: username.toLowerCase().trim(),
      security_question: securityQuestion,
      security_answer_hash: answerHash,
      answer_hint: answerHint ?? null,
      email_expunged: true,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Expunge real email — replace with private internal address
  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email: `${user.id}@private.unposted.app` }
  )

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
