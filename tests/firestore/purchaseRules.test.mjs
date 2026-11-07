import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc, collection, addDoc, writeBatch} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {purchaseFields, purchaseTransition, purchaseTransitionPatch, purchaseDataPatch} from '../../src/purchaseFlow.js';
const env = await initializeTestEnvironment({projectId:'demo-comunica',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync(new URL('../../firestore.rules', import.meta.url),'utf8')}});
const base='artifacts/comunica-salvador/public/data/companies/company-a';
await env.withSecurityRulesDisabled(async ctx => {
 const db=ctx.firestore();
 await setDoc(doc(db,base),{name:'Empresa teste',codeBlocked:false});
 await setDoc(doc(db,base+'/users/employee'),{name:'Colaborador',isAdmin:false});
 await setDoc(doc(db,base+'/settings/integra-access'),{enabled:true});
});
const db=env.authenticatedContext('employee',{companyId:'company-a'}).firestore();
const now=Date.now();
const fields=purchaseFields({item:'Luvas',specification:'Tam M',quantity:1,unit:'cx',department:'Loja',destination:'Vila A',neededBy:'2026-11-10',reason:'Reposição',category:'Limpeza e higiene'});
const data={...fields,status:'requested',requesterId:'employee',requesterName:'Colaborador',createdAt:now,updatedAt:now,updatedBy:'employee',workflowVersion:2,participantIds:['employee'],history:[{stage:'requested',by:'employee',byName:'Colaborador',at:now}]};
await assertSucceeds(addDoc(collection(db,base+'/purchaseRequests'),data));
console.log('PASS: colaborador envia solicitação com categoria');
const bundled = [doc(collection(db,base+'/purchaseRequests')),doc(collection(db,base+'/purchaseRequests'))];
const batch = writeBatch(db);
bundled.forEach((reference,index) => batch.set(reference,{...data,item:index ? 'Caixas' : 'Luvas',
 bundleId:bundled[0].id,bundleSize:2,bundleIndex:index+1}));
await assertSucceeds(batch.commit());
console.log('PASS: solicitação de vários itens gravada atomicamente');
const legacy={...data};
delete legacy.category;
await assertSucceeds(addDoc(collection(db,base+'/purchaseRequests'),legacy));
console.log('PASS: payload atual sem categoria continua válido');
await assertFails(addDoc(collection(env.authenticatedContext('employee',{companyId:'other'}).firestore(),base+'/purchaseRequests'),data));
await assertFails(addDoc(collection(db,base+'/purchaseRequests'),{...data,requesterId:'other'}));
console.log('PASS: acesso entre empresas e solicitante forjado bloqueados');
// Exercise the existing write path too: assignment, quotation and the required atestes.
const ref = await addDoc(collection(db,base+'/purchaseRequests'),data);
await assertFails(addDoc(collection(db,base+'/purchaseRequests',ref.id,'files'),{name:'NF.pdf',contentType:'application/pdf',size:123,
 storagePath:'companies/company-b/users/employee/attachments/test.pdf',stage:'requested',createdAt:now,createdBy:'employee'}));
await assertSucceeds(addDoc(collection(db,base+'/purchaseRequests',ref.id,'files'),{name:'NF.pdf',contentType:'application/pdf',size:123,
 storagePath:'companies/company-a/users/employee/attachments/test.pdf',stage:'requested',createdAt:now,createdBy:'employee'}));
console.log('PASS: arquivo vinculado à compra da empresa correta');
await env.withSecurityRulesDisabled(async ctx => {
 await setDoc(doc(ctx.firestore(),base+'/users/admin'),{name:'Admin',isAdmin:true});
});
const managerDb = env.authenticatedContext('admin',{companyId:'company-a'}).firestore();
const {getDoc, updateDoc} = await import('firebase/firestore');
await assertFails(updateDoc(ref, { buyerId:'employee', participantIds:['employee'], updatedAt:now+1, updatedBy:'employee', history:[{stage:'requested',by:'employee',at:now+1}] }));
await assertFails(updateDoc(doc(managerDb,ref.path), { quantity:999, updatedAt:now+1, updatedBy:'admin', history:[{stage:'requested',by:'admin',at:now+1}] }));
let current = (await getDoc(ref)).data();
await assertSucceeds(updateDoc(doc(managerDb,ref.path), {
 buyerId:'employee', approverId:'admin', receiverId:'employee', recipientId:'employee', financeId:'employee',
 participantIds:['employee','admin'], updatedAt:now+1, updatedBy:'admin',
 history:[...current.history,{stage:'requested',by:'admin',at:now+1}],
}));
current = (await getDoc(ref)).data();
for (const [stage,actor,fields] of [
 ['quotation','employee',{}],
 ['approved','admin',{supplier:'Fornecedor',quotedPrice:10,expectedDate:'2026-11-09'}],
 ['ordered','employee',{orderNumber:'OC-1'}],
 ['received','employee',{invoiceNumber:'NF-1',receivedQuantity:1,condition:'ok'}],
 ['stored','employee',{storageAddress:'Prateleira A'}],
 ['delivered','employee',{destinationRecipient:'Colaborador'}],
 ['closed','employee',{invoiceTotal:10}],
]) {
 if (stage === 'approved') {
   await assertSucceeds(updateDoc(ref, {...fields, updatedAt: current.updatedAt+1, updatedBy:'employee', history:[...current.history,{stage:'quotation',by:'employee',at:current.updatedAt+1}]}));
   current=(await getDoc(ref)).data();
 }
 const patch=purchaseTransition(current,stage,{...current,...fields},{id:actor,name:actor},current.updatedAt+1);
 const wrongActor = actor === 'admin' ? 'employee' : 'admin';
 const forged = {...patch, updatedBy:wrongActor, history:[...current.history,{stage,by:wrongActor,at:patch.updatedAt}]};
 await assertFails(updateDoc(doc(wrongActor === 'admin' ? managerDb : db,ref.path),forged));
 await assertSucceeds(updateDoc(doc(actor === 'admin' ? managerDb : db,ref.path),patch));
 current=(await getDoc(ref)).data();
 console.log('PASS: etapa '+stage);
}
const oldRecord = {...legacy, workflowVersion:0};
for (const key of ['participantIds','buyerId','approverId','receiverId','recipientId','financeId']) delete oldRecord[key];
await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(),base+'/purchaseRequests/legacy'),oldRecord));
await assertSucceeds(updateDoc(doc(managerDb,base+'/purchaseRequests/legacy'), {
 workflowVersion:2, status:'requested', participantIds:['employee'], buyerId:'',approverId:'',receiverId:'',recipientId:'',financeId:'',
 updatedAt:now+100,updatedBy:'admin',history:[...oldRecord.history,{stage:'requested',by:'admin',at:now+100}],
}));
console.log('PASS: registro anterior migra sem alterar os dados da solicitação');
// Reproduce the UI payload when the requester is also an administrator and buyer.
const actorAdmin={id:'admin',name:'Administrador comprador',isAdmin:true};
const adminData={...data,requesterId:'admin',requesterName:actorAdmin.name,updatedBy:'admin',participantIds:['admin'],history:[{stage:'requested',by:'admin',at:now}]};
const adminRef=await assertSucceeds(addDoc(collection(managerDb,base+'/purchaseRequests'),adminData));
const {runTransaction}=await import('firebase/firestore');
await env.withSecurityRulesDisabled(async ctx=>{
 for (const [id,isAdmin] of [['approver',true],['receiver',false],['recipient',false],['finance',false]]) {
  await setDoc(doc(ctx.firestore(),base+'/users/'+id),{name:id,isAdmin});
 }
});
const assignments={buyerId:'admin',approverId:'approver',receiverId:'receiver',recipientId:'recipient',financeId:'finance'};
async function uiCommit(database, actor, stage='', edits={}) {
 await runTransaction(database, async transaction=>{
  const target=doc(database,adminRef.path);
  const before=(await transaction.get(target)).data();
  const draft=purchaseFields({...before,...edits});
  const updatedAt=before.updatedAt+1;
  const patch=stage ? purchaseTransitionPatch(before,stage,draft,actor,updatedAt)
   : purchaseDataPatch(before,draft,Boolean(actor.isAdmin),actor,updatedAt);
  transaction.update(target,patch);
 });
}
await assertSucceeds(uiCommit(managerDb,actorAdmin,'',assignments));
console.log('PASS: administrador solicitante salva todos os responsáveis com o payload da interface');
// Existing requests can contain legitimate values that the form normalizes on read.
// Saving the full form would attempt to mutate immutable request fields.
const existing={...adminData,item:' Luvas ',updatedAt:now+200,createdAt:now+200,
 history:[{stage:'requested',by:'admin',byName:actorAdmin.name,at:now+200}]};
await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),base+'/purchaseRequests/existing'),existing));
const existingRef=doc(managerDb,base+'/purchaseRequests/existing');
await assertFails(updateDoc(existingRef,{...purchaseFields(existing),buyerId:'admin',participantIds:['admin'],
 updatedAt:now+201,updatedBy:'admin',history:[...existing.history,{stage:'requested',by:'admin',at:now+201}]}));
const leanPatch=purchaseDataPatch(existing,{...purchaseFields(existing),buyerId:'admin'},true,actorAdmin,now+201);
if ('item' in leanPatch || !('buyerId' in leanPatch)) throw new Error('A gravação incluiu campos imutáveis ou omitiu o comprador.');
await assertSucceeds(updateDoc(existingRef,leanPatch));
if (purchaseDataPatch((await getDoc(existingRef)).data(),purchaseFields((await getDoc(existingRef)).data()),true,actorAdmin,now+202) !== null) {
 throw new Error('Salvar sem alterações precisa evitar uma gravação desnecessária.');
}
console.log('PASS: salvar dados antigos altera apenas os campos editados');
await assertSucceeds(uiCommit(managerDb,actorAdmin,'',{note:'Observação antes da cotação'}));
await assertSucceeds(uiCommit(managerDb,actorAdmin,'quotation'));
console.log('PASS: administrador comprador avança para cotação');
await assertSucceeds(uiCommit(managerDb,actorAdmin,'',{supplier:'Fornecedor',quotedPrice:10,expectedDate:'2026-11-09'}));
for (const [stage,id,edits] of [
 ['approved','approver',{}],['ordered','admin',{orderNumber:'OC-ADMIN'}],
 ['received','receiver',{invoiceNumber:'NF-ADMIN',receivedQuantity:1,condition:'ok'}],
 ['stored','receiver',{storageAddress:'Prateleira A'}],['delivered','recipient',{destinationRecipient:'Destinatário'}],['closed','finance',{invoiceTotal:10}],
]) {
 const actor=id==='admin'?actorAdmin:{id,name:id,isAdmin:id==='approver'};
 const actorDb=env.authenticatedContext(id,{companyId:'company-a'}).firestore();
 await assertSucceeds(uiCommit(actorDb,actor,stage,edits));
 console.log('PASS: transação da interface na etapa '+stage);
}
// The production screenshot has the requester, buyer, approver and every other
// assigned role pointing to the same administrator.
const selfRef=await assertSucceeds(addDoc(collection(managerDb,base+'/purchaseRequests'),adminData));
const selfFields={...purchaseFields(adminData),buyerId:'admin',approverId:'admin',receiverId:'admin',recipientId:'admin',financeId:'admin'};
await assertSucceeds(updateDoc(selfRef,{...selfFields,participantIds:['admin'],updatedAt:now+1,updatedBy:'admin',
 history:[...adminData.history,{stage:'requested',by:'admin',at:now+1}]}));
let self=(await getDoc(selfRef)).data();
await assertSucceeds(updateDoc(selfRef,purchaseTransition(self,'quotation',self,actorAdmin,now+2)));
self=(await getDoc(selfRef)).data();
await assertSucceeds(updateDoc(selfRef,purchaseDataPatch(self,{...self,supplier:'Fornecedor',quotedPrice:1,expectedDate:'2026-11-10'},true,actorAdmin,now+3)));
self=(await getDoc(selfRef)).data();
await assertSucceeds(updateDoc(selfRef,purchaseTransitionPatch(self,'approved',self,actorAdmin,now+4)));
console.log('PASS: administrador comprador e aprovador aprova sua própria cotação');
await assertSucceeds(setDoc(doc(managerDb,base+'/settings/purchase-approval'),{
 enabled:false,threshold:1000,lowerApproverId:'admin',upperApproverId:'admin',preventSelfApproval:true,
 updatedAt:now+4,updatedBy:'admin',
}));
const separationRef=await assertSucceeds(addDoc(collection(managerDb,base+'/purchaseRequests'),adminData));
await assertSucceeds(updateDoc(separationRef,{buyerId:'admin',approverId:'admin',participantIds:['admin'],updatedAt:now+5,updatedBy:'admin',
 history:[...adminData.history,{stage:'requested',by:'admin',at:now+5}]}));
let separated=(await getDoc(separationRef)).data();
await assertSucceeds(updateDoc(separationRef,purchaseTransitionPatch(separated,'quotation',separated,actorAdmin,now+6)));
separated=(await getDoc(separationRef)).data();
await assertSucceeds(updateDoc(separationRef,purchaseDataPatch(separated,{...separated,supplier:'Fornecedor',quotedPrice:1,expectedDate:'2026-11-10'},true,actorAdmin,now+7)));
separated=(await getDoc(separationRef)).data();
await assertFails(updateDoc(separationRef,purchaseTransitionPatch(separated,'approved',separated,actorAdmin,now+8)));
console.log('PASS: separação de funções impede autoaprovação quando ativada');
await assertSucceeds(setDoc(doc(managerDb,base+'/settings/purchase-approval'),{
 enabled:false,threshold:1000,lowerApproverId:'admin',upperApproverId:'admin',preventSelfApproval:false,
 updatedAt:now+9,updatedBy:'admin',
}));
const spaced={...self,item:' Teste ',status:'quotation',approvedBy:'',approvedAt:0,updatedAt:now+500,
 history:[{stage:'quotation',by:'admin',byName:actorAdmin.name,at:now+500}]};
await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),base+'/purchaseRequests/spaced'),spaced));
const spacedRef=doc(managerDb,base+'/purchaseRequests/spaced');
await assertFails(updateDoc(spacedRef,purchaseTransition(spaced,'approved',purchaseFields(spaced),actorAdmin,now+501)));
await assertSucceeds(updateDoc(spacedRef,purchaseTransitionPatch(spaced,'approved',purchaseFields(spaced),actorAdmin,now+501)));
console.log('PASS: aprovação mantém campos originais da solicitação intactos');
const closedAdmin=(await getDoc(adminRef)).data();
const financial={...closedAdmin,status:'delivered',updatedAt:now+900,updatedBy:'recipient',
 history:[{stage:'delivered',by:'recipient',at:now+900}]};
delete financial.financeConfirmedBy;
delete financial.financeConfirmedAt;
await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),base+'/purchaseRequests/financial'),financial));
const financialRef=doc(managerDb,base+'/purchaseRequests/financial');
const financeActor={id:'finance',name:'Financeiro'};
const financeDb=env.authenticatedContext('finance',{companyId:'company-a'}).firestore();
const receiverActor={id:'receiver',name:'Recebimento'};
const receiverDb=env.authenticatedContext('receiver',{companyId:'company-a'}).firestore();
let financialCurrent=(await getDoc(financialRef)).data();
let issuePatch=purchaseTransitionPatch(financialCurrent,'finance_dispute',{...financialCurrent,financeIssue:'CNPJ divergente'},financeActor,now+901);
await assertFails(updateDoc(doc(receiverDb,financialRef.path),issuePatch));
await assertSucceeds(updateDoc(doc(financeDb,financialRef.path),issuePatch));
financialCurrent=(await getDoc(financialRef)).data();
await assertFails(updateDoc(doc(financeDb,financialRef.path),{status:'closed',updatedAt:now+902,updatedBy:'finance',
 financeConfirmedBy:'finance',financeConfirmedAt:now+902,
 history:[...financialCurrent.history,{stage:'closed',by:'finance',at:now+902}]}));
const fixPatch=purchaseTransitionPatch(financialCurrent,'delivered',{...financialCurrent,invoiceNumber:'NF-CORRIGIDA',financeResolution:'Fornecedor emitiu NF corrigida'},receiverActor,now+902);
await assertFails(updateDoc(doc(financeDb,financialRef.path),fixPatch));
await assertSucceeds(updateDoc(doc(receiverDb,financialRef.path),fixPatch));
financialCurrent=(await getDoc(financialRef)).data();
await assertFails(updateDoc(doc(financeDb,financialRef.path),purchaseTransitionPatch(financialCurrent,'closed',{...financialCurrent,invoiceTotal:12},financeActor,now+903)));
await assertSucceeds(updateDoc(doc(financeDb,financialRef.path),purchaseTransitionPatch(financialCurrent,'closed',{...financialCurrent,invoiceTotal:10},financeActor,now+903)));
console.log('PASS: Financeiro devolve NF, recebimento corrige e Financeiro conclui');
const quotationForReview={...adminData,buyerId:'admin',approverId:'approver',receiverId:'receiver',recipientId:'recipient',financeId:'finance',
 participantIds:['admin','approver','receiver','recipient','finance'],status:'quotation',updatedAt:now+1000,
 history:[{stage:'quotation',by:'admin',at:now+1000}]};
await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),base+'/purchaseRequests/review'),quotationForReview));
const reviewRef=doc(managerDb,base+'/purchaseRequests/review');
let reviewCurrent=(await getDoc(reviewRef)).data();
await assertSucceeds(updateDoc(reviewRef,purchaseTransitionPatch(reviewCurrent,'rejected',{...reviewCurrent,note:'Nova cotação necessária'},actorAdmin,now+1001)));
reviewCurrent=(await getDoc(reviewRef)).data();
await assertSucceeds(updateDoc(reviewRef,purchaseTransitionPatch(reviewCurrent,'quotation',{...reviewCurrent,supplier:'Outro fornecedor',quotedPrice:11,expectedDate:'2026-11-10'},actorAdmin,now+1002)));
reviewCurrent=(await getDoc(reviewRef)).data();
const approverDb=env.authenticatedContext('approver',{companyId:'company-a'}).firestore();
await assertSucceeds(updateDoc(doc(approverDb,reviewRef.path),purchaseTransitionPatch(reviewCurrent,'approved',reviewCurrent,{id:'approver',name:'Aprovador'},now+1003)));
console.log('PASS: recusa com motivo, revisão da cotação e nova aprovação');
const rejectedUnassigned={...adminData,status:'rejected',note:'Dados insuficientes',updatedAt:now+1100,
 history:[{stage:'rejected',by:'admin',at:now+1100,detail:'Dados insuficientes'}]};
await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),base+'/purchaseRequests/reopen'),rejectedUnassigned));
const reopenRef=doc(managerDb,base+'/purchaseRequests/reopen');
await assertFails(updateDoc(doc(db,reopenRef.path),purchaseTransitionPatch(rejectedUnassigned,'requested',rejectedUnassigned,{id:'employee',name:'Colaborador',isAdmin:true},now+1101)));
await assertSucceeds(updateDoc(reopenRef,purchaseTransitionPatch(rejectedUnassigned,'requested',rejectedUnassigned,actorAdmin,now+1101)));
console.log('PASS: administração reabre recusa sem comprador para novas atribuições');
await env.cleanup();
