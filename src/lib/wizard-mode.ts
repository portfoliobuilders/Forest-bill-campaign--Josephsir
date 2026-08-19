export type WizardMode = 'live' | 'preview' | 'demo'

export function skipsVerification(mode: WizardMode): boolean {
  return mode === 'demo'
}

export function isDryRun(mode: WizardMode): boolean {
  return mode !== 'live'
}
