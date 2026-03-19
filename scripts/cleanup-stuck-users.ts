/**
 * scripts/cleanup-stuck-users.ts
 *
 * Finds and optionally deletes "stuck" Supabase auth users — users who passed OTP
 * verification but never finished setup, leaving their real email locked in the auth
 * record and blocking future signups with the same address.
 *
 * A "stuck user" matches ALL of:
 *   1. auth email does NOT match the expunged pattern {uuid}@private.unposted.app
 *   2. auth.is_anonymous is false (identity was upgraded by verify-code)
 *   3. profiles.email_hash IS NULL (complete-setup was never reached)
 *
 * Safe-guards (never touched):
 *   - Users with is_anonymous = true  (active anonymous sessions)
 *   - Users with email_hash populated  (setup completed)
 *   - Users with expunged private email (setup completed, email already gone)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/cleanup-stuck-users.ts           # dry run
 *   npx tsx --env-file=.env.local scripts/cleanup-stuck-users.ts --execute  # delete
 *
 * The --env-file flag requires Node 20.6+ and tsx ≥ 4. Alternatively, export the
 * env vars manually before running.
 */

import { createClient } from '@supabase/supabase-js'

// ── Env ────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n[error] Missing env vars. Run with:\n' +
    '  npx tsx --env-file=.env.local scripts/cleanup-stuck-users.ts\n'
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ────────────────────────────────────────────────────────────────────

// Matches {uuid}@private.unposted.app — the expunged form set by complete-setup
const EXPUNGED_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@private\.unposted\.app$/i

function isExpunged(email: string): boolean {
  return EXPUNGED_RE.test(email)
}

// Show first 2 chars + *** + @domain so logs are identifiable but not leaking PII
function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 0) return '***'
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***@${domain}`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const execute = process.argv.includes('--execute')
  console.log(`\n=== cleanup-stuck-users [${execute ? 'EXECUTE' : 'DRY RUN'}] ===\n`)

  // ── Step 1: page through all auth users ──────────────────────────────────────
  type AuthUser = { id: string; email?: string; created_at: string; is_anonymous: boolean }
  const authUsers: AuthUser[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error('listUsers failed:', error.message)
      process.exit(1)
    }
    const batch = (data as { users: AuthUser[] }).users
    authUsers.push(...batch)
    if (batch.length < perPage) break
    page++
  }

  console.log(`Fetched ${authUsers.length} total auth user(s).`)

  // ── Step 2: narrow to candidates with a real (non-expunged) email ─────────────
  const candidates = authUsers.filter((u) => {
    if (u.is_anonymous)                      return false  // active anon — skip
    if (!u.email)                            return false  // no email at all — skip
    if (isExpunged(u.email))                 return false  // setup complete — skip
    return true
  })

  if (candidates.length === 0) {
    console.log('No candidates to inspect — all clear.\n')
    return
  }

  console.log(`${candidates.length} candidate(s) have a real email. Cross-referencing profiles...\n`)

  // ── Step 3: batch-fetch profiles for all candidates ───────────────────────────
  const ids = candidates.map((u) => u.id)
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, email_hash, is_anonymous')
    .in('id', ids)

  if (profilesError) {
    console.error('profiles query failed:', profilesError.message)
    process.exit(1)
  }

  type ProfileRow = { id: string; email_hash: string | null; is_anonymous: boolean | null }
  const profileMap = new Map<string, ProfileRow>(
    (profiles as ProfileRow[]).map((p) => [p.id, p])
  )

  // ── Step 4: identify stuck users ──────────────────────────────────────────────
  const stuck = candidates.filter((u) => {
    const profile = profileMap.get(u.id)
    if (!profile)              return true   // no profile row — setup definitely never ran
    if (profile.is_anonymous)  return false  // profile still marks them anon — skip
    if (profile.email_hash !== null) return false  // hash present — setup completed — skip
    return true  // is_anonymous=false, email_hash=null → stuck
  })

  // ── Step 5: report ────────────────────────────────────────────────────────────
  if (stuck.length === 0) {
    console.log('✓ No stuck users found — nothing to do.\n')
    return
  }

  console.log(`Found ${stuck.length} stuck user(s):\n`)
  for (const u of stuck) {
    const profile = profileMap.get(u.id)
    console.log(`  ID:          ${u.id}`)
    console.log(`  Email:       ${maskEmail(u.email!)}`)
    console.log(`  Created:     ${u.created_at}`)
    console.log(`  Has profile: ${profile ? 'yes' : 'no'}`)
    console.log('')
  }

  // ── Step 6: delete if --execute ───────────────────────────────────────────────
  if (!execute) {
    console.log(
      `DRY RUN complete — ${stuck.length} stuck user(s) found, 0 deleted.\n` +
      `Review the list above, then re-run with --execute to free their emails.\n`
    )
    return
  }

  console.log('Deleting stuck users...\n')
  let deleted = 0
  let failed = 0

  for (const u of stuck) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    if (error) {
      console.error(`  ✗ ${u.id} (${maskEmail(u.email!)}) — ${error.message}`)
      failed++
    } else {
      console.log(`  ✓ Deleted ${u.id} (${maskEmail(u.email!)})`)
      deleted++
    }
  }

  console.log(
    `\nDone — ${stuck.length} stuck user(s) found, ${deleted} deleted, ${failed} failed.\n`
  )
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
