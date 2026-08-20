export const adminFocus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700'

export const adminInput =
  `mt-1 w-full min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 ${adminFocus}`

export const adminLabel = 'block text-sm font-medium text-stone-700'

export const adminBtnPrimary = `inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 ${adminFocus}`

export const adminBtnSecondary = `inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 ${adminFocus}`

export const adminBtnDanger = `inline-flex min-h-11 items-center justify-center rounded-md border border-red-700 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-50 ${adminFocus}`

export const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/public-data', label: 'Public Data' },
  { href: '/admin/requests', label: 'Data Requests' },
  { href: '/admin/settings', label: 'Settings' },
] as const
