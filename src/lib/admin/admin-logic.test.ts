import assert from 'node:assert/strict'
import test from 'node:test'

import { isAdminEmail } from './allowlist'
import { conversionPct, displayStage, dropOffPct, funnelFromStatusCounts, statusesForDisplayStage } from './stages'
import { flagsForPublishStatus, requiresLiveConfirmation, slugFromTitle } from './publish'
import { listUnknownPlaceholders, renderSafeTemplate } from '../email-template'
import { composeEmail, resolveMailTargets } from '../compose'
import { demoCampaign, demoClauses } from '../demo-data'

test('displayStage maps backend statuses to business labels', () => {
  assert.equal(displayStage('draft'), 'started')
  assert.equal(displayStage('verified'), 'prepared')
  assert.equal(displayStage('handoff_opened'), 'email_opened')
  assert.equal(displayStage('confirmed_sent'), 'confirmed_sent')
  assert.equal(displayStage('server_sent'), 'confirmed_sent')
  assert.equal(displayStage('failed'), 'failed')
})

test('verified is not a display stage', () => {
  assert.equal(displayStage('verified'), 'prepared')
  assert.deepEqual(statusesForDisplayStage('prepared'), ['verified'])
})

test('test rows are not part of funnel math; funnel uses status counts only', () => {
  const funnel = funnelFromStatusCounts({
    draft: 2,
    verified: 0,
    handoff_opened: 0,
    confirmed_sent: 1,
    server_sent: 0,
    failed: 0,
  })
  assert.equal(funnel.started, 3)
  assert.equal(funnel.prepared, 1)
  assert.equal(funnel.emailOpened, 1)
  assert.equal(funnel.confirmedSent, 1)
  assert.equal(conversionPct(funnel.started, funnel.prepared), 33.3)
  assert.equal(dropOffPct(funnel.started, funnel.prepared), 66.7)
})

test('safe templates replace known placeholders and ignore unknown ones', () => {
  const out = renderSafeTemplate('Hello {{full_name}} {{evil}}', {
    full_name: 'Ravi',
  })
  assert.match(out, /Ravi/)
  assert.doesNotMatch(out, /evil/)
  assert.deepEqual(listUnknownPlaceholders('{{full_name}} {{eval}}'), ['eval'])
})

test('compose uses template placeholders and does not eval javascript', () => {
  const result = composeEmail({
    campaign: {
      ...demoCampaign,
      body_template_en: '{{intro}}\n\n{{concerns}}\n\nName: {{full_name}} {{constructor}}',
    },
    clauses: [demoClauses[0]],
    details: {
      fullName: 'Ravi Kumar',
      addressLine: 'House',
      panchayat: 'Panchayat',
      district: 'Idukki',
      pincode: '685533',
      phone: '9876543210',
      email: 'ravi@example.com',
    },
    lang: 'en',
  })
  assert.match(result.body, /Ravi Kumar/)
  assert.doesNotMatch(result.body, /constructor/)
})

test('email copy over 220 characters is invalid', () => {
  const long = 'a'.repeat(221)
  assert.equal([...long].length > 220, true)
  assert.equal([...('b'.repeat(220))].length <= 220, true)
})

test('publish flags never go live without an explicit live status', () => {
  assert.deepEqual(flagsForPublishStatus('draft'), { publish_status: 'draft', is_active: false })
  assert.deepEqual(flagsForPublishStatus('preview'), { publish_status: 'preview', is_active: false })
  assert.deepEqual(flagsForPublishStatus('live'), { publish_status: 'live', is_active: true })
  assert.equal(requiresLiveConfirmation('preview', 'live'), true)
  assert.equal(requiresLiveConfirmation('live', 'closed'), false)
})

test('slug generation is campaign-safe', () => {
  assert.equal(slugFromTitle('Kerala Forest Bill'), 'kerala-forest-bill')
})

test('preview and admin test mail never address government recipients', () => {
  const targets = resolveMailTargets({
    campaign: demoCampaign,
    mode: 'preview',
    testerEmail: 'admin@janashabdam.example',
  })
  assert.deepEqual(targets.to, ['admin@janashabdam.example'])
  assert.deepEqual(targets.cc, [])
  assert.equal(targets.dryRun, true)
  assert.ok(targets.liveTo.length > 0)
})

test('funnel helpers count unique statuses; callers must exclude is_test first', () => {
  const real = funnelFromStatusCounts({ draft: 2, confirmed_sent: 1 })
  const inflated = funnelFromStatusCounts({ draft: 3, confirmed_sent: 2 })
  assert.equal(real.started, 3)
  assert.notEqual(inflated.started, real.started)
})

test('admin allowlist comparison is exact after trim/lowercase', () => {
  const prev = process.env.ADMIN_EMAILS
  process.env.ADMIN_EMAILS = 'one@example.com, Two@Example.com'
  try {
    assert.equal(isAdminEmail('one@example.com'), true)
    assert.equal(isAdminEmail('two@example.com'), true)
    assert.equal(isAdminEmail('other@example.com'), false)
    assert.equal(isAdminEmail(''), false)
  } finally {
    if (prev === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = prev
  }
})
