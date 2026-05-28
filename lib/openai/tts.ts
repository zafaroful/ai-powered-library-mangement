import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const openai = getOpenAI()
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Text is required for speech generation')
  }

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: trimmed.slice(0, 4096),
  })

  return response.arrayBuffer()
}
