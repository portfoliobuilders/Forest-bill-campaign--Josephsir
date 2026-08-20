'use client'

import { useEffect, useRef, useState } from 'react'

import { IconMic, IconStop } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { t, type Lang } from '@/lib/i18n'
import { focusRing } from '@/lib/ui'

function SpeechCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function speechRecognitionSupported(): boolean {
  return Boolean(SpeechCtor())
}

export function VoiceInputButton({
  lang,
  fieldId,
  value,
  onChange,
  onStatus,
}: {
  lang: Lang
  fieldId: string
  value: string
  onChange: (next: string) => void
  onStatus?: (message: string) => void
}) {
  const [listening, setListening] = useState(false)
  const [overrideLang, setOverrideLang] = useState<Lang | null>(null)
  const recRef = useRef<SpeechRecognition | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const speechLang = overrideLang ?? lang
  const locale = speechLang === 'ml' ? 'ml-IN' : 'en-IN'

  useEffect(() => {
    return () => {
      recRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!listening) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        recRef.current?.stop()
        recRef.current = null
        setListening(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [listening])

  function stop() {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }

  function start() {
    const Ctor = SpeechCtor()
    if (!Ctor) {
      onStatus?.(t(lang, 'speechUnsupported'))
      return
    }
    try {
      const rec = new Ctor()
      rec.lang = locale
      rec.continuous = true
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onstart = () => {
        setListening(true)
        onStatus?.(t(lang, 'listening'))
      }
      rec.onresult = (event) => {
        const result = event.results[event.resultIndex]
        const spoken = result?.[0]?.transcript?.trim()
        if (!spoken) return
        const current = valueRef.current.trim()
        onChange(current ? `${current} ${spoken}` : spoken)
        onStatus?.(t(lang, 'speechRecognized'))
      }
      rec.onerror = (event) => {
        setListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onStatus?.(t(lang, 'speechPermissionDenied'))
          return
        }
        onStatus?.(t(lang, 'speechFailed'))
      }
      rec.onend = () => {
        setListening(false)
        recRef.current = null
      }
      recRef.current = rec
      rec.start()
    } catch {
      setListening(false)
      onStatus?.(t(lang, 'speechFailed'))
    }
  }

  if (!speechRecognitionSupported()) return null

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={cx(
          'inline-flex size-11 shrink-0 items-center justify-center rounded-[5px] border',
          listening ? 'border-accent bg-accent text-white' : 'border-rule bg-raised text-ink hover:bg-accent-tint',
          focusRing,
        )}
        aria-label={t(lang, 'typeUsingVoice')}
        aria-pressed={listening}
        aria-controls={fieldId}
        onClick={() => (listening ? stop() : start())}
      >
        {listening ? <IconStop className="size-5" /> : <IconMic className="size-5" />}
      </button>
      {listening ? (
        <span className="text-sm font-semibold text-accent" aria-hidden="true">
          {t(lang, 'listening')}
        </span>
      ) : (
        <button
          type="button"
          className={cx('text-xs font-semibold text-muted underline-offset-2 hover:underline', focusRing)}
          onClick={() => setOverrideLang(speechLang === 'ml' ? 'en' : 'ml')}
        >
          {speechLang === 'ml' ? t(lang, 'voiceLangEnglish') : t(lang, 'voiceLangMalayalam')}
        </button>
      )}
    </div>
  )
}
