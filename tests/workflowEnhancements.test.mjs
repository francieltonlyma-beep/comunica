import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const careers = fs.readFileSync(new URL('../src/Careers.jsx', import.meta.url), 'utf8');
const careerFunctions = fs.readFileSync(new URL('../functions/src/careers.ts', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('inbox exposes reply, reactions, saved messages and activity checklist', () => {
  for (const feature of ['replyTo', 'likedBy', 'savedBy', 'highlightedBy', 'activity', 'checklist']) assert.match(app, new RegExp(feature));
  for (const field of ['likedBy', 'savedBy', 'highlightedBy', 'activity']) assert.match(rules, new RegExp(`'${field}'`));
});

test('conversation activities are synchronized with the service center', () => {
  for (const feature of ['serviceWorkspace', 'serviceActivityRows', 'filteredServiceActivities', 'serviceActivityMetrics', 'openActivityConversation']) assert.match(app, new RegExp(feature));
  assert.match(app, /Sincronizada com a Central de Serviços/);
  assert.match(app, /Atividades das conversas/);
  assert.match(app, /data-message-id=\{msg\.id\}/);
  assert.doesNotMatch(app, /collection\(['"]activities['"]\)/);
});

test('public careers always derives talent pool opportunities from company roles', () => {
  assert.match(careers, /talentPoolRoles/);
  assert.match(careers, /talent-pool--/);
  assert.match(careers, /Futuras oportunidades/);
  assert.match(careers, /scrollIntoView/);
  assert.match(careerFunctions, /collection\('roles'\)/);
  assert.match(careerFunctions, /source: 'talent_pool'/);
});

test('recruiting separates permanent talent pool profiles from open vacancies', () => {
  assert.match(app, /careerSourceFilter/);
  assert.match(app, /Banco de Talentos · Futuras oportunidades/);
  assert.match(app, /Currículos por cargo/);
});

test('service flow separates configured SLA from assignee promise and progress', () => {
  for (const field of ['serviceSlaDays', 'servicePromisedDate', 'serviceProgress', 'serviceProgressNote']) assert.match(app, new RegExp(field));
  assert.match(app, /Responsável padrão definido pelo administrador/);
  assert.match(app, /Buscar por nome, cargo ou setor/);
});
