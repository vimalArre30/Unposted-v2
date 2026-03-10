'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PageTransition from '@/components/PageTransition'
import { HomeIcon, EntriesIcon, GardenIcon, ChecklistIcon } from '@/components/icons'
import { useSession } from '@/hooks/useSession'

const NAV = [
  { href: '/',           label: 'Home',      Icon: HomeIcon      },
  { href: '/entries',    label: 'Entries',   Icon: EntriesIcon   },
  { href: '/checklist',  label: 'Checklist', Icon: ChecklistIcon },
  { href: '/garden',     label: 'Garden',    Icon: GardenIcon    },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAnonymous } = useSession()
  const [hasInsightBadge, setHasInsightBadge] = useState(false)

  useEffect(() => {
    // Daily insight generation — fire once per calendar day
    const today = new Date().toDateString()
    const lastRun = localStorage.getItem('insight_last_run')
    if (lastRun !== today) {
      localStorage.setItem('insight_last_run', today)
      fetch('/api/checklist/insight', { method: 'POST' }).catch(() => {})
    }

    // Badge: count unchecked insight items
    fetch('/api/checklist/insight')
      .then((r) => r.json())
      .then((d) => setHasInsightBadge((d.count ?? 0) > 0))
      .catch(() => {})
  }, [])
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/account')

  return (
    <div className={`min-h-screen bg-wave ${!isAuthPage ? 'md:flex' : ''}`}>

      {/* Desktop sidebar */}
      {!isAuthPage && (
        <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 z-50"
          style={{ backgroundColor: '#1E3A1F' }}>
          <div className="px-6 py-8 flex items-center gap-2.5">
            <SidebarLeafIcon />
            <span className="text-base font-semibold tracking-wide text-white/90">unposted</span>
          </div>
          <nav className="flex-1 px-3 flex flex-col gap-1">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href
              const showBadge = href === '/checklist' && hasInsightBadge
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                    active
                      ? 'bg-white/12 text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/08 hover:text-white/90'
                  }`}>
                  <span className="relative">
                    <Icon active={active} size={18} />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </span>
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="px-3 pb-6">
            <Link href="/account"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all min-h-[44px] ${
                pathname === '/account'
                  ? 'bg-white/12 text-white'
                  : 'text-white/60 hover:bg-white/08 hover:text-white/90'
              }`}>
              <span className="relative">
                <PersonIcon />
                {isAnonymous && <LockBadge />}
              </span>
              Account
            </Link>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 flex justify-center ${!isAuthPage ? 'md:ml-60' : ''}`}>
        <div className="w-full max-w-[480px] md:max-w-[640px]">
          <PageTransition id={pathname}>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Mobile account icon */}
      {!isAuthPage && (
        <div className="md:hidden fixed top-4 right-4 z-40">
          <Link href="/account" aria-label="Account"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm text-gray-500 shadow-soft">
            <PersonIcon />
            {isAnonymous && <LockBadge />}
          </Link>
        </div>
      )}

      {/* Mobile bottom nav */}
      {!isAuthPage && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100/80"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-stretch h-16">
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href
              const showBadge = href === '/checklist' && hasInsightBadge
              return (
                <Link key={href} href={href}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors min-h-[44px] ${
                    active ? 'text-moss' : 'text-gray-400'
                  }`}>
                  <span className="relative">
                    <Icon active={active} />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400" />
                    )}
                  </span>
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

function SidebarLeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22 C2 22 8 16 12 12 C16 8 22 2 22 2 C22 2 16 4 12 8 C8 12 4 18 2 22Z" />
      <path d="M12 12 L7 17" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function LockBadge() {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm">
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
        <rect x="2" y="5" width="8" height="6" rx="1.5" fill="#6b7280" />
        <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}
