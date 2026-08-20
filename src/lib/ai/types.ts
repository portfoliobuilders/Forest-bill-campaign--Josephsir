export type AiImproveRequest = {
  campaignId: string
  concernId: string
  language: 'ml' | 'en'
}

export type AiImproveResult =
  | { ok: true; body: string; cached: boolean }
  | { ok: false; error: 'disabled' | 'unavailable' | 'quota' | 'invalid' | 'timeout' }

export type AiGenerateInput = {
  language: 'ml' | 'en'
  campaignTitle: string
  concernTitle: string
  concernBody: string
}

export interface AiProvider {
  readonly id: 'gemini' | 'local'
  generate(input: AiGenerateInput, signal?: AbortSignal): Promise<string>
}
