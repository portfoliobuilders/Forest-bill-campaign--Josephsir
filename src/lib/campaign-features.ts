export type IdentityMode = 'required' | 'optional'
export type AiProviderId = 'disabled' | 'gemini' | 'local'

export type CampaignFeatureSettings = {
  identity_mode: IdentityMode
  enable_pin_lookup: boolean
  allow_privacy_mode: boolean
  enable_voice_input: boolean
  enable_mail_read_aloud: boolean
  enable_ai_mail: boolean
  ai_provider: AiProviderId
  ai_model: string
  ai_daily_limit: number
  ai_monthly_limit: number
  ai_free_only: boolean
}

export const DEFAULT_FEATURE_SETTINGS: CampaignFeatureSettings = {
  identity_mode: 'required',
  enable_pin_lookup: true,
  allow_privacy_mode: false,
  enable_voice_input: true,
  enable_mail_read_aloud: true,
  enable_ai_mail: false,
  ai_provider: 'disabled',
  ai_model: 'gemini-2.5-flash',
  ai_daily_limit: 40,
  ai_monthly_limit: 1000,
  ai_free_only: true,
}

export const ESA_FEATURE_SETTINGS: CampaignFeatureSettings = {
  ...DEFAULT_FEATURE_SETTINGS,
  identity_mode: 'required',
  enable_pin_lookup: true,
  allow_privacy_mode: false,
  enable_voice_input: true,
  enable_mail_read_aloud: true,
  enable_ai_mail: false,
  ai_provider: 'disabled',
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1) return true
  if (value === 'false' || value === 0) return false
  return fallback
}

function asPositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(n) || n < 0) return fallback
  return n
}

function asIdentityMode(value: unknown): IdentityMode {
  return value === 'optional' ? 'optional' : 'required'
}

function asProvider(value: unknown): AiProviderId {
  if (value === 'gemini' || value === 'local' || value === 'disabled') return value
  return 'disabled'
}

export function parseFeatureSettings(raw: unknown): CampaignFeatureSettings {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const model = typeof row.ai_model === 'string' ? row.ai_model.trim() : ''
  return {
    identity_mode: asIdentityMode(row.identity_mode),
    enable_pin_lookup: asBoolean(row.enable_pin_lookup, DEFAULT_FEATURE_SETTINGS.enable_pin_lookup),
    allow_privacy_mode: asBoolean(row.allow_privacy_mode, DEFAULT_FEATURE_SETTINGS.allow_privacy_mode),
    enable_voice_input: asBoolean(row.enable_voice_input, DEFAULT_FEATURE_SETTINGS.enable_voice_input),
    enable_mail_read_aloud: asBoolean(
      row.enable_mail_read_aloud,
      DEFAULT_FEATURE_SETTINGS.enable_mail_read_aloud,
    ),
    enable_ai_mail: asBoolean(row.enable_ai_mail, DEFAULT_FEATURE_SETTINGS.enable_ai_mail),
    ai_provider: asProvider(row.ai_provider),
    ai_model: model || DEFAULT_FEATURE_SETTINGS.ai_model,
    ai_daily_limit: asPositiveInt(row.ai_daily_limit, DEFAULT_FEATURE_SETTINGS.ai_daily_limit),
    ai_monthly_limit: asPositiveInt(row.ai_monthly_limit, DEFAULT_FEATURE_SETTINGS.ai_monthly_limit),
    ai_free_only: asBoolean(row.ai_free_only, DEFAULT_FEATURE_SETTINGS.ai_free_only),
  }
}

export function publicAiAvailable(settings: CampaignFeatureSettings, serverConfigured: boolean): boolean {
  return (
    settings.enable_ai_mail &&
    settings.ai_provider !== 'disabled' &&
    serverConfigured
  )
}

export function identityRequired(settings: CampaignFeatureSettings, privacyMode: boolean): boolean {
  if (privacyMode && settings.allow_privacy_mode) return false
  return settings.identity_mode === 'required'
}
