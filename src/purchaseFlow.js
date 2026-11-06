export const PURCHASE_STAGES = {
  requested: 'Solicitada', quotation: 'Em cotação', approved: 'Aprovada pela alçada', ordered: 'Pedido emitido',
  in_transit: 'Em transporte', received: 'Em conferência', exception: 'Divergência',
  stored: 'Armazenada', delivered: 'Entregue ao destino', closed: 'Concluída pelo Financeiro',
  rejected: 'Recusada', cancelled: 'Cancelada',
};

export const PURCHASE_NEXT = {
  requested: ['quotation', 'rejected', 'cancelled'],
  quotation: ['approved', 'rejected', 'cancelled'],
  approved: ['ordered', 'cancelled'],
  ordered: ['in_transit', 'received', 'exception', 'cancelled'],
  in_transit: ['received', 'exception', 'cancelled'],
  received: ['stored', 'exception'],
  exception: ['received', 'cancelled'],
  stored: ['delivered'],
  delivered: ['closed'],
  closed: [], rejected: [], cancelled: [],
};

const text = (value, limit = 160) => String(value || '').trim().slice(0, limit);
const number = value => Number(value);

export function purchaseFields(value = {}) {
  return {
    item: text(value.item), specification: text(value.specification, 1000),
    quantity: number(value.quantity), unit: text(value.unit, 30),
    department: text(value.department, 120), destination: text(value.destination, 160),
    neededBy: text(value.neededBy, 10), reason: text(value.reason, 1000),
    priority: ['normal', 'high', 'urgent'].includes(value.priority) ? value.priority : 'normal',
    supplier: text(value.supplier, 160), quotedPrice: number(value.quotedPrice || 0),
    orderNumber: text(value.orderNumber, 80), expectedDate: text(value.expectedDate, 10),
    carrier: text(value.carrier, 120), trackingCode: text(value.trackingCode, 120),
    invoiceNumber: text(value.invoiceNumber, 80), receivedQuantity: number(value.receivedQuantity || 0),
    condition: ['pending', 'ok', 'damaged'].includes(value.condition) ? value.condition : 'pending',
    lot: text(value.lot, 100), expiresAt: text(value.expiresAt, 10),
    storageAddress: text(value.storageAddress, 160), destinationRecipient: text(value.destinationRecipient, 160),
    note: text(value.note, 1000),
    buyerId: text(value.buyerId, 128), approverId: text(value.approverId, 128),
    receiverId: text(value.receiverId, 128), recipientId: text(value.recipientId, 128), financeId: text(value.financeId, 128),
  };
}

export function validatePurchase(fields, stage = 'requested') {
  const data = purchaseFields(fields);
  if (!data.item || !data.specification || !data.unit || !data.department || !data.destination || !data.reason) return 'Preencha item, especificação, unidade, setor, destino e justificativa.';
  if (!Number.isFinite(data.quantity) || data.quantity <= 0 || data.quantity > 1000000) return 'Informe uma quantidade válida.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.neededBy)) return 'Informe a data em que o item é necessário.';
  if (['approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'closed'].includes(stage)) {
    if (!data.supplier || !Number.isFinite(data.quotedPrice) || data.quotedPrice <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.expectedDate)) return 'Informe fornecedor, preço unitário e previsão antes da aprovação.';
  }
  if (['quotation', 'approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'closed'].includes(stage) && !data.buyerId) return 'Defina o comprador responsável.';
  if (['approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'closed'].includes(stage) && !data.approverId) return 'Defina o aprovador da alçada.';
  if (['ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'closed'].includes(stage) && !data.orderNumber) return 'Informe o número do pedido aprovado.';
  if (['received', 'exception', 'stored', 'delivered', 'closed'].includes(stage)) {
    if (!data.receiverId) return 'Defina quem fará o recebimento.';
    if (!data.invoiceNumber || !Number.isFinite(data.receivedQuantity) || data.receivedQuantity <= 0 || data.receivedQuantity > data.quantity || data.condition === 'pending') return 'Confira NF, quantidade recebida e condição do item.';
  }
  if (['stored', 'delivered', 'closed'].includes(stage)) {
    if (data.receivedQuantity !== data.quantity || data.condition !== 'ok') return 'Resolva a divergência e confira toda a quantidade antes de armazenar.';
    if (!data.storageAddress) return 'Identifique o endereço físico de armazenagem.';
  }
  if (['delivered', 'closed'].includes(stage) && (!data.recipientId || !data.destinationRecipient)) return 'Defina o destinatário e identifique quem recebeu o item no destino.';
  if (stage === 'closed' && !data.financeId) return 'Defina o responsável Financeiro.';
  return '';
}

export function purchaseTransition(record, next, fields, actor, now = Date.now()) {
  if (!PURCHASE_NEXT[record?.status]?.includes(next)) throw new Error('Esta etapa não pode ser aplicada ao pedido atual.');
  const normalized = purchaseFields(fields);
  const actorId = String(actor?.id || '');
  const responsible = { quotation: 'buyerId', approved: 'approverId', ordered: 'buyerId', in_transit: 'buyerId',
    received: 'receiverId', exception: 'receiverId', stored: 'receiverId', delivered: 'recipientId', closed: 'financeId' }[next];
  if (responsible && (!normalized[responsible] || normalized[responsible] !== actorId)) throw new Error('Esta confirmação pertence ao responsável designado para a etapa.');
  if (['rejected', 'cancelled'].includes(next) && !actor?.isAdmin && !actor?.isDeveloper) throw new Error('Somente a administração pode encerrar esta solicitação.');
  const error = validatePurchase(normalized, next);
  if (error) throw new Error(error);
  if (next === 'received' && (normalized.receivedQuantity < normalized.quantity || normalized.condition === 'damaged')) {
    throw new Error('Entrega parcial ou avariada: registre como divergência.');
  }
  if (next === 'exception' && normalized.receivedQuantity === normalized.quantity && normalized.condition === 'ok') {
    throw new Error('Registre a divergência na quantidade ou condição antes de marcar esta etapa.');
  }
  if (next === 'ordered' && !record.approvedAt) throw new Error('A aprovação da alçada deve ocorrer antes do pedido.');
  if (next === 'closed' && (!record.buyerConfirmedAt || !record.receiverConfirmedAt || !record.recipientConfirmedAt || !record.invoiceReceivedAt)) {
    throw new Error('Faltam os atestes do comprador, recebimento, nota fiscal ou destinatário.');
  }
  const event = { stage: next, by: actorId, byName: text(actor?.name, 120), at: now };
  const proof = {
    ...(next === 'approved' ? { approvedBy: actorId, approvedAt: now } : {}),
    ...(next === 'ordered' ? { buyerConfirmedBy: actorId, buyerConfirmedAt: now } : {}),
    ...(['received','exception'].includes(next) ? { receiverConfirmedBy: actorId, receiverConfirmedAt: now, invoiceReceivedBy: actorId, invoiceReceivedAt: now } : {}),
    ...(next === 'delivered' ? { recipientConfirmedBy: actorId, recipientConfirmedAt: now } : {}),
    ...(next === 'closed' ? { financeConfirmedBy: actorId, financeConfirmedAt: now } : {}),
  };
  const previousProofs = Object.fromEntries(['approvedBy','approvedAt','buyerConfirmedBy','buyerConfirmedAt','receiverConfirmedBy','receiverConfirmedAt','invoiceReceivedBy','invoiceReceivedAt','recipientConfirmedBy','recipientConfirmedAt','financeConfirmedBy','financeConfirmedAt'].filter(key => record[key] !== undefined).map(key => [key, record[key]]));
  return { ...normalized, ...previousProofs, ...proof, status: next, updatedAt: now, updatedBy: event.by,
    history: [...(Array.isArray(record.history) ? record.history : []), event].slice(-50) };
}

export function expectedApprover(policy, total, fallbackAdminId) {
  if (!policy?.enabled) return String(fallbackAdminId || '');
  if (!Number.isFinite(Number(policy.threshold)) || Number(policy.threshold) <= 0) return '';
  return String(total <= Number(policy.threshold) ? policy.lowerApproverId || '' : policy.upperApproverId || '');
}
