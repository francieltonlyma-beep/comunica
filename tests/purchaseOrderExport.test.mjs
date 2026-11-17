import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPurchaseOrders, purchaseOrderHTML, purchaseOrderDate } from '../src/purchaseOrderExport.js';
const base = {id:'a',status:'ordered',quoteNumber:'COT-000001',supplier:'Fornecedor A',item:'Maçã',specification:'Caixa <especial>',quantity:2,unit:'cx',quotedPrice:10,destination:'Matriz',department:'Loja',createdAt:Date.UTC(2026,0,1),buyerConfirmedAt:Date.UTC(2026,10,17,12),expectedDate:'2026-11-19'};
const records = [base,{...base,id:'b',supplier:'Fornecedor B',quotedPrice:20},{...base,id:'c',status:'quotation'},{...base,id:'d',quoteNumber:'COT-000002',item:'Banana',buyerConfirmedAt:Date.UTC(2026,10,18,12)}];
test('exporta apenas pedidos emitidos e combina fornecedor, produto, cotação e data de emissão',()=>{
  assert.equal(filterPurchaseOrders(records).length,3);
  const filtered=filterPurchaseOrders(records,{supplier:'Fornecedor A',product:'maca',from:'2026-11-17',to:'2026-11-17',quote:'COT-000001'});
  assert.deepEqual(filtered,[base]);
  assert.equal(purchaseOrderDate(base),'2026-11-17');
  assert.equal(purchaseOrderDate({...base,buyerConfirmedAt:Date.UTC(2026,10,18,1)}),'2026-11-17');
});
test('separa fornecedores por página, preserva número da cotação, calcula totais filtrados e escapa HTML',()=>{
  const html=purchaseOrderHTML(records,'Empresa <teste>',{product:'maçã'});
  assert.equal((html.match(/<article>/g)||[]).length,2);
  assert.match(html,/Pedido de compra · COT-000001/);
  assert.match(html,/Caixa &lt;especial&gt;/);
  assert.match(html,/Empresa &lt;teste&gt;/);
  assert.doesNotMatch(html,/COT-000002/);
  assert.match(html,/20,00/);assert.match(html,/40,00/);
  assert.throws(()=>purchaseOrderHTML(records,'Empresa',{supplier:'inexistente'}),/Nenhum pedido/);
});

test('comparativo conjunto não classifica fornecedor com item ausente como mais barato',async()=>{
 const {purchaseComparison}=await import('../src/purchaseComparison.js');
 const items=[{id:'a',quantity:2},{id:'b',quantity:3}];
 const offer=(supplierId,totalCents,availableQuantity)=>({supplierId,supplier:supplierId,totalCents,availableQuantity,available:true});
 const rows=purchaseComparison(items,{a:[offer('complete',1000,2),offer('partial',100,2)],b:[offer('complete',2000,3)]});
 assert.equal(rows.find(r=>r.id==='complete').totalCents,3000);
 assert.equal(rows.find(r=>r.id==='complete').complete,true);
 assert.equal(rows.find(r=>r.id==='partial').complete,false);
});
