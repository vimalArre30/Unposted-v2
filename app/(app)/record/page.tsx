'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VoiceRecorder from '@/components/VoiceRecorder'

type Message = { role: 'assistant' | 'user'; content: string }

function RecordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') ?? 'vent'

  const supabase = createClient()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<object | null>(null)
  const [conversation, setConversation] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [recorderKey, setRecorderKey] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Number of user answers submitted so far
  const userTurns = conversation.filter((m) => m.role === 'user').length
  const progress = Math.min(userTurns, 6)

  useEffect(() => {
    async function init() {
      // Create session
      const sessionRes = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const { sessionId: sid } = await sessionRes.json()
      setSessionId(sid)

      // Fetch emotion fingerprint
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let fp: object | null = null
      if (user) {
        const { data } = await supabase
          .from('emotion_fingerprint')
          .select('*')
          .eq('user_id', user.id)
          .single()
        fp = data ?? null
        setFingerprint(fp)
      }

      // First question
      await fetchNextQuestion([], fp, sid)
      setIsInitializing(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchNextQuestion(
    conv: Message[],
    fp: object | null,
    sid: string | null
  ) {
    setIsFetching(true)
    const res = await fetch('/api/questions/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        sessionId: sid ?? sessionId,
        conversationSoFar: conv,
        fingerprint: fp ?? fingerprint,
      }),
    })
    const data = await res.json()
    setIsFetching(false)

    if (data.done) {
      router.push(`/record/mood?sessionId=${sid ?? sessionId}`)
      return
    }

    setCurrentQuestion(data.question)
    setRecorderKey((k) => k + 1)
    setAnswer('')
    if (showTextInput) setTimeout(() => textareaRef.current?.focus(), 100)
  }

  async function handleContinue() {
    if (!answer.trim() || isFetching) return

    const updatedConv: Message[] = [
      ...conversation,
      { role: 'assistant', content: currentQuestion },
      { role: 'user', content: answer.trim() },
    ]
    setConversation(updatedConv)
    setAnswer('')

    // Persist progress to session
    fetch('/api/sessions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionsAsked: updatedConv
          .filter((m) => m.role === 'assistant')
          .map((m) => m.content),
        transcripts: updatedConv
          .filter((m) => m.role === 'user')
          .map((m) => m.content),
      }),
    })

    await fetchNextQuestion(updatedConv, fingerprint, sessionId)
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col px-6 pb-10 pt-14">
      {/* Back */}
      <button
        onClick={() => router.push('/')}
        className="absolute left-5 top-5 text-sm text-gray-400 hover:text-gray-700"
      >
        ← Back
      </button>

      {/* Progress dots */}
      <div className="mb-14 flex justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              i < progress ? 'bg-green-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Question + input */}
      <div className="flex flex-1 flex-col items-center gap-6">
        {/* Pulsing indicator */}
        <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />

        {/* Question text */}
        <p className="text-center text-2xl font-medium leading-snug text-gray-900 px-2 min-h-[4rem]">
          {isFetching ? (
            <span className="text-gray-300">...</span>
          ) : (
            currentQuestion
          )}
        </p>

        {/* Voice Recorder */}
        <VoiceRecorder
          key={recorderKey}
          onTranscript={(t) => setAnswer(t)}
        />

        {/* Text fallback toggle */}
        {!showTextInput ? (
          <button
            onClick={() => setShowTextInput(true)}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >
            Type instead
          </button>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleContinue()
              }}
              placeholder="Write here..."
              rows={4}
              className="w-full resize-none rounded-2xl border-2 border-green-600 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-300 focus:outline-none"
            />
            <button
              onClick={() => setShowTextInput(false)}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 self-center"
            >
              Use mic instead
            </button>
          </div>
        )}

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={!answer.trim() || isFetching}
          className="w-full rounded-2xl bg-green-700 py-3.5 text-base font-medium text-white transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
        </div>
      }
    >
      <RecordPageInner />
    </Suspense>
  )
}
