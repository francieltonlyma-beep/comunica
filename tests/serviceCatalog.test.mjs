import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICE_CATALOG,
  addBusinessDays,
  getServiceCategory,
  mergeServiceCatalogSettings,
  sanitizeServiceCatalogSettings,
  serviceDueDate,
  serviceRequestStatus,
} from '../src/serviceCatalog.js';

test('catálogo oferece áreas operacionais distintas', () => {
  assert.ok(SERVICE_CATALOG.length >= 8);
  assert.equal(new Set(SERVICE_CATALOG.map(item => item.id)).size, SERVICE_CATALOG.length);
  assert.ok(SERVICE_CATALOG.every(item => item.label && item.description && item.slaDays > 0));
});

test('configuração por empresa preserva padrões e aplica limites seguros', () => {
  const settings = sanitizeServiceCatalogSettings({ items: [
    { id: 'technology', active: false, slaDays: 99, requiresApproval: true, defaultRecipientIds: ['u-1', 'u-1', 'u-2'], guides: [{ id: 'g-1', title: '  Redefinir senha  ', content: '  Use a recuperação de acesso.  ' }] },
    { id: 'unknown', active: true, slaDays: 1 },
  ] });
  const catalog = mergeServiceCatalogSettings(settings);
  const technology = catalog.find(item => item.id === 'technology');
  const people = catalog.find(item => item.id === 'people');
  assert.equal(catalog.length, SERVICE_CATALOG.length);
  assert.equal(technology.active, false);
  assert.equal(technology.slaDays, 30);
  assert.equal(technology.requiresApproval, true);
  assert.deepEqual(technology.defaultRecipientIds, ['u-1', 'u-2']);
  assert.deepEqual(technology.guides, [{ id: 'g-1', title: 'Redefinir senha', content: 'Use a recuperação de acesso.' }]);
  assert.equal(people.active, true);
  assert.equal(people.slaDays, getServiceCategory('people').slaDays);
});

test('prazo ignora sábado e domingo', () => {
  assert.equal(addBusinessDays('2026-10-16', 1), '2026-10-19');
  assert.equal(addBusinessDays('2026-10-16', 3), '2026-10-21');
});

test('prioridade urgente reduz o prazo sem ultrapassar um dia útil', () => {
  const category = getServiceCategory('purchases');
  assert.equal(serviceDueDate('2026-10-16', category, 'normal'), '2026-10-23');
  assert.equal(serviceDueDate('2026-10-16', category, 'urgent'), '2026-10-19');
});

test('status respeita conclusão, decisão, aprovação e atraso', () => {
  assert.equal(serviceRequestStatus({ completedAt: Date.now() }, '2026-10-17'), 'completed');
  assert.equal(serviceRequestStatus({ serviceDecision: 'rejected' }, '2026-10-17'), 'rejected');
  assert.equal(serviceRequestStatus({ serviceDecision: 'approved' }, '2026-10-17'), 'approved');
  assert.equal(serviceRequestStatus({ serviceDecision: 'approved', serviceStatus: 'in_progress', dueDate: '2026-10-20' }, '2026-10-17'), 'in_progress');
  assert.equal(serviceRequestStatus({ serviceStatus: 'in_progress', dueDate: '2026-10-20' }, '2026-10-17'), 'in_progress');
  assert.equal(serviceRequestStatus({ serviceStatus: 'waiting_requester', dueDate: '2026-10-20' }, '2026-10-17'), 'waiting_requester');
  assert.equal(serviceRequestStatus({ serviceRequiresApproval: true }, '2026-10-17'), 'approval');
  assert.equal(serviceRequestStatus({ dueDate: '2026-10-16' }, '2026-10-17'), 'overdue');
  assert.equal(serviceRequestStatus({ serviceStatus: 'waiting_requester', dueDate: '2026-10-16' }, '2026-10-17'), 'overdue');
  assert.equal(serviceRequestStatus({ dueDate: '2026-10-20' }, '2026-10-17'), 'open');
});
