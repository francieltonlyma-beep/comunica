import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('central de gestão reúne prioridades e atalhos por perfil', () => {
  assert.match(appSource, /Central de Gestão/);
  assert.match(appSource, /dashboardAttentionItems/);
  assert.match(appSource, /dashboardQuickActions/);
  assert.match(appSource, /Ferramentas para o seu perfil/);
});

test('indicadores levam diretamente à área correspondente', () => {
  assert.match(appSource, /setDocumentReadingFilter\('Pendentes'\)/);
  assert.match(appSource, /setServiceStatusFilter\('overdue'\)/);
  assert.match(appSource, /setServiceAssigneeFilter\('unassigned'\)/);
  assert.match(appSource, /setPollViewFilter\('Ativas'\)/);
});

test('eventos do painel consideram somente datas futuras', () => {
  assert.match(appSource, /event\.date >= todayStr/);
  assert.match(appSource, /dashboardUpcomingEvents\.slice\(0, 3\)/);
});
