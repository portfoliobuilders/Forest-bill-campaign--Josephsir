const SYSTEM_PROMPT = `You rewrite a citizen's government representation.

Rules:
- Use only the facts supplied.
- Do not add new legal or factual claims.
- Do not invent notification numbers, dates, laws, sections, statistics, land ownership facts, court rulings, government decisions, scientific findings, names of officers, or any claim not supplied.
- Do not change the citizen's requested action.
- Do not exaggerate.
- Do not add personal identity, names, PIN codes, addresses, phone numbers, email addresses, or exact locations.
- Keep the same language as the input (Malayalam or English).
- Style: respectful, factual, concise, professional, suitable for a government department.
- Do not create aggressive, defamatory, or exaggerated wording.
- Return only the improved letter body. No title, no markdown, no preamble.`

export function aiSystemPrompt(): string {
  return SYSTEM_PROMPT
}

export function aiUserPrompt(input: {
  language: 'ml' | 'en'
  campaignTitle: string
  concernTitle: string
  concernBody: string
}): string {
  const language = input.language === 'en' ? 'English' : 'Malayalam'
  return [
    `Language: ${language}`,
    '',
    'Campaign:',
    input.campaignTitle.trim(),
    '',
    'Concern:',
    input.concernTitle.trim(),
    '',
    input.concernBody.trim(),
    '',
    'Instruction:',
    'Rewrite this as a clear, respectful government representation.',
    'Do not invent facts.',
  ].join('\n')
}
