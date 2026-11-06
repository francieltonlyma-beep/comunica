import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc, collection, addDoc} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {purchaseFields, purchaseTransition} from '../../src/purchaseFlow.js';
const env = await initializeTestEnvironment({projectId:'demo-comunica',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync(new URL('../../firestore.rules', import.meta.url),'utf8')}});
const base='artifacts/comunica-salvador/public/data/companies/company-a';
await env.withSecurityRulesDisabled(async ctx => {
 const db=ctx.firestore();
 await setDoc(doc(db,base+'/users/employee'),{name:'Colaborador',isAdmin:false});
 await setDoc(doc(db,base+'/settings/integra-access'),{enabled:true});
});
const db=env.authenticatedContext('employee',{companyId:'company-a'}).firestore();
const now=Date.now();
const fields=purchaseFields({item:'Luvas',specification:'Tam M',quantity:1,unit:'cx',department:'Loja',destination:'Vila A',neededBy:'2026-11-10',reason:'Reposição',category:'Limpeza e higiene'});
const data={...fields,status:'requested',requesterId:'employee',requesterName:'Colaborador',createdAt:now,updatedAt:now,updatedBy:'employee',workflowVersion:2,participantIds:['employee'],history:[{stage:'requested',by:'employee',byName:'Colaborador',at:now}]};
await assertSucceeds(addDoc(collection(db,base+'/purchaseRequests'),data));
console.log('PASS: colaborador envia solicitação com categoria');
const legacy={...data};
delete legacy.category;
await assertSucceeds(addDoc(collection(db,base+'/purchaseRequests'),legacy));
console.log('PASS: payload atual sem categoria continua válido');
await assertFails(addDoc(collection(env.authenticatedContext('employee',{companyId:'other'}).firestore(),base+'/purchaseRequests'),data));
await assertFails(addDoc(collection(db,base+'/purchaseRequests'),{...data,requesterId:'other'}));
console.log('PASS: acesso entre empresas e solicitante forjado bloqueados');
// Exercise the existing write path too: assignment, quotation and the required atestes.
const ref = await addDoc(collection(db,base+'/purchaseRequests'),data);
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
 ['closed','employee',{}],
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
await env.cleanup();
