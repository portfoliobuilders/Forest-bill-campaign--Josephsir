/**
 * Import India Post / data.gov.in pincode records into public.postal_directory.
 *
 * Preferred source: Government of India “All India Pincode Directory” CSV
 * (data.gov.in resource 6176ee09-3d56-4a3b-8115-21841576b2f6), then upsert into
 * Supabase. The public campaign looks up this table first; an external API is
 * only a fallback when a PIN is missing.
 *
 * Expected CSV headers (case-insensitive):
 *   officename, pincode, officetype, deliverystatus,
 *   divisionname, regionname, circlename, taluk, districtname, statename
 *
 * taluk_name is stored only when the source supplies a non-empty taluk value.
 * This script never derives taluk from district, region, or nearby offices.
 *
 * Usage:
 *   npx tsx scripts/import-postal-directory.ts --file scripts/data/postal-directory.sample.csv
 *   npx tsx scripts/import-postal-directory.ts --file india-pincode.csv --state Kerala
 *   npx tsx scripts/import-postal-directory.ts --data-gov --limit 200
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Optional: DATA_GOV_API_KEY, DATA_GOV_PINCODE_RESOURCE
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

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
  source: string
  source_updated_at: string
  updated_at: string
}

const PIN_RE = /^[1-9][0-9]{5}$/
const DEFAULT_RESOURCE = '6176ee09-3d56-4a3b-8115-21841576b2f6'

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

function blank(value: string | undefined | null): string | null {
  const text = (value ?? '').trim()
  return text ? text : null
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      quoted = true
      continue
    }
    if (ch === ',') {
      current.push(field)
      field = ''
      continue
    }
    if (ch === '\n') {
      current.push(field.replace(/\r$/, ''))
      rows.push(current)
      current = []
      field = ''
      continue
    }
    field += ch
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field.replace(/\r$/, ''))
    rows.push(current)
  }
  if (rows.length === 0) return []
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[\s_]+/g, ''))
  return rows.slice(1).map((values) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record
  })
}

function pick(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value?.trim()) return value.trim()
  }
  return ''
}

function rowFromRecord(record: Record<string, string>, source: string, now: string): DirectoryRow | null {
  const pincode = pick(record, ['pincode', 'pin', 'pincodecode']).replace(/\D/g, '')
  const officeName = pick(record, ['officename', 'office', 'officenameenglish', 'name'])
  if (!PIN_RE.test(pincode) || !officeName) return null
  return {
    pincode,
    office_name: officeName,
    office_type: blank(pick(record, ['officetype', 'office_type', 'branchtype'])),
    delivery_status: blank(pick(record, ['deliverystatus', 'delivery'])),
    circle_name: blank(pick(record, ['circlename', 'circle'])),
    region_name: blank(pick(record, ['regionname', 'region'])),
    division_name: blank(pick(record, ['divisionname', 'division'])),
    district_name: blank(pick(record, ['districtname', 'district'])),
    state_name: blank(pick(record, ['statename', 'state'])),
    taluk_name: blank(pick(record, ['taluk', 'talukname', 'taluka'])),
    source,
    source_updated_at: now,
    updated_at: now,
  }
}

async function upsert(rows: DirectoryRow[]): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  let written = 0
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400)
    const { error } = await supabase.from('postal_directory').upsert(chunk, { onConflict: 'pincode,office_name' })
    if (error) throw new Error(error.message)
    written += chunk.length
    process.stdout.write(`Upserted ${written} / ${rows.length}\n`)
  }
  return written
}

async function fromFile(path: string, stateFilter?: string): Promise<DirectoryRow[]> {
  const now = new Date().toISOString()
  const records = parseCsv(readFileSync(path, 'utf8'))
  const rows = records
    .map((record) => rowFromRecord(record, `csv:${path}`, now))
    .filter((row): row is DirectoryRow => Boolean(row))
  if (!stateFilter) return rows
  const needle = stateFilter.toLowerCase()
  return rows.filter((row) => (row.state_name ?? '').toLowerCase() === needle)
}

async function fromDataGov(limit: number): Promise<DirectoryRow[]> {
  const key = process.env.DATA_GOV_API_KEY?.trim()
  if (!key) throw new Error('DATA_GOV_API_KEY is required for --data-gov')
  const resource = process.env.DATA_GOV_PINCODE_RESOURCE?.trim() || DEFAULT_RESOURCE
  const now = new Date().toISOString()
  const rows: DirectoryRow[] = []
  let offset = 0
  while (rows.length < limit) {
    const page = Math.min(1000, limit - rows.length)
    const url = `https://api.data.gov.in/resource/${resource}?api-key=${encodeURIComponent(key)}&format=json&offset=${offset}&limit=${page}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`data.gov.in returned ${response.status}`)
    const payload = (await response.json()) as { records?: Array<Record<string, string>> }
    const records = payload.records ?? []
    if (records.length === 0) break
    for (const record of records) {
      const row = rowFromRecord(record, 'data.gov.in', now)
      if (row) rows.push(row)
    }
    offset += records.length
    if (records.length < page) break
  }
  return rows
}

async function main() {
  const file = argValue('--file')
  const state = argValue('--state')
  const limit = Number(argValue('--limit') ?? '5000')
  let rows: DirectoryRow[] = []
  if (file) rows = await fromFile(file, state)
  else if (hasFlag('--data-gov')) rows = await fromDataGov(Number.isFinite(limit) ? limit : 5000)
  else {
    process.stderr.write('Pass --file path.csv or --data-gov\n')
    process.exit(1)
  }
  const unique = new Map<string, DirectoryRow>()
  for (const row of rows) unique.set(`${row.pincode}|${row.office_name.toLowerCase()}`, row)
  const list = [...unique.values()]
  process.stdout.write(`Prepared ${list.length} unique offices.\n`)
  if (hasFlag('--dry-run')) return
  const written = await upsert(list)
  process.stdout.write(`Done. Upserted ${written} rows into postal_directory.\n`)
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Import failed'}\n`)
  process.exit(1)
})
