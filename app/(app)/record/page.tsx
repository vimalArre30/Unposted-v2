'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VoiceRecorder from '@/components/VoiceRecorder'
import { BackIcon } from '@/components/icons'
import { motion } from 'framer-motion'

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

  const userTurns = conversation.filter((m) => m.role === 'user').length
  const progress = Math.min(userTurns, 6)
  const progressPct = (progress / 6) * 100

  useEffect(() => {
    async function init() {
      const sessionRes = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const { sessionId: sid } = await sessionRes.json()
      setSessionId(sid)

      const { data: { user } } = await supabase.auth.getUser()

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

      await fetchNextQuestion([], fp, sid)
      setIsInitializing(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchNextQuestion(conv: Message[], fp: object | null, sid: string | null) {
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
      const resolvedId = sid ?? sessionId
      if (!resolvedId) {
        console.error('sessionId is null at wrap-up — cannot navigate to mood screen')
        return
      }
      router.push(`/record/mood?sessionId=${resolvedId}`)
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

    fetch('/api/sessions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionsAsked: updatedConv.filter((m) => m.role === 'assistant').map((m) => m.content),
        transcripts: updatedConv.filter((m) => m.role === 'user').map((m) => m.content),
      }),
    })

    await fetchNextQuestion(updatedConv, fingerprint, sessionId)
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-record">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-record">

      {/* Progress bar — thin line at very top */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-white/10 z-10">
        <motion.div
          className="h-full progress-shimmer"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="absolute left-5 top-5 flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors min-h-[44px] z-10"
      >
        <BackIcon size={16} />
        <span>Back</span>
      </button>

      {/* Progress label */}
      <div className="pt-5 flex justify-end px-6">
        <span className="text-xs text-white/40 tabular-nums">{progress}/6</span>
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-10 gap-6">

        {/* Pulsing dot */}
        <div className="h-2 w-2 rounded-full bg-sage/80 animate-pulse" />

        {/* Question text */}
        <motion.p
          key={currentQuestion}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center text-[1.45rem] font-medium leading-relaxed text-white/95 px-2 min-h-[5rem] text-balance"
        >
          {isFetching ? (
            <span className="text-white/30">thinking…</span>
          ) : (
            currentQuestion
          )}
        </motion.p>

        {/* Personalisation indicator */}
        {((fingerprint as { entry_count?: number } | null)?.entry_count ?? 0) >= 3 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 border border-white/10">
            ✦ Tailored to you
          </span>
        )}

        {/* Voice recorder — glass card wrapper */}
        <div className="w-full glass-dark px-5 py-5 mt-2">
          <VoiceRecorder
            key={recorderKey}
            onTranscript={(t) => setAnswer(t)}
          />
        </div>

        {/* Text fallback toggle */}
        {!showTextInput ? (
          <button
            onClick={() => setShowTextInput(true)}
            className="text-xs text-white/40 underline underline-offset-4 hover:text-white/70 transition-colors"
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
              placeholder="Write here…"
              rows={4}
              className="w-full resize-none rounded-[16px] bg-white/10 border border-white/20 px-4 py-3 text-base text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              onClick={() => setShowTextInput(false)}
              className="text-xs text-white/40 underline underline-offset-4 hover:text-white/70 self-center transition-colors"
            >
              Use mic instead
            </button>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!answer.trim() || isFetching}
          className="w-full btn-forest py-4 text-base"
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
        <div className="flex min-h-screen items-center justify-center bg-record">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
        </div>
      }
    >
      <RecordPageInner />
    </Suspense>
  )
}
