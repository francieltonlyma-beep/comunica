import test from 'node:test';
import assert from 'node:assert/strict';
import {careerDateMs, careerFitScore, countCareerCandidates, groupCareerApplications, matchesCareerOpportunity} from '../src/careerTriage.js';

test('a real zero contributes to candidate fit and missing scores do not', () => {
  assert.deepEqual([0, '0', 57, '20.5', null, undefined, '', ' ', false, -1, 101, NaN].map(careerFitScore),
    [0, 0, 57, 20.5, null, null, null, null, null, null, null, null]);
});

test('every stage shown in the triage counters has the same applications in the board and list', () => {
  const applications = [
    {id: 'missing-stage'},
    {id: 'reviewing', status: 'reviewing'},
    {id: 'rejected', status: 'rejected'},
    {id: 'closed', status: 'closed'},
    {id: 'hired', status: 'hired'},
  ];
  const groups = groupCareerApplications(applications);
  assert.equal(Object.values(groups).flat().length, applications.length);
  assert.deepEqual(groups.received, [applications[0]]);
  applications.slice(1).forEach(application => assert.deepEqual(groups[application.status], [application]));
  assert.deepEqual(groups.interview, []);
});

test('the triage distinguishes a talent pool role from closed and archived vacancies', () => {
  const vacancyApplication = {vacancyId: 'vacancy-1'};
  const poolApplication = {vacancyId: 'pool-role', source: 'talent_pool'};
  const closed = {status: 'closed'};
  const archived = {status: 'archived'};
  assert.equal(matchesCareerOpportunity(vacancyApplication, closed, 'vacancy', 'all'), true);
  assert.equal(matchesCareerOpportunity(vacancyApplication, archived, 'all', 'all'), false);
  assert.equal(matchesCareerOpportunity(vacancyApplication, archived, 'vacancy', 'vacancy-1'), true);
  assert.equal(matchesCareerOpportunity(vacancyApplication, archived, 'vacancy', 'vacancy-2'), false);
  assert.equal(matchesCareerOpportunity(vacancyApplication, closed, 'talent_pool', 'all'), false);
  assert.equal(matchesCareerOpportunity(poolApplication, undefined, 'vacancy', 'all'), false);
  assert.equal(matchesCareerOpportunity(poolApplication, undefined, 'talent_pool', 'pool-role'), true);
});

test('people are counted once across applications and homonyms stay separate', () => {
  assert.equal(countCareerCandidates([
    {id: 'one', candidateUid: '1', name: 'Maria'},
    {id: 'two', candidateUid: '1', name: 'Maria'},
    {id: 'three', candidateUid: '2', name: 'Maria'},
    {id: 'four', email: ' Pessoa@example.com '},
    {id: 'five', email: 'pessoa@example.com'},
    {id: 'six'},
  ]), 4);
});

test('Firestore dates take precedence over numeric coercion', () => {
  assert.equal(careerDateMs({toMillis: () => 1700259000000, valueOf: () => '63835776800.0'}), 1700259000000);
  assert.equal(careerDateMs({seconds: 1700259001, nanoseconds: 345000000}), 1700259001345);
  assert.equal(careerDateMs(1700259000000), 1700259000000);
});
