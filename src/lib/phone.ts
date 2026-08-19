/** Accept common Indian mobile formats and normalise to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1)
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`
  }

  return null
}
