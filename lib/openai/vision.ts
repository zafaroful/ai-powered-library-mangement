import OpenAI from 'openai'
import type { ExtractedBookMetadata } from '@/types'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function extractBookFromImage(
  base64: string,
  mimeType: string
): Promise<ExtractedBookMetadata> {
  const openai = getOpenAI()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You extract bibliographic metadata from book photos (covers, spines, or barcodes).
Return ONLY a JSON object with these keys:
- title: string or null (book title as printed)
- author: string or null (primary author)
- isbn: string or null (ISBN-10 or ISBN-13 if visible on cover or barcode area)
- confidence: number from 0 to 1 indicating extraction confidence

If text is unclear, use null for that field. Do not invent titles.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the book title, author, and ISBN from this image.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as ExtractedBookMetadata

  return {
    title: parsed.title?.trim() || undefined,
    author: parsed.author?.trim() || undefined,
    isbn: parsed.isbn?.trim() || undefined,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
  }
}
