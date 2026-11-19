import test from 'node:test';
import assert from 'node:assert/strict';
import {careerDateInBrazil, isCareerDeadlineAvailable, isCareerVacancyOpen} from '../functions/src/careerVacancyAvailability.mjs';

test('careers use São Paulo time for the deadline and include the entire closing day', () => {
  assert.equal(careerDateInBrazil(new Date('2026-11-20T02:59:59Z')), '2026-11-19');
  assert.equal(careerDateInBrazil(new Date('2026-11-20T03:00:00Z')), '2026-11-20');
  assert.equal(isCareerVacancyOpen({status:'published', closesAt:'2026-11-19'}, '2026-11-19'), true);
  assert.equal(isCareerVacancyOpen({status:'published', closesAt:'2026-11-19'}, '2026-11-20'), false);
});

test('open vacancies, wrong dates and closed vacancies are distinguished', () => {
  const today = '2026-11-19';
  assert.equal(isCareerVacancyOpen({status:'published'}, today), true);
  assert.equal(isCareerVacancyOpen({status:'published', closesAt:''}, today), true);
  assert.equal(isCareerVacancyOpen({status:'closed', closesAt:'2026-12-01'}, today), false);
  assert.equal(isCareerDeadlineAvailable('2026-11-31', today), false);
  assert.equal(isCareerDeadlineAvailable('20/11/2026', today), false);
});
