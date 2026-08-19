export const EMAIL_PLACEHOLDERS = [
  'intro',
  'concerns',
  'custom_text',
  'closing',
  'full_name',
  'email',
  'phone',
  'address',
  'panchayat',
  'district',
  'pincode',
  'constituency',
] as const

export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number]

export type EmailTemplateValues = Record<EmailPlaceholder, string>

export const DEFAULT_BODY_TEMPLATE_ML = `Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

ആദരപൂർവ്വം,

പേര്: {{full_name}}
വിലാസം: {{address}}
പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി: {{panchayat}}
ജില്ല: {{district}}
പിൻകോഡ്: {{pincode}}
ഫോൺ: {{phone}}
ഇമെയിൽ: {{email}}`

export const DEFAULT_BODY_TEMPLATE_EN = `Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

Regards,

Name: {{full_name}}
Address: {{address}}
Panchayat / Municipality: {{panchayat}}
District: {{district}}
PIN: {{pincode}}
Phone: {{phone}}
Email: {{email}}`

const PLACEHOLDER_RE = /\{\{\s*([a-z_]+)\s*\}\}/gi
const ALLOWED = new Set<string>(EMAIL_PLACEHOLDERS)

export function defaultBodyTemplate(lang: 'ml' | 'en'): string {
  return lang === 'en' ? DEFAULT_BODY_TEMPLATE_EN : DEFAULT_BODY_TEMPLATE_ML
}

export function emptyTemplateValues(): EmailTemplateValues {
  return {
    intro: '',
    concerns: '',
    custom_text: '',
    closing: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    panchayat: '',
    district: '',
    pincode: '',
    constituency: '',
  }
}

/** Replace only known {{placeholders}}. Unknown tokens become empty. Never evaluates code. */
export function renderSafeTemplate(template: string, values: Partial<EmailTemplateValues>): string {
  const merged: EmailTemplateValues = { ...emptyTemplateValues(), ...values }
  const rendered = template.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const normalized = key.toLowerCase()
    if (!ALLOWED.has(normalized)) return ''
    return merged[normalized as EmailPlaceholder] ?? ''
  })
  return collapseBlankLines(rendered)
}

export function collapseBlankLines(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
}

export function listUnknownPlaceholders(template: string): string[] {
  const unknown = new Set<string>()
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const key = match[1]?.toLowerCase() ?? ''
    if (key && !ALLOWED.has(key)) unknown.add(key)
  }
  return [...unknown]
}
