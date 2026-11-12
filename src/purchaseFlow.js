export const PURCHASE_STAGES = {
  requested: 'Solicitada', quotation: 'Em cotação', approved: 'Aprovada pela alçada', ordered: 'Pedido emitido',
  in_transit: 'Em transporte', received: 'Em conferência', exception: 'Divergência',
  stored: 'Armazenada', delivered: 'Entregue ao destino', finance_dispute: 'NF em correção', closed: 'Concluída pelo Financeiro',
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
  delivered: ['closed', 'finance_dispute'],
  finance_dispute: ['delivered'],
  closed: [], rejected: ['quotation','requested'], cancelled: [],
};

const text = (value, limit = 160) => String(value || '').trim().slice(0, limit);
const number = value => Number(value);
export const purchaseQuoteNumber = (createdAt, firstId) => {
  const date = new Date(createdAt);
  const prefix = Number.isFinite(date.getTime()) ? `${new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(date).replaceAll('-', '')}-` : '';
  return `COT-${prefix}${String(firstId).slice(0, 8).toUpperCase()}`;
};
export const purchaseQuoteTotal = items => items.reduce((total, item) => total + (Number(item.quotedPrice) || 0) * (Number(item.quantity) || 0), 0);

export function purchaseFields(value = {}) {
  return {
    ...(value.category === undefined ? {} : { category: text(value.category, 80) || 'Sem categoria' }), item: text(value.item), specification: text(value.specification, 1000),
    quantity: number(value.quantity), unit: text(value.unit, 30),
    department: text(value.department, 120), destination: text(value.destination, 160),
    neededBy: text(value.neededBy, 10), reason: text(value.reason, 1000),
    priority: ['normal', 'high', 'urgent'].includes(value.priority) ? value.priority : 'normal',
    supplier: text(value.supplier, 160), quotedPrice: number(value.quotedPrice || 0), quoteTotal: number(value.quoteTotal || 0),
    orderNumber: text(value.orderNumber, 80), expectedDate: text(value.expectedDate, 10),
    carrier: text(value.carrier, 120), trackingCode: text(value.trackingCode, 120),
    invoiceNumber: text(value.invoiceNumber, 80), invoiceTotal: number(value.invoiceTotal || 0), receivedQuantity: number(value.receivedQuantity || 0),
    condition: ['pending', 'ok', 'damaged'].includes(value.condition) ? value.condition : 'pending',
    lot: text(value.lot, 100), expiresAt: text(value.expiresAt, 10),
    storageAddress: text(value.storageAddress, 160), destinationRecipient: text(value.destinationRecipient, 160),
    note: text(value.note, 1000), financeIssue: text(value.financeIssue, 1000), financeResolution: text(value.financeResolution, 1000),
    buyerId: text(value.buyerId, 128), approverId: text(value.approverId, 128),
    receiverId: text(value.receiverId, 128), recipientId: text(value.recipientId, 128), financeId: text(value.financeId, 128),
  };
}

const EDITABLE_PURCHASE_FIELDS = ['supplier','quotedPrice','quoteTotal','orderNumber','expectedDate','carrier','trackingCode',
  'invoiceNumber','invoiceTotal','receivedQuantity','condition','lot','expiresAt','storageAddress','destinationRecipient','note',
  'buyerId','approverId','receiverId','recipientId','financeId'];
const PURCHASE_ROLES = ['buyerId','approverId','receiverId','recipientId','financeId'];

export function purchaseDataPatch(current, draft, manager, actor, now) {
  const before = purchaseFields(current);
  const after = purchaseFields(draft);
  const allowed = manager ? EDITABLE_PURCHASE_FIELDS : EDITABLE_PURCHASE_FIELDS.filter(key => !PURCHASE_ROLES.includes(key));
  const changes = Object.fromEntries(allowed.filter(key => after[key] !== before[key]).map(key => [key, after[key]]));
  if (Object.keys(changes).length === 0) return null;
  if (PURCHASE_ROLES.some(key => key in changes)) {
    changes.participantIds = [...new Set([current.requesterId, ...PURCHASE_ROLES.map(key => after[key])].filter(Boolean))];
  }
  return { ...changes, updatedAt: now, updatedBy: actor.id,
    history: [...(current.history || []), { stage: current.status, by: actor.id, byName: actor.name || 'Responsável', at: now,
      detail: 'Dados e responsáveis atualizados' }].slice(-50) };
}

export function validatePurchase(fields, stage = 'requested') {
  const data = purchaseFields(fields);
  if (!data.item || !data.specification || !data.unit || !data.department || !data.destination || !data.reason) return 'Preencha item, especificação, unidade, setor, destino e justificativa.';
  if (!Number.isFinite(data.quantity) || data.quantity <= 0 || data.quantity > 1000000) return 'Informe uma quantidade válida.';
  if (!Number.isFinite(data.quoteTotal) || data.quoteTotal < 0) return 'Informe um total válido para a cotação.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.neededBy)) return 'Informe a data em que o item é necessário.';
  if (['approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'finance_dispute', 'closed'].includes(stage)) {
    if (!data.supplier || !Number.isFinite(data.quotedPrice) || data.quotedPrice <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.expectedDate)) return 'Informe fornecedor, preço unitário e previsão antes da aprovação.';
  }
  if (['quotation', 'approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'finance_dispute', 'closed'].includes(stage) && !data.buyerId) return 'Defina o comprador responsável.';
  if (['approved', 'ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'finance_dispute', 'closed'].includes(stage) && !data.approverId) return 'Defina o aprovador da alçada.';
  if (['ordered', 'in_transit', 'received', 'exception', 'stored', 'delivered', 'finance_dispute', 'closed'].includes(stage) && !data.orderNumber) return 'Informe o número do pedido aprovado.';
  if (['received', 'exception', 'stored', 'delivered', 'finance_dispute', 'closed'].includes(stage)) {
    if (!data.receiverId) return 'Defina quem fará o recebimento.';
    if (!data.invoiceNumber || !Number.isFinite(data.receivedQuantity) || data.receivedQuantity <= 0 || data.receivedQuantity > data.quantity || data.condition === 'pending') return 'Confira NF, quantidade recebida e condição do item.';
  }
  if (['stored', 'delivered', 'finance_dispute', 'closed'].includes(stage)) {
    if (data.receivedQuantity !== data.quantity || data.condition !== 'ok') return 'Resolva a divergência e confira toda a quantidade antes de armazenar.';
    if (!data.storageAddress) return 'Identifique o endereço físico de armazenagem.';
  }
  if (['delivered', 'finance_dispute', 'closed'].includes(stage) && (!data.recipientId || !data.destinationRecipient)) return 'Defina o destinatário e identifique quem recebeu o item no destino.';
  if (stage === 'closed' && !data.financeId) return 'Defina o responsável Financeiro.';
  return '';
}

export function purchaseTransition(record, next, fields, actor, now = Date.now()) {
  if (!PURCHASE_NEXT[record?.status]?.includes(next)) throw new Error('Esta etapa não pode ser aplicada ao pedido atual.');
  const normalized = purchaseFields(fields);
  const actorId = String(actor?.id || '');
  const responsible = next === 'delivered' && record.status === 'finance_dispute' ? 'receiverId' : { quotation: 'buyerId', approved: 'approverId', ordered: 'buyerId', in_transit: 'buyerId',
    received: 'receiverId', exception: 'receiverId', stored: 'receiverId', delivered: 'recipientId', finance_dispute: 'financeId', closed: 'financeId' }[next];
  if (responsible && (!normalized[responsible] || normalized[responsible] !== actorId)) throw new Error('Esta confirmação pertence ao responsável designado para a etapa.');
  if (['rejected', 'cancelled'].includes(next) && !actor?.isAdmin && !actor?.isDeveloper) throw new Error('Somente a administração pode encerrar esta solicitação.');
  if (next === 'requested' && !actor?.isAdmin && !actor?.isDeveloper) throw new Error('Somente a administração pode reabrir esta solicitação.');
  if (next === 'rejected' && (!normalized.note || normalized.note === (record.note || ''))) throw new Error('Informe o motivo da recusa nas observações antes de continuar.');
  const error = validatePurchase(normalized, next);
  if (error) throw new Error(error);
  if (next === 'received' && (normalized.receivedQuantity < normalized.quantity || normalized.condition === 'damaged')) {
    throw new Error('Entrega parcial ou avariada: registre como divergência.');
  }
  if (next === 'exception' && normalized.receivedQuantity === normalized.quantity && normalized.condition === 'ok') {
    throw new Error('Registre a divergência na quantidade ou condição antes de marcar esta etapa.');
  }
  if (next === 'ordered' && !record.approvedAt) throw new Error('A aprovação da alçada deve ocorrer antes do pedido.');
  if (next === 'finance_dispute' && !normalized.financeIssue) throw new Error('Descreva por que a nota fiscal não está conforme.');
  if (next === 'delivered' && record.status === 'finance_dispute' && !normalized.financeResolution) throw new Error('Descreva a correção da nota fiscal antes de devolver ao Financeiro.');
  if (next === 'closed' && record.financeIssueAt && !(record.financeResolutionAt > record.financeIssueAt)) throw new Error('A nota fiscal ainda tem uma divergência pendente.');
  if (next === 'closed' && !(normalized.invoiceTotal > 0)) throw new Error('Informe o valor total da nota fiscal antes da conclusão.');
  if (next === 'closed' && (!record.buyerConfirmedAt || !record.receiverConfirmedAt || !record.recipientConfirmedAt || !record.invoiceReceivedAt)) {
    throw new Error('Faltam os atestes do comprador, recebimento, nota fiscal ou destinatário.');
  }
  const event = { stage: next, by: actorId, byName: text(actor?.name, 120), at: now,
    ...(next === 'rejected' ? {detail:normalized.note,supplier:record.supplier || '',quotedPrice:Number(record.quotedPrice || 0),expectedDate:record.expectedDate || ''} : next === 'finance_dispute' ? {detail:normalized.financeIssue}
      : record.status === 'finance_dispute' && next === 'delivered' ? {detail:normalized.financeResolution} : {}) };
  const proof = {
    ...(next === 'approved' ? { approvedBy: actorId, approvedAt: now } : {}),
    ...(next === 'ordered' ? { buyerConfirmedBy: actorId, buyerConfirmedAt: now } : {}),
    ...(['received','exception'].includes(next) ? { receiverConfirmedBy: actorId, receiverConfirmedAt: now, invoiceReceivedBy: actorId, invoiceReceivedAt: now } : {}),
    ...(next === 'delivered' && record.status !== 'finance_dispute' ? { recipientConfirmedBy: actorId, recipientConfirmedAt: now } : {}),
    ...(next === 'finance_dispute' ? { financeIssueBy: actorId, financeIssueAt: now, financeResolutionBy: '', financeResolutionAt: 0, financeResolution: '' } : {}),
    ...(next === 'delivered' && record.status === 'finance_dispute' ? { financeResolutionBy: actorId, financeResolutionAt: now,
      receiverConfirmedBy: actorId, receiverConfirmedAt: now, invoiceReceivedBy: actorId, invoiceReceivedAt: now } : {}),
    ...(next === 'closed' ? { financeConfirmedBy: actorId, financeConfirmedAt: now } : {}),
  };
  const previousProofs = Object.fromEntries(['approvedBy','approvedAt','buyerConfirmedBy','buyerConfirmedAt','receiverConfirmedBy','receiverConfirmedAt','invoiceReceivedBy','invoiceReceivedAt','recipientConfirmedBy','recipientConfirmedAt','financeConfirmedBy','financeConfirmedAt','financeIssueBy','financeIssueAt','financeResolutionBy','financeResolutionAt'].filter(key => record[key] !== undefined).map(key => [key, record[key]]));
  return { ...normalized, ...previousProofs, ...proof, status: next, updatedAt: now, updatedBy: event.by,
    history: [...(Array.isArray(record.history) ? record.history : []), event].slice(-50) };
}

const TRANSITION_FIELDS = {
  requested: [],
  quotation: ['supplier','quotedPrice','quoteTotal','orderNumber','expectedDate','carrier','trackingCode','note'],
  approved: ['approvedBy','approvedAt'],
  ordered: ['orderNumber','carrier','trackingCode','note','buyerConfirmedBy','buyerConfirmedAt'],
  in_transit: ['carrier','trackingCode','note'],
  received: ['invoiceNumber','invoiceTotal','receivedQuantity','condition','lot','expiresAt','storageAddress','note',
    'receiverConfirmedBy','receiverConfirmedAt','invoiceReceivedBy','invoiceReceivedAt'],
  exception: ['invoiceNumber','invoiceTotal','receivedQuantity','condition','lot','expiresAt','storageAddress','note',
    'receiverConfirmedBy','receiverConfirmedAt','invoiceReceivedBy','invoiceReceivedAt'],
  stored: ['storageAddress','lot','expiresAt','note'],
  delivered: ['destinationRecipient','recipientConfirmedBy','recipientConfirmedAt','invoiceNumber','invoiceTotal','financeResolution','financeResolutionBy','financeResolutionAt','receiverConfirmedBy','receiverConfirmedAt','invoiceReceivedBy','invoiceReceivedAt'],
  finance_dispute: ['invoiceTotal','financeIssue','financeIssueBy','financeIssueAt','financeResolution','financeResolutionBy','financeResolutionAt'],
  closed: ['invoiceTotal','financeConfirmedBy','financeConfirmedAt'],
  rejected: ['note'], cancelled: ['note'],
};

export function purchaseTransitionPatch(record, next, draft, actor, now = Date.now()) {
  const allowed = TRANSITION_FIELDS[next] || [];
  const before = purchaseFields(record);
  const after = purchaseFields(draft);
  const unsaved = EDITABLE_PURCHASE_FIELDS.filter(key => before[key] !== after[key] && !allowed.includes(key));
  if (unsaved.length) throw new Error('Há alterações fora desta etapa. Use “Salvar dados” antes de avançar.');
  const transition = purchaseTransition(record, next, draft, actor, now);
  const keys = ['status','updatedAt','updatedBy','history',...allowed];
  return Object.fromEntries(keys.filter(key => transition[key] !== record[key] && transition[key] !== undefined)
    .map(key => [key,transition[key]]));
}

export function expectedApprover(policy, total, fallbackAdminId) {
  if (!policy?.enabled) return String(fallbackAdminId || '');
  if (!Number.isFinite(Number(policy.threshold)) || Number(policy.threshold) <= 0) return '';
  return String(total <= Number(policy.threshold) ? policy.lowerApproverId || '' : policy.upperApproverId || '');
}

export function purchaseInvoiceMatch(record, tolerancePercent = 0) {
  const expected = Number(record.quotedPrice || 0) * Number(record.quantity || 0);
  const actual = Number(record.invoiceTotal || 0);
  const tolerance = Math.min(10, Math.max(0, Number(tolerancePercent) || 0));
  return {expected, actual, difference:actual - expected, tolerance,
    matches: actual > 0 && expected > 0 && Math.abs(actual - expected) <= expected * tolerance / 100 + 0.005,
    quantityMatches: Number(record.receivedQuantity || 0) === Number(record.quantity || 0)};
}

export function purchaseInsights(records, today = '') {
  const active = records.filter(item => !['closed','cancelled','rejected'].includes(item.status));
  const values = records.filter(item => Number(item.quotedPrice) > 0);
  const sum = values.reduce((total,item) => total + Number(item.quotedPrice) * Number(item.quantity),0);
  const groups = key => Object.entries(records.reduce((totals,item) => {
    const label = String(item[key] || 'Não informado');
    totals[label] = (totals[label] || 0) + Number(item.quotedPrice || 0) * Number(item.quantity || 0);
    return totals;
  },{})).sort((a,b) => b[1] - a[1]).slice(0,5);
  const days = (start,end) => Math.max(0,(Number(end) - Number(start)) / 86400000);
  const average = values => values.length ? values.reduce((total,value) => total + value,0) / values.length : 0;
  return {total:sum, open:active.length, overdue:active.filter(item => purchaseOverdue(item,today)).length,
    discrepancies:active.filter(item => ['exception','finance_dispute'].includes(item.status)).length,
    approvalDays:average(records.filter(item => item.approvedAt && item.createdAt).map(item => days(item.createdAt,item.approvedAt))),
    deliveryDays:average(records.filter(item => item.recipientConfirmedAt && item.createdAt).map(item => days(item.createdAt,item.recipientConfirmedAt))),
    byCategory:groups('category'),byDepartment:groups('department'),bySupplier:groups('supplier')};
}

export function purchasePendingDays(record, now = Date.now()) {
  return Math.max(0,Math.floor((now - Number(record.updatedAt || record.createdAt || now)) / 86400000));
}

export const PURCHASE_CATEGORIES = ['Alimentos e bebidas', 'Embalagens', 'Limpeza e higiene', 'Equipamentos', 'Manutenção', 'Material de escritório', 'Serviços', 'Outros'];
export const PURCHASE_FILTERS = { requester: '', responsible: '', category: '', department: '', priority: '', from: '', to: '', view: '', sort: 'recent' };
const normalizedText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function pendingPurchaseRole(record) {
  if (record.status === 'quotation' && (!record.supplier || !record.expectedDate || !(Number(record.quotedPrice) > 0))) return 'buyerId';
  return ({ requested: 'buyerId', quotation: 'approverId', approved: 'buyerId', ordered: 'buyerId', in_transit: 'receiverId', received: 'receiverId', exception: 'receiverId', stored: 'recipientId', delivered: 'financeId', finance_dispute: 'receiverId' })[record.status] || '';
}
export function purchaseOverdue(record, today) {
  return !['closed', 'cancelled', 'rejected', 'delivered'].includes(record.status) && Boolean(record.neededBy && record.neededBy < today);
}
export function filterPurchases(records, filters, search = '', stage = 'all', users = [], actorId = '', today = '') {
  const names = new Map(users.map(person => [person.id, person.name]));
  const roles = ['buyerId', 'approverId', 'receiverId', 'recipientId', 'financeId'];
  const query = normalizedText(search);
  return records.filter(item => {
    const pending = pendingPurchaseRole(item);
    return (stage === 'all' || item.status === stage)
      && (!filters.requester || item.requesterId === filters.requester)
      && (!filters.responsible || roles.some(role => item[role] === filters.responsible))
      && (!filters.category || (item.category || 'Sem categoria') === filters.category)
      && (!filters.department || item.department === filters.department)
      && (!filters.priority || item.priority === filters.priority)
      && (!filters.from || item.neededBy >= filters.from) && (!filters.to || item.neededBy <= filters.to)
      && (!filters.view || (filters.view === 'overdue' ? purchaseOverdue(item, today)
        : filters.view === 'mine' ? pending && item[pending] === actorId
          : filters.view === 'unassigned' ? pending && !item[pending] : true))
      && normalizedText([item.id, item.quoteNumber, item.bundleId ? purchaseQuoteNumber(item.createdAt, item.bundleId) : '', item.item, item.specification, item.requesterName, item.department, item.category,
        item.orderNumber, item.supplier, item.destination, ...roles.map(role => names.get(item[role]) || '')].join(' ')).includes(query);
  }).sort((a, b) => filters.sort === 'deadline' ? String(a.neededBy || '9999').localeCompare(String(b.neededBy || '9999'))
    : filters.sort === 'value' ? Number(b.quotedPrice || 0) * Number(b.quantity) - Number(a.quotedPrice || 0) * Number(a.quantity)
      : Number(b.createdAt || 0) - Number(a.createdAt || 0));
}
export function purchaseSaveError(problem, action = 'o envio da solicitação') {
  const code = String(problem?.code || 'unknown').replace('firestore/', '');
  const message = code === 'permission-denied' ? `O servidor recusou ${action}. Verifique seu acesso à empresa e os responsáveis desta etapa.`
    : code === 'unauthenticated' ? 'Sua sessão expirou. Entre novamente e tente salvar.'
      : ['unavailable', 'deadline-exceeded'].includes(code) ? 'Não foi possível confirmar a gravação por falha de conexão. Confira a lista antes de tentar novamente.'
        : 'Não foi possível salvar a solicitação.';
  return `${message} Seus dados continuam no formulário. Código: ${code}.`;
}
