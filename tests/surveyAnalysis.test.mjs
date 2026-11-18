import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeSurvey, surveyScoreTone, filterSurveyDetails } from '../src/surveyAnalysis.js';

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

test('filters score bands at the same decimal precision shown in the report', () => {
  const topics = [null, 3.49, 3.495, 3.83, 3.995, 4.25].map((average, id) => ({ id, average, questions: [{ options: [] }] }));
  assert.equal(surveyScoreTone(null), null);
  for (const [tone, ids] of [['low', [1]], ['mid', [2, 3]], ['high', [4, 5]]]) {
    assert.deepEqual(filterSurveyDetails(topics, { kind: 'score', band: { tone } }).map(topic => topic.id), ids);
  }
});

test('rating filters hide unrelated answers and questions without matching votes', () => {
  const options = [0, 2, 0, 0, 8].map(count => ({ count }));
  const topics = [{ id: 'team', questions: [
    { id: 'scale', type: 'scale', responses: 10, options },
    { id: 'no-match', type: 'scale', options: [{ count: 0 }, { count: 0 }, { count: 10 }] },
    { id: 'choice', type: 'single', options },
  ] }];
  const [team] = filterSurveyDetails(topics, { kind: 'rating', band: { indexes: [0, 1] } });
  assert.equal(team.questions.length, 1);
  assert.equal(team.questions[0].responses, 10);
  assert.deepEqual(team.questions[0].options, [{ count: 2, index: 1 }]);
  const [choice] = filterSurveyDetails(topics, { kind: 'option', topicId: 'team', questionId: 'choice', index: 4 });
  assert.deepEqual(choice.questions[0].options, [{ count: 8, index: 4 }]);
});
