export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export const btnPrimary = [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-accent bg-accent px-5 py-2.5 text-center text-base font-semibold leading-snug text-white',
  'hover:border-accent-hover hover:bg-accent-hover',
  'disabled:cursor-not-allowed disabled:border-rule disabled:bg-rule disabled:text-muted',
  focusRing,
].join(' ')

export const btnSecondary = [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-accent bg-transparent px-5 py-2.5 text-center text-base font-semibold leading-snug text-accent',
  'hover:bg-accent-tint',
  'disabled:cursor-not-allowed disabled:border-rule disabled:text-muted',
  focusRing,
].join(' ')

export const btnGhost = [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[5px] border border-rule bg-transparent px-4 py-2.5 text-center text-base font-semibold leading-snug text-ink',
  'hover:bg-accent-tint',
  'disabled:cursor-not-allowed disabled:text-muted',
  focusRing,
].join(' ')

export const inputClass = [
  'mt-1 min-h-11 w-full rounded-[4px] border border-input-border bg-raised px-3 text-base text-ink',
  'disabled:bg-surface disabled:text-muted',
  focusRing,
].join(' ')

export const labelClass = 'block text-sm font-semibold text-ink'
