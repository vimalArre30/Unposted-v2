import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Email template ────────────────────────────────────────────────────────────

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Unposted verification code</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Top colour bar -->
          <tr><td height="8" style="background:#2A5C2E;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Logo area -->
          <tr>
            <td align="center" style="padding:36px 40px 0;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#2A5C2E;letter-spacing:-0.5px;">unposted</p>
              <p style="margin:8px 0 0;font-size:13px;font-style:italic;color:#6B8F6E;">a quiet place for your thoughts</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding:24px 40px 0;">
              <div style="height:1px;background:#E8E4DC;width:80%;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- Heading + sub-copy -->
          <tr>
            <td align="center" style="padding:28px 40px 0;">
              <p style="margin:0;font-size:20px;font-weight:600;color:#1A2E1B;">Here&rsquo;s your verification code</p>
              <p style="margin:12px 0 0;font-size:14px;color:#6B8F6E;line-height:1.6;max-width:340px;">
                Enter this code in the app to continue.<br/>It expires in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- Code block -->
          <tr>
            <td align="center" style="padding:28px 40px;">
              <div style="display:inline-block;background:#F2F7F2;border-radius:12px;padding:20px 48px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:700;color:#2A5C2E;letter-spacing:12px;">${code}</span>
              </div>
            </td>
          </tr>

          <!-- Footer divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#E8E4DC;"></div>
            </td>
          </tr>

          <!-- Footer text -->
          <tr>
            <td align="center" style="padding:20px 40px 8px;">
              <p style="margin:0;font-size:12px;color:#9E9E9E;line-height:1.6;max-width:400px;">
                If you didn&rsquo;t request this, you can safely ignore this email. This code will expire in 10 minutes.
              </p>
            </td>
          </tr>

          <!-- Bottom -->
          <tr>
            <td align="center" style="padding:8px 40px 32px;">
              <p style="margin:0;font-size:11px;color:#BDBDBD;">&copy; Unposted &middot; unposted.arre.co.in</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = (body?.email ?? '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Early duplicate check: block before sending code if the email already has an account.
  // NOTE: legacy accounts created before the email_hash feature have email_hash = NULL —
  // NULL != hash in SQL so they won't accidentally block new signups.
  const emailHash = hashEmail(email)
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email_hash', emailHash)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'An account already exists for this email. Please log in instead.' },
      { status: 409 },
    )
  }

  // Rate limit: max 3 send attempts per email per 10 minutes
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('verification_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', tenMinsAgo)

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 10 minutes before trying again.' },
      { status: 429 },
    )
  }

  // Delete previous unused codes for this email
  await supabaseAdmin
    .from('verification_codes')
    .delete()
    .eq('email', email)
    .eq('used', false)

  // Generate 6-digit code
  const code      = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await supabaseAdmin
    .from('verification_codes')
    .insert({ email, code, expires_at: expiresAt })

  if (insertError) {
    console.error('send-code: insert failed', insertError)
    return NextResponse.json({ error: 'Failed to create verification code' }, { status: 500 })
  }

  // Send email via Resend
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to:   email,
      subject: `${code} is your Unposted verification code`,
      html:    buildEmailHtml(code),
    })
  } catch (err) {
    console.error('send-code: Resend failed', err)
    // Clean up the stored code so the user can retry
    await supabaseAdmin.from('verification_codes').delete().eq('email', email).eq('code', code)
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
