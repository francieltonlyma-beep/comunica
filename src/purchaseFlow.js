export const PURCHASE_STAGES = {
  requested: 'Solicitada', approved: 'Aprovada', quotation: 'Em cotação', ordered: 'Pedido emitido',
  in_transit: 'Em transporte', received: 'Em conferência', exception: 'Divergência',
  stored: 'Armazenada', delivered: 'Entregue ao destino', closed: 'Concluída',
  rejected: 'Recusada', cancelled: 'Cancelada',
};

export const PURCHASE_NEXT = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['quotation', 'cancelled'],
  quotation: ['ordered', 'cancelled'],
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
  };
}

export function validatePurchase(fields, stage = 'requested') {
  const data = purchaseFields(fields);
  if (!data.item || !data.specification || !data.unit || !data.department || !data.destination || !data.reason) return 'Preencha item, especificação, unidade, setor, destino e justificativa.';
  if (!Number.isFinite(data.quantity) || data.quantity <= 0 || data.quantity > 1000000) return 'Informe uma quantidade válida.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.neededBy)) return 'Informe a data em que o item é necessário.';
  if (['ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'closed'].includes(stage)) {
    if (!data.supplier || !data.orderNumber || !Number.isFinite(data.quotedPrice) || data.quotedPrice <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.expectedDate)) return 'Para emitir o pedido, informe fornecedor, número, preço unitário e previsão.';
  }
  if (['received', 'exception', 'stored', 'delivered', 'closed'].includes(stage)) {
    if (!data.invoiceNumber || !Number.isFinite(data.receivedQuantity) || data.receivedQuantity <= 0 || data.receivedQuantity > data.quantity || data.condition === 'pending') return 'Confira NF, quantidade recebida e condição do item.';
  }
  if (['stored', 'delivered', 'closed'].includes(stage)) {
    if (data.receivedQuantity !== data.quantity || data.condition !== 'ok') return 'Resolva a divergência e confira toda a quantidade antes de armazenar.';
    if (!data.storageAddress) return 'Identifique o endereço físico de armazenagem.';
  }
  if (['delivered', 'closed'].includes(stage) && !data.destinationRecipient) return 'Identifique quem recebeu o item no destino.';
  return '';
}

export function purchaseTransition(record, next, fields, actor, now = Date.now()) {
  if (!PURCHASE_NEXT[record?.status]?.includes(next)) throw new Error('Esta etapa não pode ser aplicada ao pedido atual.');
  const normalized = purchaseFields(fields);
  const error = validatePurchase(normalized, next);
  if (error) throw new Error(error);
  if (next === 'received' && (normalized.receivedQuantity < normalized.quantity || normalized.condition === 'damaged')) {
    throw new Error('Entrega parcial ou avariada: registre como divergência.');
  }
  if (next === 'exception' && normalized.receivedQuantity === normalized.quantity && normalized.condition === 'ok') {
    throw new Error('Registre a divergência na quantidade ou condição antes de marcar esta etapa.');
  }
  const event = { stage: next, by: String(actor?.id || ''), byName: text(actor?.name, 120), at: now };
  return { ...normalized, status: next, updatedAt: now, updatedBy: event.by,
    history: [...(Array.isArray(record.history) ? record.history : []), event].slice(-50) };
}
