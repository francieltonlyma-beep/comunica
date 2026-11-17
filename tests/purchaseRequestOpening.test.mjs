import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { purchaseFields, validatePurchase, purchaseQuoteNumber, purchaseDisplayReference } from '../src/purchaseFlow.js';
const source=readFileSync(new URL('../src/PurchaseManagement.jsx',import.meta.url),'utf8');
const create=source.slice(source.indexOf('  async function createRequest('),source.indexOf('  async function saveGroupQuote(')).trim();
const base={item:'Coca cola',specification:'Garrafa',quantity:1,unit:'un',category:'Alimentos e bebidas',department:'Loja',destination:'Vila A',neededBy:'2026-11-23',reason:'Reposição',buyerId:'buyer'};
function context(overrides={}) {
 let writes=[],commits=0;
 const ctx={getFunctions:()=>({}),httpsCallable:()=>async()=>({data:{quoteNumber:'COT-000001'}}),setDuplicateSource(){},setFormAttempted(){},formRef:{current:null},form:base,extraItems:[{...base,item:'Água'}],sending:{current:false},user:{id:'admin',name:'Admin'},manager:true,buyerOptions:[{id:'buyer'}],policy:null,online:true,db:{},companyId:'company',appId:'comunica',currentTimestamp:()=>Date.UTC(2026,10,17,12),purchaseFields,validatePurchase,purchaseQuoteNumber,purchaseDisplayReference,INITIAL:{},
  setError:message=>{ctx.error=message;},setBusy(){},setNotice(){},setSelectedId(){},setForm(){},setExtraItems(){},setFormOpen(){},resetFilters(){},collection:()=>({}),doc:()=>({id:'id-'+writes.length+'-'+Math.random()}),writeBatch:()=>({set:(ref,data)=>writes.push({ref,data}),commit:async()=>{commits++;}}),...overrides};
 return {ctx,writes,commits:()=>commits,call:vm.runInNewContext('('+create+')',ctx)};
}
test('todos os itens nascem com o mesmo comprador e os participantes necessários',async()=>{
 const run=context();await run.call({preventDefault(){}});
 assert.equal(run.commits(),1);assert.equal(run.writes.length,2);
 for(const {data}of run.writes){assert.equal(data.buyerId,'buyer');assert.deepEqual(Array.from(data.participantIds),['admin','buyer']);assert.equal(data.status,'requested');assert.equal(data.orderNumber,data.quoteNumber);assert.equal(data.approverId,'');assert.equal(data.financeId,'');}
 assert.equal(run.writes[0].data.quoteNumber,run.writes[1].data.quoteNumber);
});
test('comprador autorizado pode iniciar por conta própria sem duplicar participante',async()=>{
 const run=context({user:{id:'buyer'},manager:false});await run.call({preventDefault(){}});
 assert.equal(run.commits(),1);assert.deepEqual(Array.from(run.writes[0].data.participantIds),['buyer']);
});
test('solicitante não atribui outra pessoa nem comprador fora da política',async()=>{
 for(const overrides of [{manager:false,user:{id:'requester'}},{buyerOptions:[]}]){const run=context(overrides);await run.call({preventDefault(){}});assert.equal(run.commits(),0);assert.match(run.ctx.error,/autorizado/);}
});
