import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORM_TUTORIALS } from '../src/tutorialContent.js';

test('tutorials cover every recently added business module', () => {
  assert.deepEqual(Object.keys(PLATFORM_TUTORIALS).sort(), ['careers', 'dashboard', 'documents', 'platform', 'polls', 'services']);
  Object.values(PLATFORM_TUTORIALS).forEach(tutorial => {
    assert.ok(tutorial.title);
    assert.ok(tutorial.summary);
    assert.ok(tutorial.audience);
    assert.ok(tutorial.steps.length >= 5);
    assert.ok(tutorial === PLATFORM_TUTORIALS.platform || tutorial.tips.length >= 3);
    tutorial.steps.forEach(step => {
      assert.ok(step.title);
      assert.ok(step.description);
    });
  });
});

test('guided onboarding covers inbox, permissions, audit and visible tools', () => {
  const onboarding = JSON.stringify(PLATFORM_TUTORIALS.platform).toLowerCase();
  for (const term of ['caixa de entrada', 'permissões', 'auditoria', 'documentos', 'serviços', 'banco de talentos']) assert.match(onboarding, new RegExp(term));
  assert.ok(PLATFORM_TUTORIALS.platform.steps.every(step => step.target));
});

test('career tutorial explains candidate files, human review and retention', () => {
  const text = JSON.stringify(PLATFORM_TUTORIALS.careers).toLowerCase();
  ['pdf', 'word', 'humana', '90 dias', 'prorrogar'].forEach(term => assert.match(text, new RegExp(term)));
});


test('service tour presents the complete new service and activity workspace', () => {
  const serviceTour = PLATFORM_TUTORIALS.services;
  const text = JSON.stringify(serviceTour).toLowerCase();
  for (const term of ['solicitações', 'atividades sincronizadas', 'modelos', 'lista', 'kanban', 'calendário', 'recorrência', 'checklist', 'conversa original']) {
    assert.match(text, new RegExp(term));
  }
  assert.ok(serviceTour.steps.some(step => step.workspace === 'requests'));
  assert.ok(serviceTour.steps.some(step => step.workspace === 'activities'));
  for (const view of ['list', 'kanban', 'calendar']) assert.ok(serviceTour.steps.some(step => step.activityView === view));
});
