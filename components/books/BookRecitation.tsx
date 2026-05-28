'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  calculateSentenceTimings,
  formatAudioTime,
  getActiveSentenceIndex,
  splitIntoSentences,
  type SentenceTiming,
} from '@/lib/utils/recitation'

interface BookRecitationProps {
  bookSlug: string
  bookTitle: string
  description?: string | null
}

export function BookRecitation({ bookSlug, bookTitle, description }: BookRecitationProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const sentenceRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const objectUrlRef = useRef<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [timings, setTimings] = useState<SentenceTiming[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [audioReady, setAudioReady] = useState(false)

  const text = description?.trim() ?? ''
  const sentences = splitIntoSentences(text)

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupObjectUrl()
  }, [cleanupObjectUrl])

  const loadAudio = useCallback(async () => {
    if (!text || audioReady) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/books/by-slug/${encodeURIComponent(bookSlug)}/tts`
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load recitation audio')
      }

      cleanupObjectUrl()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      const audio = audioRef.current
      if (!audio) return

      audio.src = url
      await audio.load()
      setAudioReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio')
    } finally {
      setLoading(false)
    }
  }, [audioReady, bookSlug, cleanupObjectUrl, text])

  const handlePlayPause = async () => {
    if (!text) return

    const audio = audioRef.current
    if (!audio) return

    if (!audioReady) {
      await loadAudio()
    }

    if (!audioRef.current?.src) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setError('Unable to play audio. Please try again.')
    }
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return

    setCurrentTime(audio.currentTime)

    if (timings.length > 0) {
      setActiveIndex(getActiveSentenceIndex(timings, audio.currentTime))
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio || !text) return

    setDuration(audio.duration)
    setTimings(calculateSentenceTimings(text, audio.duration))
    setActiveIndex(0)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (timings.length > 0) {
      setActiveIndex(timings.length - 1)
    }
  }

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return

    audio.currentTime = value
    setCurrentTime(value)
    if (timings.length > 0) {
      setActiveIndex(getActiveSentenceIndex(timings, value))
    }
  }

  const handleRetry = () => {
    cleanupObjectUrl()
    setAudioReady(false)
    setError(null)
    setTimings([])
    setActiveIndex(-1)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
    }
  }

  useEffect(() => {
    if (activeIndex < 0) return
    sentenceRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [activeIndex])

  if (!text) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No description available for recitation.
      </p>
    )
  }


  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        preload="none"
      />

      <div className="flex w-full flex-col items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="shrink-0"
          onClick={() => void handlePlayPause()}
          disabled={loading}
          aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <div className="flex w-full max-w-[280px] flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            disabled={!audioReady || duration === 0}
            className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Recitation progress"
          />
          <div className="flex w-full justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleRetry}>
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1 rounded-lg bg-zinc-950 p-4">
        <div className="space-y-4 pr-2">
          {sentences.map((sentence, index) => {
            const isActive = index === activeIndex
            const isPast = activeIndex >= 0 && index < activeIndex

            return (
              <p
                key={`${index}-${sentence.slice(0, 24)}`}
                ref={(el) => {
                  sentenceRefs.current[index] = el
                }}
                className={cn(
                  'text-base leading-relaxed transition-colors duration-300 md:text-lg',
                  isActive && 'font-semibold text-white',
                  isPast && 'text-zinc-500',
                  !isActive && !isPast && 'text-zinc-600'
                )}
              >
                {sentence}
              </p>
            )
          })}
        </div>
      </ScrollArea>

      <p className="text-center text-[10px] text-muted-foreground line-clamp-2">
        Reciting summary of &quot;{bookTitle}&quot;
      </p>
    </div>
  )
}
