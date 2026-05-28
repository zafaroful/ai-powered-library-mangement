export interface SentenceTiming {
  text: string
  start: number
  end: number
}

export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  return (sentences ?? [trimmed]).map((s) => s.trim()).filter(Boolean)
}

export function calculateSentenceTimings(
  text: string,
  totalDuration: number
): SentenceTiming[] {
  const sentences = splitIntoSentences(text)
  if (sentences.length === 0) return []

  const totalWords = text.trim().split(/\s+/).filter(Boolean).length || 1
  let currentTime = 0

  return sentences.map((sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean).length || 1
    const duration = (words / totalWords) * totalDuration
    const start = currentTime
    currentTime += duration
    return { text: sentence, start, end: currentTime }
  })
}

export function getActiveSentenceIndex(
  timings: SentenceTiming[],
  currentTime: number
): number {
  if (timings.length === 0) return -1

  for (let i = 0; i < timings.length; i++) {
    if (currentTime >= timings[i].start && currentTime < timings[i].end) {
      return i
    }
  }

  if (currentTime >= timings[timings.length - 1].end) {
    return timings.length - 1
  }

  return 0
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
