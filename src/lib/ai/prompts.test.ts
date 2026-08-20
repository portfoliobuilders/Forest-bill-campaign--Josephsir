import assert from 'node:assert/strict'
import test from 'node:test'

import { aiSystemPrompt, aiUserPrompt } from './prompts'

test('AI prompt forbids invented facts and personal data', () => {
  const system = aiSystemPrompt()
  assert.match(system, /Use only the facts supplied/)
  assert.match(system, /Do not add new legal or factual claims/)
  assert.match(system, /Do not change the citizen's requested action/)
  assert.match(system, /Do not exaggerate/)
  assert.match(system, /PIN codes/)
})

test('user prompt contains only campaign and concern text, never identity', () => {
  const prompt = aiUserPrompt({
    language: 'ml',
    campaignTitle: 'ESA Draft Notification',
    concernTitle: 'Buffer zone',
    concernBody: 'The draft should not harm farms.',
  })
  assert.match(prompt, /Language: Malayalam/)
  assert.match(prompt, /ESA Draft Notification/)
  assert.match(prompt, /The draft should not harm farms/)
  assert.doesNotMatch(prompt, /Joseph/)
  assert.doesNotMatch(prompt, /685531/)
  assert.doesNotMatch(prompt, /phone/i)
  assert.doesNotMatch(prompt, /address/i)
})
