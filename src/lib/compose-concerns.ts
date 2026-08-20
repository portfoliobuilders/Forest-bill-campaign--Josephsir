import type { Lang } from '@/lib/i18n'
import type { ObjectionClause } from '@/types/database'

function pick(lang: Lang, ml: string, en: string): string {
  return lang === 'en' ? en : ml
}

export function concernTitle(clause: ObjectionClause, lang: Lang): string {
  return pick(lang, clause.title_ml, clause.title_en).trim()
}

export function concernBody(clause: ObjectionClause, lang: Lang): string {
  return (
    pick(lang, clause.email_body_ml ?? '', clause.email_body_en ?? '').trim() ||
    pick(lang, clause.full_text_ml ?? '', clause.full_text_en ?? '').trim() ||
    pick(lang, clause.email_ml, clause.email_en).trim() ||
    pick(lang, clause.explain_ml, clause.explain_en).trim()
  )
}

export function concernShort(clause: ObjectionClause, lang: Lang): string {
  return pick(lang, clause.explain_ml, clause.explain_en).trim() || concernBody(clause, lang)
}

export function approvedAiBody(clause: ObjectionClause, lang: Lang): string {
  const status = lang === 'en' ? clause.ai_body_en_status : clause.ai_body_ml_status
  const body = lang === 'en' ? clause.ai_body_en : clause.ai_body_ml
  if (status === 'approved' && body?.trim()) return body.trim()
  return ''
}
