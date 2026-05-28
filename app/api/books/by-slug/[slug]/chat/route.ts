import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/server'
import { getBookBySlugOrId } from '@/lib/books/resolve'
import { getEmbedding } from '@/lib/openai/embeddings'
import type { ChatMessage } from '@/types'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const book = await getBookBySlugOrId(slug)

  if (!book) {
    return Response.json({ error: 'Book not found' }, { status: 404 })
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] }
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')

  if (!lastUser?.content?.trim()) {
    return Response.json({ error: 'Message required' }, { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 503 })
  }

  let contextBlocks = ''

  if (book.pdf_processed_at) {
    try {
      const supabase = await createClient()
      const embedding = await getEmbedding(lastUser.content)
      const { data: chunks } = await supabase.rpc('match_book_chunks', {
        p_book_id: book.id,
        query_embedding: embedding,
        match_threshold: 0.45,
        match_count: 8,
      })

      if (chunks?.length) {
        contextBlocks = chunks
          .map((c: { content: string }, i: number) => `[Excerpt ${i + 1}]\n${c.content}`)
          .join('\n\n')
      }
    } catch {
      // fall back to metadata only
    }
  }

  const metadataContext = `
Book: ${book.title}
Author: ${book.author}
Category: ${book.category ?? 'N/A'}
Description: ${book.description ?? 'N/A'}
`.trim()

  const systemPrompt = `You are a helpful library assistant for the book "${book.title}" by ${book.author}.
Answer questions using ONLY the provided book metadata and PDF excerpts. If the answer is not in the context, say you don't have that information in the available material.
Be concise and educational. Do not invent plot points or facts not supported by the excerpts.

${metadataContext}

${contextBlocks ? `--- PDF EXCERPTS ---\n${contextBlocks}` : 'No PDF excerpts indexed yet. Use metadata only.'}`

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    max_tokens: 800,
  })

  const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.'

  return Response.json({ reply })
}
