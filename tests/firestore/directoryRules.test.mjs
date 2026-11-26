import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {doc,setDoc,getDoc,getDocs,collection,writeBatch,updateDoc,deleteDoc} from 'firebase/firestore';
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
    await setDoc(doc(db,`${base}/users/recruiter`),{name:'Recrutadora',dept:'Recursos Humanos'});
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
  await assertSucceeds(updateDoc(doc(employee,`${base}/users/employee`),{'notificationPreferences.inbox':false}));
  await assertSucceeds(updateDoc(doc(admin,`${base}/users/admin`),{'notificationPreferences.careers':true}));
  await assertFails(updateDoc(doc(employee,`${base}/users/employee`),{'notificationPreferences.inbox':'false'}));
  await assertFails(updateDoc(doc(employee,`${base}/users/employee`),{'notificationPreferences.unknown':false}));
  await assertFails(updateDoc(doc(admin,`${base}/users/employee`),{'notificationPreferences.inbox':true}));
  await assertFails(setDoc(doc(employee,'_platformNotificationPreferences/employee'),{notificationPreferences:{inbox:false}}));
  const batch=writeBatch(admin);
  batch.update(doc(admin,`${base}/users/other`),{name:'Nome novo'});
  batch.set(doc(admin,`${base}/userDirectory/other`),{id:'other',name:'Nome novo'},{merge:true});
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(employee,`${base}/userDirectory/other`)));
  await assertFails(setDoc(doc(admin,`${base}/userDirectory/other`),{id:'other',emergencyPhone:'vazou'}));
  await assertFails(getDocs(collection(env.authenticatedContext('outsider',{companyId:'another'}).firestore(),`${base}/userDirectory`)));
  const recruiter = env.authenticatedContext('recruiter',{companyId:'tenant-a'}).firestore();
  const externalRecruiter = env.authenticatedContext('recruiter',{companyId:'tenant-b'}).firestore();
  const candidate = env.unauthenticatedContext().firestore();
  const library = db => collection(db, `${base}/careerVacancyLibrary`);
  const item = db => doc(library(db), 'benefit-a');
  await assertSucceeds(setDoc(item(recruiter), {category:'benefits',text:'Vale-alimentação'}));
  await assertSucceeds(getDocs(library(recruiter)));
  await assertSucceeds(getDocs(library(admin)));
  await assertSucceeds(updateDoc(item(admin), {text:'Vale-alimentação mensal'}));
  await assertFails(updateDoc(item(recruiter), {category:'outra'}));
  await assertFails(updateDoc(item(recruiter), {text:'a'.repeat(241)}));
  await assertFails(getDocs(library(employee)));
  await assertFails(getDocs(library(externalRecruiter)));
  await assertFails(getDocs(library(candidate)));
  await assertFails(deleteDoc(item(employee)));
  await assertSucceeds(deleteDoc(item(recruiter)));
  const author = env.authenticatedContext('other',{companyId:'tenant-a'}).firestore();
  const activity = db => doc(db, base, 'activities', 'service-activity');
  const message = db => doc(db, base, 'messages', 'service-message');
  const activityData = { createdBy: 'other', status: 'pending', source: 'standalone', assigneeIds: [],
    collaborators: { recruiter: { status: 'invited', invitedAt: 1 } } };
  await assertFails(setDoc(activity(employee), activityData));
  await assertSucceeds(setDoc(activity(author), activityData));
  await assertFails(updateDoc(activity(employee), { status: 'resolved' }));
  await assertFails(updateDoc(activity(recruiter), { status: 'resolved' }));
  await assertFails(updateDoc(activity(author), { createdBy: 'employee' }));
  await assertSucceeds(updateDoc(activity(recruiter), {
    'collaborators.recruiter.status': 'accepted', 'collaborators.recruiter.respondedAt': 2,
    history: [{ actorId: 'recruiter' }], updatedBy: 'recruiter', updatedAt: 2,
  }));
  await assertSucceeds(updateDoc(activity(recruiter), { status: 'in_progress' }));
  await assertSucceeds(updateDoc(activity(admin), { assigneeIds: ['employee'] }));
  await assertSucceeds(updateDoc(activity(employee), { status: 'resolved' }));
  await assertFails(deleteDoc(activity(employee)));
  await assertSucceeds(setDoc(message(author), { senderId: 'other', participants: ['other', 'employee'], activity: null }));
  await assertFails(updateDoc(message(employee), { activity: { createdBy: 'employee', status: 'pending' } }));
  await assertSucceeds(updateDoc(message(author), { activity: { createdBy: 'other', status: 'pending' } }));
  await assertFails(updateDoc(message(employee), { 'activity.status': 'resolved' }));
  await assertSucceeds(updateDoc(message(author), { 'activity.assigneeIds': ['employee'] }));
  await assertSucceeds(updateDoc(message(employee), { 'activity.status': 'resolved' }));
  await assertFails(updateDoc(message(employee), { activity: null }));
  await assertSucceeds(updateDoc(message(author), { activity: null }));
  console.log('PASS: atividades só podem ser alteradas por colaboradores vinculados e administradores');
  console.log('PASS: pré-cadastros de vagas limitados ao recrutamento da empresa');
  console.log('PASS: diretório público não expõe o cadastro privado dos colaboradores');
} finally { await env.cleanup(); }
