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
  assert.match(functionsSource, /where\('activity\.dueDate', '>'/);
  assert.match(functionsSource, /activity-deadline-\$\{activity\.messageId\}/);
  assert.match(functionsSource, /type: 'activity_deadline'/);
  assert.match(functionsSource, /notificationReceipts\/\$\{receiptId\}/);
  assert.match(functionsSource, /collection\('activities'\)\.where\('dueDate', '>'/);
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

test('silenced conversations do not emit message or activity alerts for that user', () => {
  assert.match(functionsSource, /const notifiedParticipants = participants\.filter\(\(id\) => !mutedBy\.includes\(id\)\)/);
  assert.match(functionsSource, /recipientIds = recipientIds\.filter\(\(id\) => !mutedBy\.includes\(id\)\)/);
});

test('atividade aberta avisa a equipe e atividade atribuída avisa os responsáveis', async () => {
  const { isNewActivityRecipient } = await import('../functions/src/notificationPreferences.mjs');
  assert.equal(isNewActivityRecipient({ createdBy: 'author', assigneeIds: [] }, 'peer'), true);
  assert.equal(isNewActivityRecipient({ createdBy: 'author', assigneeIds: [] }, 'author'), false);
  assert.equal(isNewActivityRecipient({ createdBy: 'author', assigneeIds: ['owner'] }, 'peer'), false);
  assert.equal(isNewActivityRecipient({ createdBy: 'author', assigneeIds: ['owner'] }, 'owner'), true);
});

test('solicitação avisa os participantes, respeita o silenciamento e não repete o aviso em respostas', async () => {
  const { isServiceRequestRecipient, notificationTab } = await import('../functions/src/notificationPreferences.mjs');
  const message = { id: 'msg-1', threadId: 'thread-1', serviceRequest: true, senderId: 'requester', participants: ['requester', 'assignee', 'muted'], mutedBy: ['muted'] };
  assert.equal(notificationTab('service_request', message.threadId), 'services');
  assert.equal(isServiceRequestRecipient(message, 'assignee'), true);
  for (const uid of ['requester', 'muted', 'other']) assert.equal(isServiceRequestRecipient(message, uid), false);
  assert.equal(isServiceRequestRecipient({ ...message, id: 'msg-2' }, 'assignee'), false);
});

test('o editor libera o autor, o responsável, o administrador e o colaborador que aceitou', async () => {
  const { canEditServiceActivity } = await import('../src/serviceActivityAccess.js');
  const activity = { createdBy: 'author', assigneeIds: ['assignee'], collaborators: { accepted: { status: 'accepted' }, invited: { status: 'invited' } } };
  for (const id of ['author', 'assignee', 'accepted']) assert.equal(canEditServiceActivity({ id }, activity, null, true), true);
  for (const id of ['member', 'invited']) assert.equal(canEditServiceActivity({ id }, activity, null, true), false);
  assert.equal(canEditServiceActivity({ id: 'admin', isAdmin: true }, activity, null, true), true);
  assert.equal(canEditServiceActivity({ id: 'author' }, activity, null, false), false);
  assert.equal(canEditServiceActivity({ id: 'member' }, activity, { senderId: 'member' }, true), false);
});
