import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const storageRules = fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const functionsSource = fs.readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');

test('activity details expose comments, files and history for both activity sources', () => {
  assert.match(app, /Comentários \(\$\{activity\.comments\.length\}\)/);
  assert.match(app, /Anexos \(\$\{activity\.attachments\.length\}\)/);
  assert.match(app, /Histórico \(\$\{activity\.history\.length\}\)/);
  assert.match(app, /handleAddActivityComment/);
  assert.match(app, /handleActivityAttachmentUpload/);
  assert.match(app, /Abrir mensagem original/);
});

test('standalone activity attachments are bound to an existing tenant activity', () => {
  assert.match(storageRules, /function activityPath\(companyId, activityId\)/);
  assert.match(storageRules, /firestore\.exists\(activityPath\(companyId, activityId\)\)/);
  assert.match(storageRules, /get\('activityId', ''\)\.matches\('\(activity\|recurring\)-\.\+'\)/);
  assert.match(app, /\{ activityId: row\.id \}/);
});

test('a recurring occurrence starts with clean collaboration data and its own history', () => {
  assert.match(functionsSource, /comments: \[\], attachments: \[\]/);
  assert.match(functionsSource, /Próxima ocorrência criada automaticamente/);
});

test('deleting a standalone activity also removes its stored attachments', () => {
  assert.match(functionsSource, /export const cleanupDeletedActivityFiles = onDocumentDeleted/);
  assert.match(functionsSource, /filePath\.includes\('\/attachments\/'\)/);
});
