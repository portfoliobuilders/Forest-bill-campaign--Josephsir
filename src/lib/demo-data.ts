/** Test fixtures only. Do not import this module from production UI. */
import type { DetailsFields } from '@/lib/details-schema'

export type { DistrictOption } from '@/lib/kerala-districts'
export { KERALA_DISTRICTS } from '@/lib/kerala-districts'

/** Empty details for forms. Never pre-fill a fake citizen. */
export function emptyFormDetails(): DetailsFields {
  return {
    fullName: '',
    addressLine: '',
    panchayat: '',
    village: '',
    district: '',
    pincode: '',
    phone: '',
    email: '',
    customText: '',
  }
}
