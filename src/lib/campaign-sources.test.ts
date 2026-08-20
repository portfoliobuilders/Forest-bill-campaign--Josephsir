import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isAllowedSourceMime,
  isSourceImageMime,
  mimeFromFileName,
  parseOptionalHttpUrl,
  parsePublicationDate,
  publicationDateForDisplay,
  sanitizeSourceFileName,
} from './campaign-sources'

test('source uploads accept newspaper clipping types only', () => {
  assert.equal(isAllowedSourceMime('image/jpeg'), true)
  assert.equal(isAllowedSourceMime('application/pdf'), true)
  assert.equal(isAllowedSourceMime('image/svg+xml'), false)
  assert.equal(isSourceImageMime('image/png'), true)
  assert.equal(isSourceImageMime('application/pdf'), false)
  assert.equal(mimeFromFileName('clipping.PDF'), 'application/pdf')
  assert.equal(mimeFromFileName('notes.exe'), null)
})

test('source file names are sanitized', () => {
  assert.equal(sanitizeSourceFileName('../../Deepika 16 Aug.png'), 'Deepika-16-Aug.png')
})

test('optional source URLs must be http(s)', () => {
  assert.deepEqual(parseOptionalHttpUrl(''), { ok: true, url: null })
  assert.equal(parseOptionalHttpUrl('https://www.deepika.com/article').ok, true)
  assert.equal(parseOptionalHttpUrl('javascript:alert(1)').ok, false)
})

test('publication dates stay calendar-accurate', () => {
  assert.deepEqual(parsePublicationDate('2026-08-16'), { ok: true, date: '2026-08-16' })
  assert.equal(parsePublicationDate('2026-13-40').ok, false)
  assert.equal(publicationDateForDisplay('2026-08-12'), '2026-08-12T12:00:00+05:30')
})
