import assert from 'node:assert/strict';
import { expectedApprover, purchaseQuoteNumber, purchaseQuoteTotal, purchaseTransitionPatch } from '../src/purchaseFlow.js';

const items = [
  { quantity: 3, quotedPrice: 12.5 },
  { quantity: 2, quotedPrice: 20 },
  { quantity: 4, quotedPrice: 0 },
];
const total = purchaseQuoteTotal(items);
assert.equal(total, 77.5);
assert.equal(purchaseQuoteNumber(Date.UTC(2026, 10, 12, 12), 'abcd1234more'), 'COT-20261112-ABCD1234');
const policy = { enabled: true, threshold: 70, lowerApproverId: 'manager', upperApproverId: 'director' };
assert.equal(expectedApprover(policy, total, 'admin'), 'director');

const now = Date.now();
const record = {
  item: 'Caixas', specification: 'Papelão', quantity: 2, unit: 'un', department: 'Loja', destination: 'Estoque',
  neededBy: '2026-11-20', reason: 'Reposição', status: 'requested', buyerId: 'buyer', approverId: 'director',
  requesterId: 'requester', requesterName: 'Solicitante', updatedAt: now, history: [],
};
const draft = { ...record, supplier: 'Fornecedor', quotedPrice: 20, quoteTotal: total, expectedDate: '2026-11-19' };
const patch = purchaseTransitionPatch(record, 'quotation', draft, { id: 'buyer', name: 'Comprador' }, now + 1);
assert.equal(patch.status, 'quotation');
assert.equal(patch.quoteTotal, total);
assert.equal(patch.quotedPrice, 20);
console.log('PASS: cotação numerada e alçada calculada pelo total dos itens');
