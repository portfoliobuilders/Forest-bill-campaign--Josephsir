import { z } from 'zod'

import { isFieldEnabled, isFieldRequired } from '@/lib/form-fields'
import { t, type Lang } from '@/lib/i18n'
import { normalizeIndianPhone } from '@/lib/phone'
import { PINCODE_RE } from '@/lib/postal'
import type { CampaignFormField } from '@/types/database'

export const MAX_CUSTOM_CHARS = 1000

export type DetailsFields = {
  fullName: string
  addressLine: string
  panchayat: string
  village: string
  district: string
  pincode: string
  phone: string
  email: string
  customText: string
}

export const emptyDetails = (): DetailsFields => ({
  fullName: '',
  addressLine: '',
  panchayat: '',
  village: '',
  district: '',
  pincode: '',
  phone: '',
  email: '',
  customText: '',
})

export function createDetailsSchema(lang: Lang, districts: string[], fields: CampaignFormField[]) {
  const optionalText = z.string().trim()
  const name = z.string().trim().min(1, t(lang, 'errorFullName'))

  const emailRequired = isFieldRequired(fields, 'email')
  const email = emailRequired
    ? z.email(t(lang, 'errorEmail'))
    : z
        .string()
        .trim()
        .refine((value) => !value || z.email().safeParse(value).success, t(lang, 'errorEmail'))

  const phone = isFieldRequired(fields, 'phone')
    ? z
        .string()
        .trim()
        .min(1, t(lang, 'errorPhone'))
        .refine((value) => normalizeIndianPhone(value) !== null, t(lang, 'errorPhone'))
    : z
        .string()
        .trim()
        .refine((value) => !value || normalizeIndianPhone(value) !== null, t(lang, 'errorPhone'))

  const districtEnabled = isFieldEnabled(fields, 'district')
  const districtRequired = isFieldRequired(fields, 'district')
  const district = districtEnabled
    ? districtRequired
      ? z
          .string()
          .trim()
          .min(1, t(lang, 'errorDistrict'))
          .refine((value) => districts.length === 0 || districts.includes(value), t(lang, 'errorDistrict'))
      : z
          .string()
          .trim()
          .refine((value) => !value || districts.length === 0 || districts.includes(value), t(lang, 'errorDistrict'))
    : optionalText

  const address = isFieldRequired(fields, 'address')
    ? z.string().trim().min(1, t(lang, 'errorAddress'))
    : optionalText

  const panchayat = isFieldRequired(fields, 'local_body')
    ? z.string().trim().min(1, t(lang, 'panchayat'))
    : optionalText

  const village = isFieldRequired(fields, 'village') ? z.string().trim().min(1, t(lang, 'village')) : optionalText

  const pincodeRequired = isFieldRequired(fields, 'pincode')
  const pincodeEnabled = isFieldEnabled(fields, 'pincode')
  const pincode = pincodeRequired
    ? z.string().trim().regex(PINCODE_RE, t(lang, 'errorPincode'))
    : pincodeEnabled
      ? z
          .string()
          .trim()
          .refine((value) => !value || PINCODE_RE.test(value), t(lang, 'errorPincode'))
      : optionalText

  const customText = z.string().max(MAX_CUSTOM_CHARS, t(lang, 'errorCustomText'))

  return z.object({
    fullName: name,
    email,
    phone,
    addressLine: address,
    panchayat,
    village,
    district,
    pincode,
    customText,
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
