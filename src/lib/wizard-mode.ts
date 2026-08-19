export type WizardMode = 'live' | 'preview' | 'demo'

export function isDryRun(mode: WizardMode): boolean {
  return mode !== 'live'
}
