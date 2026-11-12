import {Firestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

export async function approvePurchaseQuoteGroup(database: Firestore, companyId: string, bundleId: string, actorId: string): Promise<{approved: number; total: number}> {
  if (!/^[a-zA-Z0-9_-]+$/.test(companyId) || !/^[a-zA-Z0-9_-]+$/.test(bundleId) || !actorId) {
    throw new HttpsError('invalid-argument', 'Cotação inválida.');
  }
  const base = database.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
  return database.runTransaction(async transaction => {
    const [company, profile, access, policy, items] = await Promise.all([
      transaction.get(base),
      transaction.get(base.collection('users').doc(actorId)),
      transaction.get(base.collection('settings').doc('integra-access')),
      transaction.get(base.collection('settings').doc('purchase-approval')),
      transaction.get(base.collection('purchaseRequests').where('bundleId', '==', bundleId)),
    ]);
    if (!company.exists || company.data()?.codeBlocked === true || !profile.exists || access.data()?.enabled !== true) {
      throw new HttpsError('permission-denied', 'Sem acesso à gestão de compras desta empresa.');
    }
    if (items.empty || items.size > 10) throw new HttpsError('failed-precondition', 'Os itens da cotação não foram encontrados.');
    if (new Set(items.docs.map(item => String(item.data().quoteNumber || '')).filter(Boolean)).size > 1) {
      throw new HttpsError('failed-precondition', 'Os itens não pertencem à mesma cotação numerada.');
    }
    const quoted = items.docs.filter(item => Number(item.data().quotedPrice) > 0);
    if (!quoted.length || quoted.some(item => {
      const record = item.data();
      return record.status !== 'quotation' || record.approverId !== actorId || !record.supplier ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(record.expectedDate || '')) ||
        !Number.isFinite(Number(record.quantity)) || !(Number(record.quantity) > 0) ||
        !Number.isFinite(Number(record.quotedPrice));
    })) throw new HttpsError('failed-precondition', 'Confira itens, preços e aprovador da cotação.');
    const total = Math.round(quoted.reduce((sum, item) => sum + Number(item.data().quantity) * Number(item.data().quotedPrice), 0) * 100) / 100;
    if (!Number.isFinite(total) || total <= 0) throw new HttpsError('failed-precondition', 'O total da cotação é inválido.');
    const config = policy.data() || {};
    const requiredApprover = config.enabled === true
      ? (total <= Number(config.threshold) ? config.lowerApproverId : config.upperApproverId)
      : (profile.data()?.isAdmin === true ? actorId : '');
    if (requiredApprover !== actorId || (config.preventSelfApproval === true && quoted.some(item => [item.data().requesterId, item.data().buyerId].includes(actorId)))) {
      throw new HttpsError('permission-denied', 'O aprovador não corresponde à alçada ou à separação de funções.');
    }
    const now = Date.now();
    for (const item of quoted) {
      const current = item.data();
      const updatedAt = Math.max(now, Number(current.updatedAt || 0) + 1);
      transaction.update(item.ref, {
        quoteTotal: total, status: 'approved', approvedBy: actorId, approvedAt: updatedAt,
        updatedAt, updatedBy: actorId,
        history: [...(Array.isArray(current.history) ? current.history : []), {
          stage: 'approved', by: actorId, byName: String(profile.data()?.name || 'Aprovador').slice(0, 120), at: updatedAt,
          detail: `Cotação conjunta aprovada. Total: R$ ${total.toFixed(2)}`,
        }].slice(-50),
      });
    }
    return {approved: quoted.length, total};
  });
}
