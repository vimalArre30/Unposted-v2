'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !answer.trim() || isLoading) return
    setIsLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), securityAnswer: answer }),
    })
    const data = await res.json()
    setIsLoading(false)

    if (data.ok) {
      router.push('/')
    } else {
      setError(data.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-10">
      <div className="w-full max-w-[400px]">
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          </div>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            autoFocus
            autoComplete="username"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
          />

          <input
            type="password"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Security answer"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:border-green-600 focus:outline-none"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !answer.trim() || isLoading}
            className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
          >
            {isLoading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-center text-xs text-gray-400">
            New here?{' '}
            <a href="/auth/signup" className="text-green-700 underline underline-offset-2">
              Create your space
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
