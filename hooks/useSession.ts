// Re-export from the shared context so all components use a single session source of truth.
// The SessionProvider must wrap the app (see app/(app)/layout.tsx).
export { useSession } from '@/context/SessionContext'
