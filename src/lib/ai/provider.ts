import 'server-only'

import { createGeminiProvider } from '@/lib/ai/gemini'
import type { AiGenerateInput, AiProvider } from '@/lib/ai/types'
import type { AiProviderId } from '@/lib/campaign-features'
import { runtimeEnv } from '@/lib/runtime-env'

export function aiApiKey(): string {
  return runtimeEnv('AI_API_KEY') || runtimeEnv('GEMINI_API_KEY')
}

export function aiServerConfigured(): boolean {
  return Boolean(aiApiKey())
}

export function resolveAiProvider(campaignProvider: AiProviderId, campaignModel: string): AiProvider | null {
  const envProvider = (runtimeEnv('AI_PROVIDER') || campaignProvider || 'disabled').trim() as AiProviderId | string
  const providerId: AiProviderId =
    campaignProvider !== 'disabled' ? campaignProvider : envProvider === 'gemini' || envProvider === 'local' ? envProvider : 'disabled'
  if (providerId === 'disabled' || providerId === 'local') return null
  const key = aiApiKey()
  if (!key) return null
  const model = runtimeEnv('AI_MODEL') || campaignModel || 'gemini-2.5-flash'
  return createGeminiProvider(key, model)
}

export async function generateImprovedConcern(
  provider: AiProvider,
  input: AiGenerateInput,
  timeoutMs = 12000,
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await provider.generate(input, controller.signal)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('timeout')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
