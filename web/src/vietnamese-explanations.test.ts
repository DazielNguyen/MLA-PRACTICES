import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Question } from './domain.ts';
const bank: Question[] = JSON.parse(readFileSync(new URL('./data/questions.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(readFileSync(new URL('../scripts/translations/content-sha256.json', import.meta.url), 'utf8'));
function sorted(value: any): any {return Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;}
test('Vietnamese localization preserves all 594 stems, choices, grading keys, identities and reference links', () => {
  assert.equal(bank.length, 594);
  for (const q of bank) {
    const payload = Object.fromEntries(Object.entries(q).filter(([key]) => baseline.fields.includes(key)));
    assert.equal(createHash('sha256').update(JSON.stringify(sorted(payload))).digest('hex'), baseline.questions[q.id], `Question content changed: ${q.id}`);
  }
  assert.equal(bank.filter(q => q.status === 'review').length,32);
});
test('every concept, option explanation and note has a Vietnamese translation without English template leftovers', () => {
  let options = 0;
  for (const q of bank) {
    assert.equal(q.explanationLanguage,'vi');
    assert.deepEqual(Object.keys(q.analysis!.options),Object.keys(q.choices));
    options += Object.keys(q.analysis!.options).length;
    for (const text of [q.analysis!.keyConcept,...Object.values(q.analysis!.options),...q.notes]) {
      assert.match(text,/[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/iu, `Missing Vietnamese for ${q.id}`);
      assert.doesNotMatch(text,/This matches the requirement|This option does not address|Source selects|Original practice scenario/);
    }
    if (q.status === 'review') assert.match(q.explanation,/Đáp án chấm theo bộ đề \(cần xác minh\)/);
    assert.doesNotMatch(q.explanation,/không (?:tính|được chấm) điểm/i);
  }
  assert.equal(options, 2396);
});
