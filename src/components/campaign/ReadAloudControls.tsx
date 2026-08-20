'use client'

import { useEffect, useRef, useState } from 'react'

import { IconPause, IconPlay, IconSpeaker, IconStop } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { t, type Lang } from '@/lib/i18n'
import { btnGhost, btnSecondary } from '@/lib/ui'

type PlayState = 'idle' | 'playing' | 'paused' | 'unsupported'

function pickVoice(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const locale = lang === 'ml' ? 'ml-IN' : 'en-IN'
  const prefix = lang === 'ml' ? 'ml' : 'en'
  const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
  if (exact) return exact
  const language = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix))
  if (language) return language
  if (lang === 'en') {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? null
  }
  return null
}

export function ReadAloudControls({
  lang,
  text,
  onStatus,
}: {
  lang: Lang
  text: string
  onStatus?: (message: string) => void
}) {
  const [state, setState] = useState<PlayState>('idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setState('idle')
  }, [lang, text])

  const voice = pickVoice(lang, voices)
  const malayalamMissing = lang === 'ml' && voices.length > 0 && !voice

  function stop() {
    window.speechSynthesis?.cancel()
    utteranceRef.current = null
    setState('idle')
    onStatus?.(t(lang, 'playbackStopped'))
  }

  function play() {
    if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) return
    if (lang === 'ml' && !voice) {
      onStatus?.(t(lang, 'malayalamVoiceUnavailable'))
      setState('unsupported')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'ml' ? 'ml-IN' : 'en-IN'
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      setState('idle')
      onStatus?.(t(lang, 'playbackStopped'))
    }
    utterance.onerror = () => {
      setState('idle')
      onStatus?.(t(lang, lang === 'ml' ? 'malayalamVoiceUnavailable' : 'errorGeneric'))
    }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setState('playing')
    onStatus?.(t(lang, 'playbackStarted'))
  }

  function pause() {
    window.speechSynthesis?.pause()
    setState('paused')
  }

  function resume() {
    window.speechSynthesis?.resume()
    setState('playing')
  }

  if (typeof window !== 'undefined' && !window.speechSynthesis) return null

  return (
    <div className="flex flex-col gap-2">
      {state === 'idle' || state === 'unsupported' ? (
        <button type="button" className={cx(btnSecondary, 'w-full sm:w-auto')} onClick={play} disabled={!text.trim()}>
          <IconSpeaker className="size-5 shrink-0" />
          {t(lang, 'listenToEmail')}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {state === 'playing' ? (
            <button type="button" className={cx(btnGhost, 'min-w-11')} onClick={pause}>
              <IconPause className="size-5" />
              {t(lang, 'pauseReadAloud')}
            </button>
          ) : (
            <button type="button" className={cx(btnGhost, 'min-w-11')} onClick={resume}>
              <IconPlay className="size-5" />
              {t(lang, 'resumeReadAloud')}
            </button>
          )}
          <button type="button" className={cx(btnGhost, 'min-w-11')} onClick={stop}>
            <IconStop className="size-5" />
            {t(lang, 'stopReadAloud')}
          </button>
        </div>
      )}
      {malayalamMissing ? (
        <p className="text-sm text-muted">{t(lang, 'malayalamVoiceUnavailable')}</p>
      ) : null}
    </div>
  )
}
