export { CONSENT_VERSION } from '@/lib/consent'

export type ActionOk<T> = { ok: true; data: T }
export type ActionErr = { ok: false; error: string }
export type ActionResult<T> = ActionOk<T> | ActionErr
