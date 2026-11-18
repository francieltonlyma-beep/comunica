import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeSurvey } from '../src/surveyAnalysis.js';

test('weights each scale answer equally and excludes multiple choice answers', () => {
  const summary = summarizeSurvey({
    respondents: 5,
    completed: 4,
    topics: [
      { title: 'Liderança', average: 5, questions: [
        { type: 'scale', responses: 4, options: [0, 0, 0, 0, 4].map(count => ({ count })) },
      ] },
      { title: 'Comunicação', average: 1, questions: [
        { type: 'scale', responses: 1, options: [1, 0, 0, 0, 0].map(count => ({ count })) },
      ] },
      { title: 'Preferências', average: null, questions: [
        { type: 'single', responses: 5, options: [{ count: 5 }] },
      ] },
    ],
  });
  assert.deepEqual(summary.distribution, [1, 0, 0, 0, 4]);
  assert.equal(summary.average, 4.2);
  assert.equal(summary.favorable, 0.8);
  assert.equal(summary.completion, 0.8);
  assert.equal(summary.strengths[0].title, 'Liderança');
  assert.equal(summary.attention[0].title, 'Comunicação');
});

test('leaves indicators unavailable when their denominator is zero', () => {
  const { average, favorable, completion } = summarizeSurvey({ respondents: 0, completed: 0, topics: [] });
  assert.deepEqual([average, favorable, completion], [null, null, null]);
});

test('identifies a multiple-choice tie and split ratings even when the average is 3', () => {
  const summary = summarizeSurvey({ respondents: 8, completed: 8, topics: [
    { title: 'Equipe', average: 3, questions: [
      { type: 'scale', responses: 8, options: [3, 0, 2, 0, 3].map(count => ({ count })) },
      { type: 'single', responses: 8, options: [{ label: 'A', count: 4 }, { label: 'B', count: 4 }] },
    ] },
  ] });
  assert.deepEqual(summary.bands, [3, 2, 3]);
  assert.deepEqual(summary.choices[0].leaders.map(option => option.label), ['A', 'B']);
  assert.equal(summary.dividedQuestions[0].low, 3 / 8);
  assert.equal(summary.dividedQuestions[0].high, 3 / 8);
});
