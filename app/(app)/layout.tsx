'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PageTransition from '@/components/PageTransition'
import { HomeIcon, EntriesIcon, GardenIcon, ShareIcon } from '@/components/icons'

const NAV = [
  { href: '/',        label: 'Home',    Icon: HomeIcon    },
  { href: '/entries', label: 'Entries', Icon: EntriesIcon },
  { href: '/garden',  label: 'Garden',  Icon: GardenIcon  },
  { href: '/share',   label: 'Share',   Icon: ShareIcon   },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
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
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                    active
                      ? 'bg-white/12 text-white shadow-sm'
                      : 'text-white/60 hover:bg-white/08 hover:text-white/90'
                  }`}>
                  <Icon active={active} size={18} />
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
              <PersonIcon />
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm text-gray-500 shadow-soft">
            <PersonIcon />
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
              return (
                <Link key={href} href={href}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors min-h-[44px] ${
                    active ? 'text-moss' : 'text-gray-400'
                  }`}>
                  <Icon active={active} />
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
