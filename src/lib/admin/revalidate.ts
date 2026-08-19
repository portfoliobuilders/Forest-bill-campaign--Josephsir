import { revalidatePath } from 'next/cache'

export function revalidatePublicCampaign(): void {
  revalidatePath('/')
  revalidatePath('/objection')
  revalidatePath('/bill')
  revalidatePath('/data')
}

export function revalidateAdmin(): void {
  revalidatePath('/admin')
  revalidatePath('/admin/campaign')
  revalidatePath('/admin/concerns')
  revalidatePath('/admin/email-template')
  revalidatePath('/admin/submissions')
  revalidatePath('/admin/analytics')
  revalidatePath('/admin/public-data')
  revalidatePath('/admin/requests')
  revalidatePath('/admin/settings')
}

export function revalidateAfterCmsSave(): void {
  revalidatePublicCampaign()
  revalidateAdmin()
}
