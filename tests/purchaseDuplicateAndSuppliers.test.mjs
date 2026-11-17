import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/PurchaseManagement.jsx',import.meta.url),'utf8');
const duplicate=source.slice(source.indexOf('  const duplicateRequest ='),source.indexOf('  const beginDetail')).replace('const duplicateRequest =','').trim().replace(/;$/,'');
test('duplicar pelo segundo item copia o grupo em ordem, limpa prazo e não reutiliza comprovantes',()=>{
  let form,extra,opened=false;
  const records=[{id:'second',bundleId:'group',bundleIndex:2,item:'Segundo',quantity:3,neededBy:'2020-01-01',approvedAt:123},{id:'first',bundleId:'group',bundleIndex:1,item:'Primeiro',buyerId:'buyer',quoteNumber:'COT-000001'}];
  const initial={item:'',buyerId:'',neededBy:''};
  vm.runInNewContext(`(${duplicate})`,{selected:records[0],records,canRequest:true,INITIAL:initial,manager:true,buyerOptions:[{id:'buyer'}],defaultBuyerId:'',setForm:v=>form=v,setExtraItems:v=>extra=v,setDuplicateSource(){},setError(){},setNotice(){},setFormOpen:v=>opened=v})();
  assert.equal(form.item,'Primeiro');assert.equal(form.buyerId,'buyer');assert.equal(form.neededBy,'');assert.equal(form.approvedAt,undefined);assert.equal(form.quoteNumber,undefined);assert.equal(extra[0].item,'Segundo');assert.equal(opened,true);
});
const workspace=readFileSync(new URL('../src/PurchaseWorkspace.jsx',import.meta.url),'utf8');
const generate=workspace.slice(workspace.indexOf('  async function generateLinks()'),workspace.indexOf('  const comparable =')).trim();
test('gera um link isolado por fornecedor e mantém sucessos quando outro fornecedor falha',async()=>{
 let links=[],errors='',busy=false;const calls=[];
 const ctx={busy:false,online:true,supplierIds:['a','b'],companyId:'company',selected:{id:'r',bundleId:'bundle'},user:{id:'buyer'},records:[{id:'r',bundleId:'bundle',buyerId:'buyer',status:'requested'},{id:'s',bundleId:'bundle',buyerId:'buyer',status:'quotation'},{id:'foreign',bundleId:'else',buyerId:'buyer',status:'requested'}],suppliers:[{id:'b',name:'B'}],window:{location:{origin:'https://comunica.test'}},setBusy:v=>busy=v,onError:v=>errors=v,onNotice(){},setLinks:fn=>links=fn(links),callable:async data=>{calls.push(data);if(data.supplierId==='b')throw Error('falhou');return {data:{token:'token-a',supplier:'A'}};}};
 await vm.runInNewContext(`(${generate})`,ctx)();
 assert.equal(calls.length,2);assert.deepEqual(Array.from(calls[0].requestIds),['r','s']);assert.equal(calls[1].supplierId,'b');assert.equal(links[0].url,'https://comunica.test/cotacao#token-a');assert.match(errors,/B: falhou/);assert.equal(busy,false);
});
