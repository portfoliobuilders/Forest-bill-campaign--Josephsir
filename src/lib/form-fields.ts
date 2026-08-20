import type { CampaignFormField, FormFieldKey } from '@/types/database'

export const FORM_FIELD_KEYS: FormFieldKey[] = [
  'name',
  'pincode',
  'email',
  'phone',
  'district',
  'local_body',
  'village',
  'address',
  'custom_message',
]

export const DEFAULT_FORM_FIELDS: Array<Omit<CampaignFormField, 'id' | 'campaign_id'>> = [
  { field_key: 'name', label_en: 'Full name', label_ml: 'പൂർണ്ണ നാമം', is_enabled: true, is_required: true, display_order: 1 },
  { field_key: 'pincode', label_en: 'PIN code', label_ml: 'പിൻകോഡ്', is_enabled: true, is_required: true, display_order: 2 },
  { field_key: 'email', label_en: 'Email', label_ml: 'ഇമെയിൽ', is_enabled: false, is_required: false, display_order: 3 },
  { field_key: 'phone', label_en: 'Mobile number', label_ml: 'മൊബൈൽ നമ്പർ', is_enabled: false, is_required: false, display_order: 4 },
  { field_key: 'address', label_en: 'Address', label_ml: 'വിലാസം', is_enabled: false, is_required: false, display_order: 5 },
  { field_key: 'district', label_en: 'District', label_ml: 'ജില്ല', is_enabled: false, is_required: false, display_order: 6 },
  { field_key: 'local_body', label_en: 'Panchayat / Municipality', label_ml: 'പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി', is_enabled: false, is_required: false, display_order: 7 },
  { field_key: 'village', label_en: 'Village', label_ml: 'വില്ലേജ്', is_enabled: false, is_required: false, display_order: 8 },
  { field_key: 'custom_message', label_en: 'Additional concern', label_ml: 'അധിക ആശങ്ക', is_enabled: true, is_required: false, display_order: 9 },
]

export function normalizeFormFields(rows: CampaignFormField[] | null | undefined): CampaignFormField[] {
  if (rows && rows.length > 0) {
    const have = new Set(rows.map((row) => row.field_key))
    const missing = DEFAULT_FORM_FIELDS.filter((field) => !have.has(field.field_key)).map((field) => ({
      id: `default-${field.field_key}`,
      campaign_id: rows[0]?.campaign_id || '',
      ...field,
    }))
    return [...rows, ...missing].sort((a, b) => a.display_order - b.display_order)
  }
  return DEFAULT_FORM_FIELDS.map((field, index) => ({
    id: `default-${field.field_key}`,
    campaign_id: '',
    ...field,
    display_order: index + 1,
  }))
}

export function fieldByKey(fields: CampaignFormField[], key: FormFieldKey): CampaignFormField | undefined {
  return fields.find((field) => field.field_key === key)
}

export function isFieldEnabled(fields: CampaignFormField[], key: FormFieldKey): boolean {
  const field = fieldByKey(fields, key)
  if (!field) return key === 'name' || key === 'pincode'
  return field.is_enabled
}

export function isFieldRequired(fields: CampaignFormField[], key: FormFieldKey): boolean {
  const field = fieldByKey(fields, key)
  if (key === 'name') return true
  if (!field) return key === 'pincode'
  if (!field.is_enabled) return false
  return field.is_required
}
