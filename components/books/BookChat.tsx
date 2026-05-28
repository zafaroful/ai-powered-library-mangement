'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface BookChatProps {
  bookSlug: string
  bookTitle: string
  pdfProcessed: boolean
  embedded?: boolean
}

export function BookChat({ bookSlug, bookTitle, pdfProcessed, embedded = false }: BookChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/api/books/by-slug/${encodeURIComponent(bookSlug)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to get response')
        setMessages(messages)
        return
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Something went wrong. Please try again.')
      setMessages(messages)
    } finally {
      setLoading(false)
    }
  }

  const chatBody = (
    <>
      {!embedded && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-primary" />
            Ask about this book
          </CardTitle>
          <p className="text-xs text-muted-foreground line-clamp-1">{bookTitle}</p>
        </CardHeader>
      )}
      <CardContent className={cn('flex flex-1 flex-col gap-3 overflow-hidden', embedded ? 'p-0 pt-0' : 'pt-0')}>
        {!pdfProcessed && (
          <Alert>
            <AlertDescription className="text-xs">
              PDF is still indexing. Answers may use the book summary only until indexing completes.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 rounded-md border p-3">
          <div className="space-y-3 pr-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask about themes, chapters, concepts, or anything in &quot;{bookTitle}&quot;.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[95%]',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-muted-foreground animate-pulse">Thinking...</p>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </>
  )

  if (embedded) {
    return <div className="flex h-full min-h-0 flex-col">{chatBody}</div>
  }

  return (
    <Card className="flex h-[min(520px,70vh)] flex-col">
      {chatBody}
    </Card>
  )
}
