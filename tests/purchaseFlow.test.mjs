import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseFields, purchaseTransition, validatePurchase } from '../src/purchaseFlow.js';

const actor = { id: 'gestor-1', name: 'Gestora' };
const request = purchaseFields({
  item: 'Luvas', specification: 'Nitrílica M', quantity: 10, unit: 'caixa',
  department: 'Enfermagem', destination: 'Sala 1', neededBy: '2026-11-20',
  reason: 'Reposição',
});

test('compra passa pelas etapas até o destino somente com comprovação exigida', () => {
  let current = { ...request, status: 'requested', history: [] };
  for (const stage of ['approved', 'quotation']) current = purchaseTransition(current, stage, current, actor);
  assert.match(validatePurchase(current, 'ordered'), /fornecedor/);
  current = purchaseTransition(current, 'ordered', { ...current, supplier: 'Fornecedor A', quotedPrice: 35, orderNumber: 'OC-1', expectedDate: '2026-11-18' }, actor);
  assert.match(validatePurchase(current, 'received'), /NF/);
  current = purchaseTransition(current, 'received', { ...current, invoiceNumber: 'NF-1', receivedQuantity: 10, condition: 'ok' }, actor);
  assert.match(validatePurchase(current, 'stored'), /endereço/);
  current = purchaseTransition(current, 'stored', { ...current, storageAddress: 'Almoxarifado A-2' }, actor);
  assert.match(validatePurchase(current, 'delivered'), /quem recebeu/);
  current = purchaseTransition(current, 'delivered', { ...current, destinationRecipient: 'Maria' }, actor);
  current = purchaseTransition(current, 'closed', current, actor);
  assert.equal(current.status, 'closed');
  assert.equal(current.history.at(-1).stage, 'closed');
});

test('entrega parcial gera divergência e impede armazenagem antes da conferência completa', () => {
  const current = { ...request, status: 'ordered', history: [], supplier: 'Fornecedor A', quotedPrice: 35, orderNumber: 'OC-1', expectedDate: '2026-11-18' };
  const partial = { ...current, invoiceNumber: 'NF-1', receivedQuantity: 8, condition: 'ok' };
  assert.throws(() => purchaseTransition(current, 'received', partial, actor), /divergência/);
  const exception = purchaseTransition(current, 'exception', partial, actor);
  assert.equal(exception.status, 'exception');
  assert.throws(() => purchaseTransition(exception, 'stored', exception, actor), /etapa/);
  const resolved = purchaseTransition(exception, 'received', { ...partial, receivedQuantity: 10 }, actor);
  assert.equal(resolved.status, 'received');
});
