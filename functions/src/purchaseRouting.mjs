export function defaultPurchaseBuyer(policy) {
  return policy?.defaultBuyerId || (policy?.buyerIds?.length === 1 ? policy.buyerIds[0] : '');
}

export function purchaseApprover(policy, total, items, adminIds = []) {
  if (!items.length || !(total > 0) || !Number.isFinite(total)) return '';
  const involved = new Set(items.flatMap(item => [item.requesterId, item.buyerId]));
  if (policy?.enabled) {
    const approver = total <= Number(policy.threshold) ? policy.lowerApproverId : policy.upperApproverId;
    return (!policy.preventSelfApproval || !involved.has(approver)) ? approver || '' : '';
  }
  if (policy?.preventSelfApproval) {
    const assigned = items[0].approverId;
    if (adminIds.includes(assigned) && !involved.has(assigned)) return assigned;
    return [...adminIds].sort().find(id => !involved.has(id)) || '';
  }
  const role = policy?.requireRequesterReview === false ? 'buyerId' : 'requesterId';
  const approver = items[0][role];
  return approver && items.every(item => item[role] === approver) ? approver : '';
}

export function purchaseApprovalFields(item, approverId) {
  return {
    approverId,
    participantIds: [...new Set([
      item.requesterId, item.buyerId, approverId, item.receiverId, item.recipientId, item.financeId,
    ].filter(Boolean))],
  };
}

export const PURCHASE_STAGE_ASSIGNMENTS = {
  requested: { role: 'buyerId', policyKey: 'buyerIds', label: 'Cotação' },
  in_transit: { role: 'receiverId', policyKey: 'receiverIds', label: 'Recebimento e NF' },
  stored: { role: 'recipientId', policyKey: 'recipientIds', label: 'Entrega ao destino' },
  delivered: { role: 'financeId', policyKey: 'financeIds', label: 'Conferência financeira' },
};

export function purchaseStageCandidates(policy, stage) {
  const assignment = PURCHASE_STAGE_ASSIGNMENTS[stage];
  if (!assignment) return [];
  const defaultBuyer = stage === 'requested' && defaultPurchaseBuyer(policy);
  if (defaultBuyer) return [defaultBuyer];
  const candidates = policy?.[assignment.policyKey];
  return Array.isArray(candidates) ? candidates : [];
}

export function availablePurchaseAssignment(policy, item) {
  const assignment = PURCHASE_STAGE_ASSIGNMENTS[item.status];
  if (item.workflowVersion !== 2 || !assignment || item[assignment.role]) return null;
  const candidates = purchaseStageCandidates(policy, item.status);
  return candidates.length ? { ...assignment, candidates } : null;
}
