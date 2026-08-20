import { aiSystemPrompt, aiUserPrompt } from '@/lib/ai/prompts'
import type { AiGenerateInput, AiProvider } from '@/lib/ai/types'

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  error?: { message?: string }
}

export function createGeminiProvider(apiKey: string, model: string): AiProvider {
  const safeModel = model.trim() || 'gemini-2.5-flash'
  return {
    id: 'gemini',
    async generate(input: AiGenerateInput, signal?: AbortSignal): Promise<string> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(safeModel)}:generateContent`
      const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: aiSystemPrompt() }] },
          contents: [{ role: 'user', parts: [{ text: aiUserPrompt(input) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
          },
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as GeminiResponse
      if (!response.ok) {
        const message = payload.error?.message ?? ''
        if (response.status === 429 || /quota|rate/i.test(message)) {
          throw new Error('quota')
        }
        throw new Error('unavailable')
      }
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n').trim() ?? ''
      if (!text) throw new Error('invalid')
      return text.slice(0, 4000)
    },
  }
}
