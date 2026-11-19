const assert = require('node:assert/strict');
const { approvePurchaseQuoteGroup } = require('../lib/purchaseQuoteApproval');

function fixture(actorId, { policy, single = false } = {}) {
  const base = 'artifacts/comunica-salvador/public/data/companies/company-a';
  const records = [
    { quantity: 3, quotedPrice: 12.5, quoteTotal: 10, buyerId: 'buyer', requesterId: 'requester' },
    { quantity: 2, quotedPrice: 20, quoteTotal: 10, buyerId: 'buyer', requesterId: 'requester' },
  ].map((fields, index) => ({
    id: `item-${index}`,
    exists: true,
    ref: { path: `${base}/purchaseRequests/item-${index}` },
    data: () => ({ ...fields, bundleId: single ? '' : 'bundle', quoteNumber: 'COT-20261112-BUNDLE',
      status: 'quotation', supplier: 'Fornecedor', expectedDate: '2026-11-20',
      approverId: actorId, updatedAt: 1, history: [] }),
  }));
  const values = new Map([
    [base, { codeBlocked: false }],
    [`${base}/users/${actorId}`, { name: 'Aprovador', isAdmin: false }],
    [`${base}/settings/integra-access`, { enabled: true }],
    [`${base}/settings/purchase-approval`, { enabled: true, threshold: 70,
      lowerApproverId: 'manager', upperApproverId: 'director', preventSelfApproval: true, ...policy }],
  ]);
  const ref = path => ({ path, collection(name) { return { doc(id) { return ref(`${path}/${name}/${id}`); },
    where() { return { query: true }; } }; } });
  const updates = [];
  const database = {
    doc: ref,
    runTransaction: async callback => callback({
      get: async target => target.query ? { empty: false, size: records.length, docs: records }
        : (records.find(record => record.ref.path === target.path) || { exists: values.has(target.path), data: () => values.get(target.path) }),
      update: (target, data) => updates.push({ target, data }),
    }),
  };
  return { database, updates };
}

(async () => {
  const { database, updates } = fixture('director');
  const result = await approvePurchaseQuoteGroup(database, 'company-a', 'bundle', 'director');
  assert.deepEqual(result, { approved: 2, total: 77.5 });
  assert.equal(updates.length, 2);
  assert.ok(updates.every(({ data }) => data.quoteTotal === 77.5 && data.status === 'approved'));

  const denied = fixture('manager');
  await assert.rejects(approvePurchaseQuoteGroup(denied.database, 'company-a', 'bundle', 'manager'),
    error => error.code === 'permission-denied');
  assert.equal(denied.updates.length, 0);
  const single = fixture('requester', { single: true, policy: { enabled: false, preventSelfApproval: false } });
  await assert.rejects(approvePurchaseQuoteGroup(single.database, 'company-a', '', 'requester', 'item-0', [{ id:'item-0', updatedAt:0 }]),
    error => error.code === 'failed-precondition');
  assert.equal(single.updates.length, 0);
  await approvePurchaseQuoteGroup(single.database, 'company-a', '', 'requester', 'item-0', [{ id:'item-0', updatedAt:1 }]);
  assert.equal(single.updates[0].data.approvedBy, 'requester');

  const buyerPolicy = {enabled:false, preventSelfApproval:false, requireRequesterReview:false};
  const buyer = fixture('buyer', { policy:buyerPolicy });
  await approvePurchaseQuoteGroup(buyer.database, 'company-a', 'bundle', 'buyer');
  assert.ok(buyer.updates.every(({data}) => data.approvedBy === 'buyer'));
  const requester = fixture('requester', { policy:buyerPolicy });
  await assert.rejects(approvePurchaseQuoteGroup(requester.database, 'company-a', 'bundle', 'requester'),
    error => error.code === 'permission-denied');
  assert.equal(requester.updates.length, 0);

  console.log('PASS: aprovação conjunta usa o total recalculado no servidor');
})().catch(error => { console.error(error); process.exitCode = 1; });
