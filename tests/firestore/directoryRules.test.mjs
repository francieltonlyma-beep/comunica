import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {doc,setDoc,getDoc,getDocs,collection,writeBatch,updateDoc} from 'firebase/firestore';
const env = await initializeTestEnvironment({projectId:'demo-comunica',firestore:{host:'127.0.0.1',port:8088,
  rules:readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8')}});
const base = 'artifacts/comunica-salvador/public/data/companies/tenant-a';
try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db,base),{name:'Teste'});
    await setDoc(doc(db,`${base}/users/employee`),{name:'Colaborador',emergencyPhone:'999999999',isAdmin:false});
    await setDoc(doc(db,`${base}/users/other`),{name:'Outra pessoa',emergencyPhone:'888888888',isAdmin:false});
    await setDoc(doc(db,`${base}/users/admin`),{name:'Admin',isAdmin:true});
    await setDoc(doc(db,`${base}/userDirectory/employee`),{id:'employee',name:'Colaborador'});
    await setDoc(doc(db,`${base}/userDirectory/other`),{id:'other',name:'Outra pessoa'});
  });
  const employee = env.authenticatedContext('employee',{companyId:'tenant-a'}).firestore();
  const admin = env.authenticatedContext('admin',{companyId:'tenant-a'}).firestore();
  await assertSucceeds(getDoc(doc(employee,`${base}/users/employee`)));
  await assertFails(getDoc(doc(employee,`${base}/users/other`)));
  await assertFails(getDocs(collection(employee,`${base}/users`)));
  await assertSucceeds(getDocs(collection(employee,`${base}/userDirectory`)));
  await assertFails(setDoc(doc(employee,`${base}/userDirectory/employee`),{id:'employee',name:'Forjado'}));
  await assertSucceeds(getDoc(doc(admin,`${base}/users/other`)));
  await assertSucceeds(updateDoc(doc(employee,`${base}/users/employee`),{emergencyPhone:'777777777'}));
  const batch=writeBatch(admin);
  batch.update(doc(admin,`${base}/users/other`),{name:'Nome novo'});
  batch.set(doc(admin,`${base}/userDirectory/other`),{id:'other',name:'Nome novo'},{merge:true});
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(employee,`${base}/userDirectory/other`)));
  await assertFails(setDoc(doc(admin,`${base}/userDirectory/other`),{id:'other',emergencyPhone:'vazou'}));
  await assertFails(getDocs(collection(env.authenticatedContext('outsider',{companyId:'another'}).firestore(),`${base}/userDirectory`)));
  console.log('PASS: diretório público não expõe o cadastro privado dos colaboradores');
} finally { await env.cleanup(); }
