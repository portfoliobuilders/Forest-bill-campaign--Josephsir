import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Constituency, ConstituencyCandidate, ConstituencyConfidence, Representative } from '@/types/database'

type LocalityRow = {
  pincode: string | null
  panchayat_name: string | null
  district: string
  constituency_id: string
  confidence: string
}

const CONFIDENCE_RANK: Record<ConstituencyConfidence, number> = {
  exact: 0,
  probable: 1,
  district: 2,
}

function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function normalizePlaceName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function asConfidence(value: string | null | undefined): ConstituencyConfidence {
  if (value === 'exact' || value === 'probable' || value === 'district') return value
  return 'probable'
}

function sortCandidates(candidates: ConstituencyCandidate[]): ConstituencyCandidate[] {
  return [...candidates].sort((a, b) => {
    const rank = CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    if (rank !== 0) return rank
    return a.constituency.name_en.localeCompare(b.constituency.name_en)
  })
}

function dedupeCandidates(candidates: ConstituencyCandidate[]): ConstituencyCandidate[] {
  const best = new Map<string, ConstituencyCandidate>()
  for (const candidate of candidates) {
    const prev = best.get(candidate.constituency.id)
    if (!prev || CONFIDENCE_RANK[candidate.confidence] < CONFIDENCE_RANK[prev.confidence]) {
      best.set(candidate.constituency.id, candidate)
    }
  }
  return sortCandidates([...best.values()])
}

async function loadConstituencies(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, Constituency>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data, error } = await supabase.from('constituencies').select('*').in('id', unique).eq('is_active', true)
  if (error || !data) return new Map()
  return new Map((data as Constituency[]).map((row) => [row.id, row]))
}

async function candidatesFromLocality(
  supabase: SupabaseClient,
  rows: LocalityRow[],
): Promise<ConstituencyCandidate[]> {
  const constituencies = await loadConstituencies(
    supabase,
    rows.map((row) => row.constituency_id),
  )
  const matches: ConstituencyCandidate[] = []
  for (const row of rows) {
    const constituency = constituencies.get(row.constituency_id)
    if (!constituency) continue
    matches.push({ constituency, confidence: asConfidence(row.confidence) })
  }
  return dedupeCandidates(matches)
}

async function byPincode(
  supabase: SupabaseClient,
  pincode: string,
  district: string,
): Promise<ConstituencyCandidate[]> {
  let query = supabase.from('locality_constituency').select('*').eq('pincode', pincode)
  if (district) {
    query = query.eq('district', district)
  }
  const { data, error } = await query
  if (error || !data || data.length === 0) return []
  return candidatesFromLocality(supabase, data as LocalityRow[])
}

async function byPanchayat(
  supabase: SupabaseClient,
  panchayat: string,
  district: string,
): Promise<ConstituencyCandidate[]> {
  const needle = normalizePlaceName(panchayat)
  if (!needle || !district) return []
  const { data, error } = await supabase.from('locality_constituency').select('*').eq('district', district)
  if (error || !data || data.length === 0) return []
  const rows = (data as LocalityRow[]).filter((row) => {
    if (!row.panchayat_name) return false
    return normalizePlaceName(row.panchayat_name) === needle
  })
  if (rows.length === 0) return []
  return candidatesFromLocality(supabase, rows)
}

async function byDistrict(supabase: SupabaseClient, district: string): Promise<ConstituencyCandidate[]> {
  if (!district) return []
  const { data, error } = await supabase
    .from('constituencies')
    .select('*')
    .eq('district', district)
    .eq('is_active', true)
    .order('name_en', { ascending: true })
  if (error || !data) return []
  return (data as Constituency[]).map((constituency) => ({
    constituency,
    confidence: 'district' as const,
  }))
}

export async function resolveConstituencies({
  pincode,
  panchayat,
  district,
}: {
  pincode: string
  panchayat: string
  district: string
}): Promise<ConstituencyCandidate[]> {
  try {
    const supabase = publicClient()
    if (!supabase) return []

    const pin = pincode.trim()
    const place = panchayat.trim()
    const dist = district.trim()

    const pinMatches = pin ? await byPincode(supabase, pin, dist) : []
    if (pinMatches.length > 0) return pinMatches

    const panchayatMatches = await byPanchayat(supabase, place, dist)
    if (panchayatMatches.length > 0) return panchayatMatches

    return byDistrict(supabase, dist)
  } catch {
    return []
  }
}

export async function getCurrentRepresentative(constituencyId: string): Promise<Representative | null> {
  try {
    if (!constituencyId) return null
    const supabase = publicClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from('representatives')
      .select('*')
      .eq('constituency_id', constituencyId)
      .eq('is_current', true)
      .eq('level', 'mla')
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return data as Representative
  } catch {
    return null
  }
}
