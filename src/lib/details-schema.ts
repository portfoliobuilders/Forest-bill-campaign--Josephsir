import { z } from 'zod'

import { t, type Lang } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'

export const MAX_CUSTOM_CHARS = 300

export type DetailsFields = {
  fullName: string
  addressLine: string
  panchayat: string
  district: string
  pincode: string
  phone: string
  email: string
  customText: string
}

export function createDetailsSchema(lang: Lang, districts: string[]) {
  return z.object({
    fullName: z.string().trim().min(1, t(lang, 'errorFullName')),
    addressLine: z.string().trim().min(1, t(lang, 'errorAddress')),
    panchayat: z.string().trim(),
    district: z
      .string()
      .trim()
      .min(1, t(lang, 'errorDistrict'))
      .refine((value) => districts.includes(value), t(lang, 'errorDistrict')),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, t(lang, 'errorPincode')),
    phone: z
      .string()
      .trim()
      .min(1, t(lang, 'errorPhone'))
      .refine((value) => normalizeIndianPhone(value) !== null, t(lang, 'errorPhone')),
    email: z.email(t(lang, 'errorEmail')),
    customText: z.string().max(MAX_CUSTOM_CHARS, t(lang, 'errorCustomText')),
  })
}

export type FieldErrors = Partial<Record<keyof DetailsFields, string>>

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in out)) {
      out[key as keyof DetailsFields] = issue.message
    }
  }
  return out
}
