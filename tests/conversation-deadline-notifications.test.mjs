import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functionsSource = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const workerSource = fs.readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');

test('alertas de prazo são diários, no horário local e possuem três momentos', () => {
  assert.match(functionsSource, /export const notifyConversationDeadlines = onSchedule/);
  assert.match(functionsSource, /schedule: '0 9 \* \* \*'/);
  assert.match(functionsSource, /timeZone: 'America\/Sao_Paulo'/);
  assert.match(functionsSource, /'due_soon'/);
  assert.match(functionsSource, /'due_today'/);
  assert.match(functionsSource, /'overdue'/);
});

test('cada conversa e prazo possui comprovante contra notificações repetidas', () => {
  assert.match(functionsSource, /notificationReceipts\/\$\{receiptId\}/);
  assert.match(functionsSource, /if \(\(await transaction\.get\(receiptRef\)\)\.exists\) return false/);
  assert.match(functionsSource, /conversation\.participants\.flatMap/);
});

test('alertas abrem diretamente a conversa no navegador e no aplicativo', () => {
  assert.match(workerSource, /\['message', 'message_deadline'\]/);
  assert.match(appSource, /type === 'message' \|\| type === 'message_deadline'/);
  assert.match(appSource, /payload\.data\?\.type === 'message_deadline'/);
});
