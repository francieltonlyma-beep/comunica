import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functionsSource = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const workerSource = fs.readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');

test('activity changes notify new assignees and relevant status updates', () => {
  assert.match(functionsSource, /export const notifyMessageActivityChange = onDocumentUpdated/);
  assert.match(functionsSource, /Nova atividade atribuída a você/);
  assert.match(functionsSource, /Atividade concluída/);
  assert.match(functionsSource, /Prazo da atividade atualizado/);
  assert.match(functionsSource, /Novo comentário na atividade/);
  assert.match(functionsSource, /Novo anexo na atividade/);
});

test('scheduled deadline scan includes message activities without duplicating delivery', () => {
  assert.match(functionsSource, /where\('activity\.dueDate', 'in'/);
  assert.match(functionsSource, /activity-deadline-\$\{activity\.messageId\}/);
  assert.match(functionsSource, /type: 'activity_deadline'/);
  assert.match(functionsSource, /notificationReceipts\/\$\{receiptId\}/);
  assert.match(functionsSource, /collection\('activities'\)\.where\('dueDate', 'in'/);
});

test('standalone and recurring activities are generated and notified by the server', () => {
  assert.match(functionsSource, /export const notifyStandaloneActivityCreated = onDocumentCreated/);
  assert.match(functionsSource, /export const notifyStandaloneActivityChange = onDocumentUpdated/);
  assert.match(functionsSource, /nextRecurringActivityDate/);
  assert.match(functionsSource, /recurringActivityPayload/);
  assert.match(functionsSource, /recurring-\$\{activityId\}-\$\{nextDueDate\}/);
  assert.match(workerSource, /comunica-open-activity/);
  assert.match(appSource, /activityCompany/);
});

test('activity notifications open the exact source message', () => {
  for (const type of ['activity_assignment', 'activity_update', 'activity_deadline']) {
    assert.match(workerSource, new RegExp(type));
    assert.match(appSource, new RegExp(type));
  }
  assert.match(workerSource, /messageId/);
  assert.match(appSource, /setActivityMessageTargetId\(messageId \|\| ''\)/);
});
