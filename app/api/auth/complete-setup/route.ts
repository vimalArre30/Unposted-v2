import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/*
  Required migrations (run once in Supabase SQL editor):

  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username text unique,
    ADD COLUMN IF NOT EXISTS security_question text,
    ADD COLUMN IF NOT EXISTS security_answer_hash text,
    ADD COLUMN IF NOT EXISTS answer_hint text,
    ADD COLUMN IF NOT EXISTS email_expunged boolean default false,
    ADD COLUMN IF NOT EXISTS email_hash text unique;
*/

function hashAnswer(answer: string): string {
  return createHash('sha256').update(answer.toLowerCase().trim()).digest('hex')
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
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

  // Hash the real email before expunging it — used for duplicate-account detection.
  // user.email is still the real address at this point (before expungement).
  const emailHash = user.email ? hashEmail(user.email) : null

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
      ...(emailHash ? { email_hash: emailHash } : {}),
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Expunge real email — replace with private internal address.
  // email_confirm: true prevents Supabase from sending a confirmation email to the private address.
  const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { email: `${user.id}@private.unposted.app`, email_confirm: true }
  )

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
