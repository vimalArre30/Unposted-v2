'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/hooks/useSession'
import AuthModal from '@/components/AuthModal'

interface Profile {
  username: string | null
  security_question: string | null
  answer_hint: string | null
  email_expunged: boolean | null
}

export default function AccountPage() {
  const router = useRouter()
  const { isAnonymous, isLoading: sessionLoading } = useSession()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading || isAnonymous) return

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('username, security_question, answer_hint, email_expunged')
        .eq('id', user.id)
        .single()

      setProfile(data ?? null)
      setProfileLoading(false)
    }
    load()
  }, [router, supabase, sessionLoading, isAnonymous])

  // Wait for session to resolve
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
      </div>
    )
  }

  // Anonymous user — show auth UI instead of a blank/dummy profile
  if (isAnonymous) {
    return <AuthModal />
  }

  // Authenticated user loading their profile data
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pb-24 pt-14">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-400 hover:text-gray-700 self-start"
      >
        ← Back
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Your account</h1>

      <div className="flex flex-col gap-4">
        {/* Username */}
        <div className="glass px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Username</p>
          <p className="text-base font-medium text-gray-900">
            @{profile?.username ?? '—'}
          </p>
        </div>

        {/* Security question */}
        <div className="glass px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Security question</p>
          <p className="text-sm text-gray-700">{profile?.security_question ?? '—'}</p>
          {profile?.answer_hint && (
            <p className="mt-1.5 text-xs italic text-gray-400">{profile.answer_hint}</p>
          )}
        </div>

        {/* Email status */}
        <div className="glass px-5 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">Email</p>
          {profile?.email_expunged ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Removed for your privacy ✓
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              Not yet removed
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-10">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/auth/login')
          }}
          className="w-full rounded-2xl border border-gray-200 py-3.5 text-base font-medium text-gray-600 transition-colors hover:border-red-200 hover:text-red-600"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
