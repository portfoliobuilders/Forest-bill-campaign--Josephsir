import assert from 'node:assert/strict'

import { demoCampaign, demoClauses } from '../src/lib/demo-data'
import {
  composeEmail,
  formatCompleteEmailCopy,
  androidSendIntent,
  formatUnsentEml,
  gmailComposeUrl,
  liveMailTargets,
  mailtoUrl,
  resolveMailTargets,
  uniqueEmails,
} from '../src/lib/compose'
import { normalizeIndianPhone } from '../src/lib/phone'

const details = {
  fullName: 'Test Citizen',
  phone: normalizeIndianPhone('+919876543210') ?? '+919876543210',
  addressLine: 'Test House, Test Road',
  panchayat: 'Test Panchayat',
  district: 'Idukki',
  pincode: '685000',
  email: 'test@example.com',
}

const full = composeEmail({
  campaign: { ...demoCampaign, concern_selection_mode: 'multiple' },
  clauses: demoClauses,
  details,
  lang: 'ml',
})

assert.equal(full.subject, 'No_to_Kerala_Forest(Amendment)_Bill_2024')
assert.match(full.body, /^Sir,\n\n/)
assert.match(full.body, /വിഷയങ്ങൾ:/)
for (let i = 1; i <= 12; i += 1) {
  assert.match(full.body, new RegExp(`^${i}\\. `, 'm'))
}
assert.match(full.body, /പേര്: Test Citizen/)
assert.match(full.body, /വിലാസം: Test House, Test Road/)
assert.match(full.body, /പഞ്ചായത്ത് \/ മുനിസിപ്പാലിറ്റി: Test Panchayat/)
assert.match(full.body, /ജില്ല: Idukki/)
assert.match(full.body, /പിൻകോഡ്: 685000/)
assert.match(full.body, /ഫോൺ: \+919876543210/)
assert.match(full.body, /ഇമെയിൽ: test@example.com/)
assert.doesNotMatch(full.body, /13\. /)

const selected = composeEmail({
  campaign: { ...demoCampaign, concern_selection_mode: 'multiple' },
  clauses: demoClauses.filter((clause) => clause.sort_order <= 2),
  details: { ...details, customText: 'എന്റെ സ്വന്തം അനുഭവം' },
  lang: 'ml',
})
assert.match(selected.body, /^1\. /m)
assert.match(selected.body, /^2\. /m)
assert.doesNotMatch(selected.body, /^3\. /m)
assert.match(selected.body, /എന്റെ സ്വന്തം അനുഭവം/)

const single = composeEmail({
  campaign: { ...demoCampaign, concern_selection_mode: 'single' },
  clauses: [demoClauses[2]],
  details: {
    ...details,
    extraConcerns: ['My property has been excluded incorrectly...'],
  },
  lang: 'en',
})
assert.match(single.body, /Selected Concern:/)
assert.match(single.body, /Additional Concern:/)
assert.match(single.body, /My property has been excluded incorrectly/)
assert.ok(single.body.includes(demoClauses[2].title_en))
assert.ok(!single.body.includes(demoClauses[0].title_en))
assert.doesNotMatch(single.body, /^2\. /m)

const targets = liveMailTargets(demoCampaign)
assert.deepEqual(targets.to, ['esz-mef@nic.in', 'prlsecy.forest@kerala.gov.in'])
assert.deepEqual(targets.cc, ['emailkifa@gmail.com'])
assert.deepEqual(uniqueEmails([...targets.to, ...targets.cc]), [
  'esz-mef@nic.in',
  'prlsecy.forest@kerala.gov.in',
  'emailkifa@gmail.com',
])

const dry = resolveMailTargets({
  campaign: demoCampaign,
  mode: 'demo',
  testerEmail: details.email,
})
assert.deepEqual(dry.to, ['test@example.com'])
assert.deepEqual(dry.cc, [])
assert.equal(dry.dryRun, true)
assert.deepEqual(dry.liveTo, targets.to)
assert.deepEqual(dry.liveCc, targets.cc)

const live = resolveMailTargets({
  campaign: demoCampaign,
  mode: 'live',
  testerEmail: details.email,
})
assert.deepEqual(live.to, ['esz-mef@nic.in', 'prlsecy.forest@kerala.gov.in'])
assert.deepEqual(live.cc, ['emailkifa@gmail.com'])
assert.equal(live.dryRun, false)
assert.doesNotMatch(live.to.join(','), /test@example\.com/)

const gmail = gmailComposeUrl({
  to: targets.to,
  cc: targets.cc,
  subject: full.subject,
  body: selected.body,
})
const mail = mailtoUrl({
  to: targets.to,
  cc: targets.cc,
  subject: full.subject,
  body: selected.body,
})

assert.match(gmail, /to=esz-mef%40nic\.in%2Cprlsecy\.forest%40kerala\.gov\.in/)
assert.match(gmail, /cc=emailkifa%40gmail\.com/)
assert.match(gmail, /su=No_to_Kerala_Forest\(Amendment\)_Bill_2024/)
assert.match(gmail, /su=No_to_Kerala_Forest/)
assert.doesNotMatch(gmail, /su=No to/)
assert.doesNotMatch(gmail, /editor@malayali\.com/)
assert.doesNotMatch(gmail, /undefined/)
assert.match(mail, /mailto:esz-mef%40nic\.in%2Cprlsecy\.forest%40kerala\.gov\.in/)
assert.doesNotMatch(mail, /editor@malayali\.com/)

const copied = formatCompleteEmailCopy({
  to: targets.to,
  cc: targets.cc,
  subject: full.subject,
  body: full.body,
})
assert.match(copied, /To:\nesz-mef@nic\.in\nprlsecy\.forest@kerala\.gov\.in/)
assert.match(copied, /CC:\nemailkifa@gmail\.com/)
assert.ok(copied.includes(`Subject: ${full.subject}`))

const eml = formatUnsentEml({
  to: targets.to,
  cc: targets.cc,
  subject: full.subject,
  body: full.body,
})
assert.match(eml, /^X-Unsent: 1\r\n/)
assert.match(eml, /To: esz-mef@nic\.in, prlsecy\.forest@kerala\.gov\.in/)
assert.match(eml, /Cc: emailkifa@gmail\.com/)
assert.match(eml, new RegExp(`Subject: ${full.subject.replace(/[()]/g, '\\$&')}`))
assert.ok(eml.includes(full.body.replace(/\n/g, '\r\n')))
for (let i = 1; i <= 12; i += 1) {
  assert.match(eml, new RegExp(`^${i}\\. `, 'm'))
}

const intent = androidSendIntent(
  { to: targets.to, cc: targets.cc, subject: full.subject, body: full.body },
  { gmailOnly: true, fallbackUrl: 'https://mail.google.com/mail/?view=cm&fs=1' },
)
assert.match(intent, /^intent:\/\/send\/#Intent;/)
assert.match(intent, /package=com\.google\.android\.gm/)
assert.ok(intent.includes(encodeURIComponent(full.body)))
assert.ok(intent.includes(encodeURIComponent(full.subject)))
assert.doesNotMatch(intent, /undefined/)

const headersOnly = gmailComposeUrl(
  { to: targets.to, cc: targets.cc, subject: full.subject, body: full.body },
  { includeBody: false },
)
assert.doesNotMatch(headersOnly, /[?&]body=/)

console.log('compose checks passed')
console.log(`full body chars: ${full.charCount}`)
console.log(`gmail selected url length: ${gmail.length}`)
console.log(`mailto selected url length: ${mail.length}`)
console.log(`unsent eml chars: ${eml.length}`)
console.log(`android intent chars: ${intent.length}`)
