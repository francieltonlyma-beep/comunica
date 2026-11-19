import {DocumentReference, DocumentData, Firestore, Transaction} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {purchaseApprover, purchaseApprovalFields} from './purchaseRouting.mjs';

export async function resolvePurchaseApprover(transaction: Transaction, company: DocumentReference, policy: DocumentData, total: number, items: DocumentData[]) {
  const admins = policy.preventSelfApproval === true && policy.enabled !== true
    ? (await transaction.get(company.collection('users').where('isAdmin', '==', true))).docs.map(item => item.id)
    : [];
  return purchaseApprover(policy, total, items, admins);
}

export async function approvePurchaseQuoteGroup(database: Firestore, companyId: string, bundleId: string, actorId: string, requestId = '', expectedItems?: unknown): Promise<{approved: number; total: number}> {
  if (!/^[a-zA-Z0-9_-]+$/.test(companyId) || Boolean(bundleId) === Boolean(requestId) || !/^[a-zA-Z0-9_-]{1,128}$/.test(bundleId || requestId) || !actorId) {
    throw new HttpsError('invalid-argument', 'Cotação inválida.');
  }
  const base = database.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
  return database.runTransaction(async transaction => {
    const requests = base.collection('purchaseRequests');
    const [company, profile, access, policy] = await Promise.all([
      transaction.get(base),
      transaction.get(base.collection('users').doc(actorId)),
      transaction.get(base.collection('settings').doc('integra-access')),
      transaction.get(base.collection('settings').doc('purchase-approval')),
    ]);
    if (!company.exists || company.data()?.codeBlocked === true || !profile.exists || access.data()?.enabled !== true) {
      throw new HttpsError('permission-denied', 'Sem acesso à gestão de compras desta empresa.');
    }
    const docs = bundleId
      ? (await transaction.get(requests.where('bundleId', '==', bundleId))).docs
      : [await transaction.get(requests.doc(requestId))].filter(item => item.exists && !item.data()?.bundleId);
    if (!docs.length || docs.length > 10 || (bundleId && docs.some(item => item.data()?.bundleSize && item.data()?.bundleSize !== docs.length))) {
      throw new HttpsError('failed-precondition', 'Os itens da cotação não foram encontrados.');
    }
    if (new Set(docs.map(item => item.data()!.requesterId)).size !== 1 ||
        new Set(docs.map(item => String(item.data()!.quoteNumber || '')).filter(Boolean)).size > 1) {
      throw new HttpsError('failed-precondition', 'Os itens não pertencem à mesma cotação numerada.');
    }
    const quoted = docs.filter(item => Number(item.data()!.quotedPrice) > 0);
    if (!quoted.length || quoted.some(item => {
      const record = item.data()!;
      return record.status !== 'quotation' || record.approvedAt || !record.buyerId || !record.supplier ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(record.expectedDate || '')) ||
        !Number.isFinite(Number(record.quantity)) || !(Number(record.quantity) > 0) ||
        !Number.isFinite(Number(record.quotedPrice));
    })) throw new HttpsError('failed-precondition', 'Confira itens, preços e aprovador da cotação.');
    if (requestId || expectedItems !== undefined) {
      if (!Array.isArray(expectedItems) || expectedItems.length !== quoted.length ||
          quoted.some(item => !expectedItems.some(expected => expected?.id === item.id && expected.updatedAt === item.data()!.updatedAt))) {
        throw new HttpsError('failed-precondition', 'A cotação mudou. Confira os valores atuais antes de aprovar.');
      }
    }
    const total = Math.round(quoted.reduce((sum, item) => sum + Number(item.data()!.quantity) * Number(item.data()!.quotedPrice), 0) * 100) / 100;
    if (!Number.isFinite(total) || total <= 0) throw new HttpsError('failed-precondition', 'O total da cotação é inválido.');
    const config = policy.data() || {};
    const requiredApprover = await resolvePurchaseApprover(transaction, base, config, total, quoted.map(item => item.data()!));
    if (requiredApprover !== actorId) {
      throw new HttpsError('permission-denied', 'O aprovador não corresponde à alçada ou à separação de funções.');
    }
    const now = Date.now();
    for (const item of quoted) {
      const current = item.data()!;
      const updatedAt = Math.max(now, Number(current.updatedAt || 0) + 1);
      transaction.update(item.ref, {
        ...purchaseApprovalFields(current, actorId),
        quoteTotal: total, status: 'approved', approvedBy: actorId, approvedAt: updatedAt,
        updatedAt, updatedBy: actorId,
        history: [...(Array.isArray(current.history) ? current.history : []), {
          stage: 'approved', by: actorId, byName: String(profile.data()?.name || 'Aprovador').slice(0, 120), at: updatedAt,
          detail: `Cotação aprovada. Total: R$ ${total.toFixed(2)}`,
        }].slice(-50),
      });
    }
    return {approved: quoted.length, total};
  });
}
