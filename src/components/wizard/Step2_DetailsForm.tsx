'use client'

import { useEffect, useRef, useState } from 'react'

import { useLang } from '@/components/LanguageProvider'
import { cx } from '@/lib/cx'
import type { DistrictOption } from '@/lib/demo-data'
import { MAX_CUSTOM_CHARS, type DetailsFields, type FieldErrors } from '@/lib/details-schema'
import { t } from '@/lib/i18n'
import type { ConstituencyMatch, WizardRouting } from '@/types/database'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800'

const fieldClass = cx(
  'mt-1 min-h-[44px] w-full rounded-md border border-stone-400 bg-white px-3 text-base text-stone-900',
  'transition-colors duration-150',
  focusRing,
)

const PINCODE_RE = /^[1-9][0-9]{5}$/

export const emptyRouting: WizardRouting = {
  constituencyId: null,
  ccMla: false,
  ccRepresentativeIds: [],
  constituency: null,
  representative: null,
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  )
}

function hasOfficialEmail(match: ConstituencyMatch | undefined): boolean {
  return Boolean(match?.representative?.official_email?.trim())
}

function routingFromMatch(match: ConstituencyMatch, ccMla: boolean): WizardRouting {
  const representative = match.representative
  const optedIn = ccMla && Boolean(representative?.official_email?.trim())
  return {
    constituencyId: match.constituency.id,
    ccMla: optedIn,
    ccRepresentativeIds: optedIn && representative ? [representative.id] : [],
    constituency: match.constituency,
    representative,
  }
}

export function Step2_DetailsForm({
  details,
  districts,
  errors,
  routing,
  onChange,
  onRoutingChange,
}: {
  details: DetailsFields
  districts: DistrictOption[]
  errors: FieldErrors
  routing: WizardRouting
  onChange: (patch: Partial<DetailsFields>) => void
  onRoutingChange: (routing: WizardRouting) => void
}) {
  const { lang } = useLang()
  const [candidates, setCandidates] = useState<ConstituencyMatch[]>([])
  const onRoutingChangeRef = useRef(onRoutingChange)
  onRoutingChangeRef.current = onRoutingChange
  const routingRef = useRef(routing)
  routingRef.current = routing

  useEffect(() => {
    const district = details.district.trim()
    const pincode = details.pincode.trim()
    const panchayat = details.panchayat.trim()

    if (!district || !PINCODE_RE.test(pincode)) {
      setCandidates([])
      if (routingRef.current.constituencyId || routingRef.current.ccMla) {
        onRoutingChangeRef.current(emptyRouting)
      }
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ pincode, district, panchayat })
      void fetch(`/api/constituency?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            setCandidates([])
            onRoutingChangeRef.current(emptyRouting)
            return
          }
          const body = (await response.json()) as { candidates?: ConstituencyMatch[] }
          const next = body.candidates ?? []
          setCandidates(next)

          const current = routingRef.current
          const stillPresent = next.find((row) => row.constituency.id === current.constituencyId)
          if (stillPresent) {
            onRoutingChangeRef.current(routingFromMatch(stillPresent, current.ccMla))
            return
          }

          const exactSingle = next.length === 1 && next[0].confidence === 'exact' ? next[0] : null
          if (exactSingle) {
            onRoutingChangeRef.current(routingFromMatch(exactSingle, false))
            return
          }

          onRoutingChangeRef.current(emptyRouting)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setCandidates([])
          onRoutingChangeRef.current(emptyRouting)
        })
    }, 300)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [details.district, details.pincode, details.panchayat])

  const selected = candidates.find((row) => row.constituency.id === routing.constituencyId)
  const showMlaOptIn = hasOfficialEmail(selected)

  function selectConstituency(constituencyId: string) {
    const match = candidates.find((row) => row.constituency.id === constituencyId)
    if (!match) {
      onRoutingChange(emptyRouting)
      return
    }
    onRoutingChange(routingFromMatch(match, false))
  }

  function setCcMla(checked: boolean) {
    if (!selected || !hasOfficialEmail(selected)) {
      onRoutingChange({ ...routing, ccMla: false, ccRepresentativeIds: [] })
      return
    }
    onRoutingChange(routingFromMatch(selected, checked))
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">{t(lang, 'yourDetails')}</h2>
      <p className="mt-2 text-sm text-stone-600">{t(lang, 'consentNotice')}</p>

      <div className="mt-5 rounded-md border-2 border-emerald-800 bg-emerald-50 p-4">
        <label htmlFor="customText" className="block text-lg font-bold text-emerald-950">
          {t('ml', 'customTextInvite')}
        </label>
        {lang === 'en' ? (
          <p className="mt-1 text-sm text-emerald-900">{t('en', 'customTextInvite')}</p>
        ) : null}
        <textarea
          id="customText"
          name="customText"
          value={details.customText}
          maxLength={MAX_CUSTOM_CHARS}
          rows={5}
          onChange={(event) => onChange({ customText: event.target.value })}
          className={cx(fieldClass, 'min-h-[140px] resize-y py-2')}
          aria-describedby="customText-count customText-error"
        />
        <p id="customText-count" className="mt-1 text-sm text-emerald-900">
          {details.customText.length}/{MAX_CUSTOM_CHARS} {t(lang, 'charsUsed')}
        </p>
        <FieldError id="customText-error" message={errors.customText} />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="fullName" className="block font-medium">
            {t(lang, 'fullName')}
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={details.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>

        <div>
          <label htmlFor="addressLine" className="block font-medium">
            {t(lang, 'address')}
          </label>
          <input
            id="addressLine"
            name="addressLine"
            autoComplete="street-address"
            value={details.addressLine}
            onChange={(event) => onChange({ addressLine: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.addressLine)}
            aria-describedby={errors.addressLine ? 'addressLine-error' : undefined}
          />
          <FieldError id="addressLine-error" message={errors.addressLine} />
        </div>

        <div>
          <label htmlFor="panchayat" className="block font-medium">
            {t(lang, 'panchayat')}
          </label>
          <input
            id="panchayat"
            name="panchayat"
            autoComplete="address-level2"
            value={details.panchayat}
            onChange={(event) => onChange({ panchayat: event.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="district" className="block font-medium">
            {t(lang, 'district')}
          </label>
          <select
            id="district"
            name="district"
            autoComplete="address-level1"
            value={details.district}
            onChange={(event) => onChange({ district: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.district)}
            aria-describedby={errors.district ? 'district-error' : undefined}
          >
            <option value="">{t(lang, 'selectDistrict')}</option>
            {districts.map((district) => (
              <option key={district.value} value={district.value}>
                {lang === 'en' ? district.labelEn : district.labelMl}
              </option>
            ))}
          </select>
          <FieldError id="district-error" message={errors.district} />
        </div>

        <div>
          <label htmlFor="pincode" className="block font-medium">
            {t(lang, 'pincode')}
          </label>
          <input
            id="pincode"
            name="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            value={details.pincode}
            onChange={(event) => onChange({ pincode: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.pincode)}
            aria-describedby={errors.pincode ? 'pincode-error' : undefined}
          />
          <FieldError id="pincode-error" message={errors.pincode} />
        </div>

        {candidates.length > 0 ? (
          <div>
            <label htmlFor="constituency" className="block font-medium">
              {t(lang, 'constituencyConfirm')}
            </label>
            <select
              id="constituency"
              name="constituency"
              value={routing.constituencyId ?? ''}
              onChange={(event) => selectConstituency(event.target.value)}
              className={fieldClass}
            >
              <option value="">{t(lang, 'constituencyConfirm')}</option>
              {candidates.map((candidate) => (
                <option key={candidate.constituency.id} value={candidate.constituency.id}>
                  {lang === 'en' ? candidate.constituency.name_en : candidate.constituency.name_ml}
                </option>
              ))}
            </select>

            {showMlaOptIn && selected?.representative ? (
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border border-stone-300 bg-white p-3">
                <input
                  type="checkbox"
                  name="ccMla"
                  checked={routing.ccMla}
                  onChange={(event) => setCcMla(event.target.checked)}
                  className={cx('mt-1 size-6 shrink-0 accent-emerald-800', focusRing)}
                />
                <span className="text-base leading-relaxed text-stone-900">
                  {t(lang, 'ccMlaNamed')
                    .replace('{name}', selected.representative.name_ml)
                    .replace('{constituency}', selected.constituency.name_ml)}
                </span>
              </label>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor="phone" className="block font-medium">
            {t(lang, 'phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={details.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
          />
          <p id="phone-hint" className="mt-1 text-sm text-stone-600">
            {t(lang, 'phoneHint')}
          </p>
          <FieldError id="phone-error" message={errors.phone} />
        </div>

        <div>
          <label htmlFor="email" className="block font-medium">
            {t(lang, 'email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={details.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className={fieldClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
      </div>
    </div>
  )
}
