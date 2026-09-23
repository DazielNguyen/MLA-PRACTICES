import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question } from './domain.ts';
import { highlightStudyText } from './study-keywords.ts';

test('quick-study wording is preserved, including punctuation, numbers and source markup',()=>{
  const texts=[
    'Which option will MINIMIZE infrastructure startup times? Choose two.',
    'Use SageMaker managed warm pools, not Managed Spot Training.',
    'Latency must not exceed 50 ms; availability must be 99.9%.',
    '<script>alert("AWS")</script> `S3` & "IAM" remain plain source text.',
    'Không đổi dấu tiếng Việt — dữ liệu gốc. 😀',
    '',
  ];
  for(const text of texts) assert.equal(highlightStudyText(text).map(p=>p.text).join(''),text);
});

test('negation, optimization and quantities stand out as complete requirements',()=>{
  const parts=highlightStudyText('The solution must not exceed 50 ms. MINIMIZE infrastructure startup times. Choose two.');
  assert.ok(parts.some(p=>p.text==='must not'&&p.kind==='constraint'));
  assert.ok(parts.some(p=>p.text==='MINIMIZE infrastructure startup times'&&p.kind==='constraint'));
  assert.ok(parts.some(p=>p.text==='Choose two'&&p.kind==='constraint'));
  assert.ok(parts.some(p=>p.text==='50 ms'&&p.kind==='number'));
  assert.ok(highlightStudyText('99.9% accuracy').some(p=>p.text==='99.9%'&&p.kind==='number'));
});

test('specific feature names stay together and partial word matches are avoided',()=>{
  const parts=highlightStudyText('Use Amazon SageMaker managed warm pools or Managed Spot Training.');
  assert.ok(parts.some(p=>p.text==='Amazon SageMaker managed warm pools'&&p.kind==='term'));
  assert.ok(parts.some(p=>p.text==='Managed Spot Training'&&p.kind==='term'));
  assert.deepEqual(highlightStudyText('TranslateSomething S3Key IAMRole company information'),[{text:'TranslateSomething S3Key IAMRole company information'}]);
});

test('all bank questions and choices retain their exact text; all warm-pool options have neutral cues',()=>{
  const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
  for(const q of bank) for(const text of [q.text,...Object.values(q.choices)]) {
    assert.equal(highlightStudyText(text).map(p=>p.text).join(''),text,`Question ${q.id}`);
  }
  const warm=bank.find(q=>q.id===334)!;
  for(const text of Object.values(warm.choices)) assert.ok(highlightStudyText(text).some(p=>p.kind==='term'));
});
