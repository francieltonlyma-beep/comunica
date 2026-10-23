import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const careers = fs.readFileSync(new URL('../src/Careers.jsx', import.meta.url), 'utf8');
const careerFunctions = fs.readFileSync(new URL('../functions/src/careers.ts', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const publishWorkflow = fs.readFileSync(new URL('../.github/workflows/firebase-hosting-merge.yml', import.meta.url), 'utf8');

test('inbox exposes reply, reactions, saved messages and activity checklist', () => {
  for (const feature of ['replyTo', 'likedBy', 'savedBy', 'highlightedBy', 'activity', 'checklist']) assert.match(app, new RegExp(feature));
  for (const field of ['likedBy', 'savedBy', 'highlightedBy', 'activity']) assert.match(rules, new RegExp(`'${field}'`));
});

test('conversation and standalone activities share the service center', () => {
  for (const feature of ['serviceWorkspace', 'serviceActivityRows', 'filteredServiceActivities', 'serviceActivityMetrics', 'serviceActivityPeriodFilter', 'openActivityConversation']) assert.match(app, new RegExp(feature));
  assert.match(app, /Sincronizada com a Central de Serviços/);
  assert.match(app, /Atividades e checklists/);
  assert.match(app, /Nova atividade ou checklist avulso/);
  assert.match(app, /standaloneActivities/);
  assert.match(app, /activityTemplates/);
  assert.match(app, /serviceActivityProductivity/);
  assert.match(app, /Hoje/);
  assert.match(app, /Próximas/);
  assert.match(app, /Vencidas/);
  assert.match(app, /data-message-id=\{msg\.id\}/);
  for (const permission of ['canManageActivities', 'canManageActivityTemplates', 'canViewActivityInsights']) assert.match(app, new RegExp(permission));
  assert.match(rules, /kind == 'activities'/);
  assert.match(rules, /kind == 'activityTemplates'/);
  assert.match(publishWorkflow, /--only firestore:rules/);
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

test('service center launches the versioned guided tour on first access', () => {
  assert.match(app, /comunica_services_tour_20261023_v1_/);
  assert.match(app, /activeTab !== 'services'/);
  assert.match(app, /setActiveTutorial\(current => current \|\| 'services'\)/);
  assert.match(app, /if \(step\.workspace\) setServiceWorkspace\(step\.workspace\)/);
  assert.match(app, /if \(step\.activityView\) changeServiceActivityView\(step\.activityView\)/);
  for (const target of ['activity-metrics', 'activity-list', 'activity-kanban', 'activity-calendar', 'activity-insights']) {
    assert.match(app, new RegExp(`data-tour=["']${target}["']`));
  }
});
