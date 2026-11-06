import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedApprover, purchaseFields, purchaseTransition, purchaseTransitionPatch, validatePurchase } from '../src/purchaseFlow.js';

const people = {
  buyer: { id: 'buyer', name: 'Comprador' },
  approver: { id: 'approver', name: 'Aprovadora' },
  receiver: { id: 'receiver', name: 'Recebedora' },
  recipient: { id: 'recipient', name: 'Destinatário' },
  finance: { id: 'finance', name: 'Financeiro' },
};
const fields = purchaseFields({
  item: 'Luvas', specification: 'Nitrílica M', quantity: 10, unit: 'caixa',
  department: 'Enfermagem', destination: 'Sala 1', neededBy: '2026-11-20', reason: 'Reposição',
  buyerId: 'buyer', approverId: 'approver', receiverId: 'receiver', recipientId: 'recipient', financeId: 'finance',
});
const step = (record, stage, actor, data = {}) => purchaseTransition(record, stage, { ...record, ...data }, actor, (record.updatedAt || 100) + 1);

test('comprador, alçada, recebedor, destinatário e financeiro atestam em sequência', () => {
  let record = { ...fields, status: 'requested', history: [], updatedAt: 100 };
  record = step(record, 'quotation', people.buyer);
  record = step(record, 'approved', people.approver, { supplier: 'Fornecedor A', quotedPrice: 35, expectedDate: '2026-11-18' });
  assert.equal(record.approvedBy, 'approver');
  assert.throws(() => step(record, 'ordered', people.approver, { orderNumber: 'OC-1' }), /responsável/);
  record = step(record, 'ordered', people.buyer, { orderNumber: 'OC-1' });
  assert.equal(record.buyerConfirmedBy, 'buyer');
  assert.match(validatePurchase(record, 'received'), /NF/);
  record = step(record, 'received', people.receiver, { invoiceNumber: 'NF-1', receivedQuantity: 10, condition: 'ok' });
  assert.equal(record.invoiceReceivedBy, 'receiver');
  assert.equal(record.receiverConfirmedBy, 'receiver');
  assert.match(validatePurchase(record, 'stored'), /endereço/);
  record = step(record, 'stored', people.receiver, { storageAddress: 'Almoxarifado A-2' });
  record = step(record, 'delivered', people.recipient, { destinationRecipient: 'Destinatário' });
  assert.equal(record.recipientConfirmedBy, 'recipient');
  assert.throws(() => step(record, 'closed', people.buyer), /responsável/);
  record = step(record, 'closed', people.finance);
  assert.equal(record.financeConfirmedBy, 'finance');
  assert.equal(record.status, 'closed');
});

test('divergência parcial impede entrega até a conferência completa', () => {
  const ordered = { ...fields, status: 'ordered', history: [], supplier: 'Fornecedor A', quotedPrice: 35,
    orderNumber: 'OC-1', expectedDate: '2026-11-18', approvedAt: 1, buyerConfirmedAt: 2 };
  const partial = { invoiceNumber: 'NF-1', receivedQuantity: 8, condition: 'ok' };
  assert.throws(() => step(ordered, 'received', people.receiver, partial), /divergência/);
  const exception = step(ordered, 'exception', people.receiver, partial);
  assert.equal(exception.invoiceReceivedBy, 'receiver');
  assert.throws(() => step(exception, 'stored', people.receiver), /etapa/);
  const checked = step(exception, 'received', people.receiver, { receivedQuantity: 10 });
  assert.equal(checked.status, 'received');
});

test('alçada usa valor total e exige configuração completa', () => {
  const policy = { enabled: true, threshold: 1000, lowerApproverId: 'a', upperApproverId: 'b' };
  assert.equal(expectedApprover(policy, 1000, 'admin'), 'a');
  assert.equal(expectedApprover(policy, 1000.01, 'admin'), 'b');
  assert.equal(expectedApprover({ enabled: false }, 5000, 'admin'), 'admin');
  assert.equal(expectedApprover({ enabled: true, threshold: 0 }, 5000, 'admin'), '');
});

test('filtros combinam pessoa, categoria, setor, prioridade e prazo sem alterar registros', async () => {
  const { filterPurchases, PURCHASE_FILTERS } = await import('../src/purchaseFlow.js');
  const records = [
    { id: 'a', item: 'Luvas', requesterId: 'r', buyerId: 'b', department: 'Loja', category: 'Limpeza', priority: 'urgent', neededBy: '2026-11-01', status: 'requested', createdAt: 1 },
    { id: 'b', item: 'Caixas', requesterId: 'r', buyerId: 'c', department: 'Loja', category: 'Embalagens', priority: 'normal', neededBy: '2026-12-01', status: 'closed', createdAt: 2 },
  ];
  const filters = { ...PURCHASE_FILTERS, requester: 'r', responsible: 'b', category: 'Limpeza', department: 'Loja', priority: 'urgent', from: '2026-11-01', to: '2026-11-30', view: 'mine' };
  assert.deepEqual(filterPurchases(records, filters, 'JOAO', 'requested', [{ id:'b', name:'João' }], 'b', '2026-11-06').map(r => r.id), ['a']);
  assert.equal(filterPurchases(records, { ...filters, responsible: 'c' }).length, 0);
  assert.deepEqual(records.map(r => r.id), ['a','b']);
});

test('atrasos, falta de atribuição e categorias antigas ficam pesquisáveis', async () => {
  const { filterPurchases, PURCHASE_FILTERS, purchaseOverdue } = await import('../src/purchaseFlow.js');
  const rows = [{ id:'old', status:'requested', neededBy:'2026-11-01' }, { id:'closed', status:'closed', neededBy:'2026-11-01' }];
  assert.equal(purchaseOverdue(rows[1], '2026-11-06'), false);
  assert.equal(filterPurchases(rows, {...PURCHASE_FILTERS, view:'overdue'}, '', 'all', [], '', '2026-11-06').length, 1);
  assert.deepEqual(filterPurchases(rows, {...PURCHASE_FILTERS, view:'unassigned', category:'Sem categoria'}).map(r=>r.id), ['old']);
  assert.equal(Object.hasOwn(purchaseFields({item:'Antigo'}), 'category'), false);
  assert.equal(purchaseFields({category:'Limpeza'}).category, 'Limpeza');
});

test('erro de envio informa código e mantém orientação para recuperar os dados', async () => {
  const { purchaseSaveError } = await import('../src/purchaseFlow.js');
  assert.match(purchaseSaveError({code:'permission-denied'}), /permission-denied/);
  assert.match(purchaseSaveError({code:'unauthenticated'}), /sessão expirou/);
  assert.match(purchaseSaveError({code:'unavailable'}), /Confira a lista/);
});

test('aprovação envia somente os campos da etapa e orienta salvar cotação pendente', () => {
  const record = { ...fields, item:' Luvas ',status:'quotation',updatedAt:100,history:[],
    supplier:'Fornecedor',quotedPrice:1,expectedDate:'2026-11-18' };
  const patch = purchaseTransitionPatch(record,'approved',purchaseFields(record),people.approver,101);
  assert.equal(patch.approvedBy,'approver');
  assert.equal(patch.status,'approved');
  assert.equal(Object.hasOwn(patch,'item'),false);
  assert.equal(Object.hasOwn(patch,'supplier'),false);
  assert.throws(() => purchaseTransitionPatch(record,'approved',{...record,quotedPrice:2},people.approver,101),/Salvar dados/);
});

test('Financeiro devolve NF não conforme e recebimento corrige antes da conclusão', () => {
  const delivered = { ...fields, status:'delivered', updatedAt:100,history:[],supplier:'Fornecedor',quotedPrice:10,
    expectedDate:'2026-11-18',orderNumber:'OC',invoiceNumber:'NF-1',receivedQuantity:10,condition:'ok',
    storageAddress:'Prateleira',destinationRecipient:'Sala 1',buyerConfirmedAt:1,receiverConfirmedAt:2,
    invoiceReceivedAt:2,recipientConfirmedAt:3 };
  assert.throws(() => step(delivered,'finance_dispute',people.finance),/Descreva/);
  const issue = step(delivered,'finance_dispute',people.finance,{financeIssue:'CNPJ da NF incorreto'});
  assert.equal(issue.financeIssueBy,'finance');
  assert.equal(issue.financeResolutionAt,0);
  assert.throws(() => step(issue,'delivered',people.finance,{financeResolution:'NF corrigida'}),/responsável/);
  assert.throws(() => step(issue,'delivered',people.receiver),/Descreva/);
  const resolved = step(issue,'delivered',people.receiver,{invoiceNumber:'NF-2',financeResolution:'Fornecedor enviou NF corrigida'});
  assert.equal(resolved.recipientConfirmedAt,3);
  assert.equal(resolved.invoiceReceivedBy,'receiver');
  assert.ok(resolved.financeResolutionAt > resolved.financeIssueAt);
  const closed = step(resolved,'closed',people.finance);
  assert.equal(closed.financeConfirmedBy,'finance');
});

test('cotação recusada pode ser revista e reapresentada à alçada', () => {
  const quotation = {...fields,status:'quotation',updatedAt:100,history:[]};
  assert.throws(() => step(quotation,'rejected',{...people.approver,isAdmin:true}),/motivo/);
  const rejected = step(quotation,'rejected',{...people.approver,isAdmin:true},{note:'Rever preço e fornecedor'});
  assert.equal(rejected.history.at(-1).detail,'Rever preço e fornecedor');
  assert.throws(() => step(rejected,'quotation',people.receiver),/responsável/);
  const reviewed = step(rejected,'quotation',people.buyer,{supplier:'Fornecedor B',quotedPrice:10,expectedDate:'2026-11-18'});
  assert.equal(step(reviewed,'approved',people.approver).status,'approved');
});
