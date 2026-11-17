import { normalizeSearch } from '../functions/src/procurement.mjs';
import { purchaseQuoteNumber } from './purchaseFlow.js';
import { PAYMENT_METHODS, PAYMENT_BASES } from './purchasePaymentOptions.js';
const ORDER_STAGES = new Set(['ordered','in_transit','received','exception','stored','delivered','finance_dispute','closed']);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const date = value => value ? String(value).split('-').reverse().join('/') : '—';
export function purchaseOrderDate(record) {
  const ordered = (record.history || []).find(h => h.stage === 'ordered')?.at;
  const value = Number(record.buyerConfirmedAt || ordered || record.createdAt);
  return Number.isFinite(value) ? new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date(value)) : '';
}
export function filterPurchaseOrders(records, {supplier = '', product = '', from = '', to = '', quote = ''} = {}) {
  return records.filter(record => ORDER_STAGES.has(record.status) &&
    (!supplier || record.supplier === supplier) &&
    (!quote || (record.quoteNumber || record.bundleId || record.id) === quote) &&
    (!product || normalizeSearch(`${record.item} ${record.specification}`).includes(normalizeSearch(product))) &&
    (!from || purchaseOrderDate(record) >= from) && (!to || purchaseOrderDate(record) <= to));
}
export function purchaseOrderHTML(records, companyName, filters = {}) {
  const groups = new Map();
  for (const record of filterPurchaseOrders(records, filters)) {
    const reference = record.quoteNumber || purchaseQuoteNumber(record.createdAt,record.bundleId || record.id);
    const key = JSON.stringify([reference,record.supplier]);
    if (!groups.has(key)) groups.set(key,{reference,supplier:record.supplier,items:[]});
    groups.get(key).items.push(record);
  }
  if (!groups.size) throw new Error('Nenhum pedido emitido corresponde aos filtros.');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pedidos de compra</title><style>body{font:14px Arial,sans-serif;color:#173747;margin:32px}header{border-bottom:3px solid #176578}h1{font-size:24px}h2{font-size:19px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;border-bottom:1px solid #dce5e8;padding:10px;vertical-align:top}th{background:#eef5f6}small{display:block;margin-top:5px;color:#536c78}article{margin-bottom:40px;break-after:page}article:last-child{break-after:auto}.total{text-align:right;font-size:18px}@media print{body{margin:12mm}tr{break-inside:avoid}thead{display:table-header-group}}</style></head><body>${[...groups.values()].map(group => `<article><header><p>${escape(companyName || 'Comunica Integra')}</p><h1>Pedido de compra · ${escape(group.reference)}</h1><p>Referência da cotação: ${escape(group.reference)}</p></header><h2>Fornecedor: ${escape(group.supplier)}</h2><p>Emissão: ${date(purchaseOrderDate(group.items[0]))} · Solicitante: ${escape(group.items[0].requesterName)}</p><table><thead><tr><th>Produto / especificação</th><th>Quantidade</th><th>Preço unitário*</th><th>Total</th><th>Entrega / destino</th></tr></thead><tbody>${group.items.map(p => `<tr><td>${escape(p.item)}<small>${escape(p.specification)}</small></td><td>${escape(p.quantity)} ${escape(p.unit)}</td><td>${money(p.quotedPrice)}</td><td>${money(Number(p.quotedPrice) * Number(p.quantity))}</td><td>${date(p.expectedDate)}<small>${escape(p.destination)} · ${escape(p.department)}</small></td></tr>`).join('')}</tbody></table><p class="total"><strong>Total dos itens exibidos: ${money(group.items.reduce((sum,p) => sum + Number(p.quotedPrice) * Number(p.quantity),0))}</strong></p><small>* Custo unitário acordado, incluindo frete e desconto quando registrados na proposta.</small>${group.items.map(p => {const o = p.procurement?.offer; const plan = o?.paymentPlan; return plan ? `<p><strong>${escape(p.item)} · pagamento:</strong> ${escape(PAYMENT_METHODS[plan.method] || plan.method)} · Base: ${escape(PAYMENT_BASES[plan.basis] || plan.basis)}<br>${(plan.installments || []).map((i,index) => `${index+1}ª: ${money(i.amount)} · ${i.dueDate ? date(i.dueDate) : `${escape(i.days ?? i.offsetDays ?? '')} dias`}`).join(' / ')}<small>Frete do item: ${money(o.freight)} · Desconto: ${money(o.discount)}</small></p>` : '';}).join('')}<small>Filtros: fornecedor ${escape(filters.supplier || 'todos')}; produto ${escape(filters.product || 'todos')}; emissão de ${date(filters.from)} até ${date(filters.to)}. O total considera apenas os itens exibidos.</small></article>`).join('')}</body></html>`;
}
