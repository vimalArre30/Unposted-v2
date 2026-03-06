'use client'

import { useEffect, useRef, useState } from 'react'

type RecorderState = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'done'
type Lang = 'en' | 'ta' | 'hi'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिंदी' },
]

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void
}

const MAX_DURATION = 180 // 3 minutes in seconds
const MIN_DURATION = 5  // 5 seconds

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedLang, setSelectedLang] = useState<Lang>('en')
  const [mixWithEnglish, setMixWithEnglish] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function startTimer() {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(secs)
      if (secs >= MAX_DURATION) {
        stopRecording()
      }
    }, 500)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function startRecording() {
    setError(null)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      mr.start(100)
      setElapsed(0)
      setState('recording')
      startTimer()
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.')
    }
  }

  function stopRecording() {
    stopTimer()
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
    const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
    if (secs < MIN_DURATION) {
      setTimeout(() => {
        setError('Hold for at least 5 seconds.')
        blobRef.current = null
        setAudioUrl(null)
        setState('idle')
        setElapsed(0)
      }, 200)
      return
    }
    setState('recorded')
  }

  function reRecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    blobRef.current = null
    setTranscript(null)
    setError(null)
    setElapsed(0)
    setState('idle')
  }

  async function transcribe() {
    if (!blobRef.current) return
    setState('transcribing')
    setError(null)

    const formData = new FormData()
    formData.append('audio', blobRef.current, 'recording.webm')
    formData.append('language', selectedLang)
    formData.append('mix', mixWithEnglish ? 'true' : 'false')

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Transcription failed')
      const data = await res.json()
      if (data.ambient) {
        setError('No speech detected. Please try again.')
        setState('recorded')
        return
      }
      setTranscript(data.transcript)
      setState('done')
      onTranscript(data.transcript)
    } catch {
      setError('Transcription failed. Try again.')
      setState('recorded')
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Language selector — always visible */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => {
                setSelectedLang(code)
                if (code === 'en') setMixWithEnglish(false)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedLang === code
                  ? 'border-green-700 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mix toggle — only for Tamil or Hindi */}
        {selectedLang !== 'en' && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mixWithEnglish}
              onChange={(e) => setMixWithEnglish(e.target.checked)}
              className="h-3.5 w-3.5 accent-green-700"
            />
            <span className="text-xs text-gray-400">Mix with English</span>
          </label>
        )}
      </div>

      {/* IDLE */}
      {state === 'idle' && (
        <button
          onClick={startRecording}
          aria-label="Start recording"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-700 text-white shadow-lg
            before:absolute before:inset-0 before:rounded-full before:bg-green-700 before:opacity-30
            before:animate-ping"
        >
          <MicIcon />
        </button>
      )}

      {/* RECORDING */}
      {state === 'recording' && (
        <div className="flex flex-col items-center gap-4">
          <Waveform />
          <span className="font-mono text-sm text-gray-500">{formatTime(elapsed)}</span>
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
          >
            <StopIcon />
          </button>
        </div>
      )}

      {/* RECORDED */}
      {state === 'recorded' && audioUrl && (
        <div className="flex flex-col items-center gap-4 w-full">
          <audio src={audioUrl} controls className="w-full rounded-xl" />
          <div className="flex items-center gap-4">
            <button
              onClick={reRecord}
              className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-700"
            >
              Re-record
            </button>
            <button
              onClick={transcribe}
              className="rounded-2xl bg-green-700 px-6 py-2.5 text-sm font-medium text-white"
            >
              Transcribe
            </button>
          </div>
        </div>
      )}

      {/* TRANSCRIBING */}
      {state === 'transcribing' && (
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <span className="text-sm text-gray-400">Transcribing...</span>
        </div>
      )}

      {/* DONE */}
      {state === 'done' && transcript && (
        <div className="w-full rounded-2xl border-2 border-green-600 bg-white px-4 py-3 text-base text-gray-800 leading-relaxed">
          {transcript}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

function Waveform() {
  return (
    <div className="flex items-end gap-1 h-10">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-green-600"
          style={{
            animation: `waveBar 0.9s ease-in-out ${i * 0.15}s infinite alternate`,
            height: '40%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { height: 25%; }
          to   { height: 100%; }
        }
      `}</style>
    </div>
  )
}

function Spinner() {
  return (
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
  )
}
