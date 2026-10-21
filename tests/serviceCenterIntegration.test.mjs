import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const rulesSource = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const functionsSource = await readFile(new URL('../functions/src/index.ts', import.meta.url), 'utf8');

test('central de serviços faz parte da navegação e das permissões', () => {
  assert.match(appSource, /id: 'services', label: 'Central de serviços'/);
  assert.match(appSource, /activeTab === 'services'/);
  assert.match(appSource, /Solicitações e aprovações/);
});

test('solicitações usam chamados sequenciais e a conversa existente', () => {
  assert.match(appSource, /httpsCallable\(functionsClient, 'createConversation'\)/);
  assert.match(appSource, /serviceRequest: true/);
  assert.match(appSource, /ticketNumber: null/);
});

test('aprovação atualiza somente metadados autorizados da conversa', () => {
  ['serviceDecision', 'serviceDecisionBy', 'serviceDecisionAt', 'serviceStatus', 'serviceAssigneeId', 'serviceAssigneeName', 'serviceStartedAt', 'serviceWaitingSince'].forEach(field => {
    assert.match(rulesSource, new RegExp(`'${field}'`));
  });
  assert.match(appSource, /handleServiceDecision/);
});

test('fila operacional permite atribuição, etapas e indicadores gerenciais', () => {
  assert.match(appSource, /handleServiceAssignment/);
  assert.match(appSource, /handleServiceStage/);
  assert.match(appSource, /SLA cumprido/);
  assert.match(appSource, /Satisfação média/);
  assert.match(appSource, /Aguardar solicitante/);
});

test('administrador personaliza catálogo, SLA, aprovação e responsáveis por empresa', () => {
  assert.match(appSource, /Configurar catálogo/);
  assert.match(appSource, /service-catalog/);
  assert.match(appSource, /defaultRecipientIds/);
  assert.match(appSource, /handleSaveServiceSettings/);
  assert.match(functionsSource, /Este serviço está indisponível no catálogo da empresa/);
});

test('base de orientações ajuda antes da abertura e pode ser mantida pelo administrador', () => {
  assert.match(appSource, /Base de orientações/);
  assert.match(appSource, /Talvez você resolva sem abrir um chamado/);
  assert.match(appSource, /addServiceGuide/);
  assert.match(appSource, /Ainda preciso de ajuda/);
});

test('função valida categoria, prioridade e etapa inicial', () => {
  assert.match(functionsSource, /allowedServiceCategories/);
  assert.match(functionsSource, /allowedServicePriorities/);
  assert.match(functionsSource, /serviceRequiresApproval === true \? 'approval' : 'open'/);
});
