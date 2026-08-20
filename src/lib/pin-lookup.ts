import 'server-only'

import { createAnonServerClient } from '@/lib/supabase/anon-server'
import { createServiceClientOrNull } from '@/lib/supabase/server'
import {
  isValidPincode,
  mapDirectoryRow,
  summarizePostalOffices,
  type PostalLookup,
  type PostalOffice,
} from '@/lib/postal'
import { runtimeEnv } from '@/lib/runtime-env'

type DirectoryRow = {
  pincode: string
  office_name: string
  office_type: string | null
  delivery_status: string | null
  circle_name: string | null
  region_name: string | null
  division_name: string | null
  district_name: string | null
  state_name: string | null
  taluk_name: string | null
}

async function fromLocalDirectory(pincode: string): Promise<PostalOffice[]> {
  const anon = createAnonServerClient()
  const client = anon ?? createServiceClientOrNull()
  if (!client) return []
  const { data, error } = await client
    .from('postal_directory')
    .select(
      'pincode, office_name, office_type, delivery_status, circle_name, region_name, division_name, district_name, state_name, taluk_name',
    )
    .eq('pincode', pincode)
    .order('office_name', { ascending: true })
  if (error || !data) return []
  return (data as DirectoryRow[]).map(mapDirectoryRow)
}

async function cacheOffices(offices: PostalOffice[], source: string): Promise<void> {
  if (offices.length === 0) return
  const supabase = createServiceClientOrNull()
  if (!supabase) return
  const now = new Date().toISOString()
  await supabase.from('postal_directory').upsert(
    offices.map((office) => ({
      pincode: office.pincode,
      office_name: office.officeName,
      office_type: office.officeType,
      delivery_status: office.deliveryStatus,
      circle_name: office.circleName,
      region_name: office.regionName,
      division_name: office.divisionName,
      district_name: office.districtName,
      state_name: office.stateName,
      taluk_name: office.talukName,
      source,
      source_updated_at: now,
      updated_at: now,
    })),
    { onConflict: 'pincode,office_name' },
  )
}

type PostalApiOffice = {
  Name?: string
  BranchType?: string
  DeliveryStatus?: string
  Circle?: string
  Region?: string
  Division?: string
  District?: string
  State?: string
  Pincode?: string
}

function officesFromPostalApi(pincode: string, payload: unknown): PostalOffice[] {
  if (!Array.isArray(payload) || payload.length === 0) return []
  const first = payload[0] as { Status?: string; PostOffice?: PostalApiOffice[] }
  if (first.Status !== 'Success' || !Array.isArray(first.PostOffice)) return []
  return first.PostOffice.map((office) => ({
    pincode: office.Pincode || pincode,
    officeName: (office.Name ?? '').trim(),
    officeType: office.BranchType ?? null,
    deliveryStatus: office.DeliveryStatus ?? null,
    circleName: office.Circle ?? null,
    regionName: office.Region ?? null,
    divisionName: office.Division ?? null,
    districtName: office.District ?? null,
    stateName: office.State ?? null,
    talukName: null,
  })).filter((office) => office.officeName)
}

async function fromPostalPincodeApi(pincode: string): Promise<PostalOffice[]> {
  const template = runtimeEnv('PINCODE_FALLBACK_URL') || 'https://api.postalpincode.in/pincode/{pin}'
  const url = template.replace('{pin}', encodeURIComponent(pincode))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return []
    const payload = await response.json()
    return officesFromPostalApi(pincode, payload)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

type DataGovRecord = {
  officename?: string
  pincode?: string | number
  officetype?: string
  deliverystatus?: string
  circlename?: string
  regionname?: string
  divisionname?: string
  districtname?: string
  statename?: string
  taluk?: string
}

async function fromDataGov(pincode: string): Promise<PostalOffice[]> {
  const key = runtimeEnv('DATA_GOV_API_KEY')
  if (!key) return []
  const resource = runtimeEnv('DATA_GOV_PINCODE_RESOURCE') || '6176ee09-3d56-4a3b-8115-21841576b2f6'
  const url = `https://api.data.gov.in/resource/${resource}?api-key=${encodeURIComponent(key)}&format=json&filters[pincode]=${encodeURIComponent(pincode)}&limit=50`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok) return []
    const payload = (await response.json()) as { records?: DataGovRecord[] }
    const records = Array.isArray(payload.records) ? payload.records : []
    return records
      .map((record) => ({
        pincode: String(record.pincode ?? pincode),
        officeName: (record.officename ?? '').trim(),
        officeType: record.officetype ?? null,
        deliveryStatus: record.deliverystatus ?? null,
        circleName: record.circlename ?? null,
        regionName: record.regionname ?? null,
        divisionName: record.divisionname ?? null,
        districtName: record.districtname ?? null,
        stateName: record.statename ?? null,
        talukName: record.taluk?.trim() || null,
      }))
      .filter((office) => office.officeName)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

export async function lookupPincode(pincode: string): Promise<PostalLookup> {
  const pin = pincode.trim()
  if (!isValidPincode(pin)) {
    return summarizePostalOffices(pin, [], 'none')
  }

  const local = await fromLocalDirectory(pin)
  if (local.length > 0) {
    return summarizePostalOffices(pin, local, 'local')
  }

  const fallback = await fromPostalPincodeApi(pin)
  if (fallback.length > 0) {
    void cacheOffices(fallback, 'api.postalpincode.in')
    return summarizePostalOffices(pin, fallback, 'fallback')
  }

  const dataGov = await fromDataGov(pin)
  if (dataGov.length > 0) {
    void cacheOffices(dataGov, 'data.gov.in')
    return summarizePostalOffices(pin, dataGov, 'fallback')
  }

  return summarizePostalOffices(pin, [], 'none')
}

export async function postalDirectoryCount(): Promise<number | null> {
  const supabase = createServiceClientOrNull()
  if (!supabase) return null
  const { count, error } = await supabase.from('postal_directory').select('id', { count: 'exact', head: true })
  if (error) return null
  return count ?? 0
}
