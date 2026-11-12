const assert = require('node:assert/strict');
const { approvePurchaseQuoteGroup } = require('../lib/purchaseQuoteApproval');

function fixture(actorId) {
  const base = 'artifacts/comunica-salvador/public/data/companies/company-a';
  const records = [
    { quantity: 3, quotedPrice: 12.5, quoteTotal: 10, buyerId: 'buyer', requesterId: 'requester' },
    { quantity: 2, quotedPrice: 20, quoteTotal: 10, buyerId: 'buyer', requesterId: 'requester' },
  ].map((fields, index) => ({
    ref: { path: `${base}/purchaseRequests/item-${index}` },
    data: () => ({ ...fields, bundleId: 'bundle', quoteNumber: 'COT-20261112-BUNDLE',
      status: 'quotation', supplier: 'Fornecedor', expectedDate: '2026-11-20',
      approverId: actorId, updatedAt: 1, history: [] }),
  }));
  const values = new Map([
    [base, { codeBlocked: false }],
    [`${base}/users/${actorId}`, { name: 'Aprovador', isAdmin: false }],
    [`${base}/settings/integra-access`, { enabled: true }],
    [`${base}/settings/purchase-approval`, { enabled: true, threshold: 70,
      lowerApproverId: 'manager', upperApproverId: 'director', preventSelfApproval: true }],
  ]);
  const ref = path => ({ path, collection(name) { return { doc(id) { return ref(`${path}/${name}/${id}`); },
    where() { return { query: true }; } }; } });
  const updates = [];
  const database = {
    doc: ref,
    runTransaction: async callback => callback({
      get: async target => target.query ? { empty: false, size: records.length, docs: records }
        : { exists: values.has(target.path), data: () => values.get(target.path) },
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
  console.log('PASS: aprovação conjunta usa o total recalculado no servidor');
})().catch(error => { console.error(error); process.exitCode = 1; });
