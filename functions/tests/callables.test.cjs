const {test,after}=require('node:test');
const assert=require('node:assert/strict');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw new Error('Local emulator required');
process.env.GCLOUD_PROJECT='demo-comunica-security';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const endpoints=require('../lib/index');
const {getFirestore}=require('firebase-admin/firestore');
const {getApp,deleteApp}=require('firebase-admin/app');
const {privateCredentials}=require('../lib/privateCredentials');
const {getSupportNotificationTokens}=require('../lib/platformSupportPush');
const db=getFirestore();
test('platform support authenticates without a company employee profile',async()=>{
  const {credentialKey,hashPin}=require('../lib/privateCredentials');
  const appId='comunica-salvador', companyId='support-independent-'+Date.now(), userId='platform-support-francielton';
  const company=db.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  await company.set({name:'Support fixture',code:companyId});
  const access=db.doc(`_platformSupport/${userId}`);
  await access.set({appId,companyId,enabled:true});
  await db.doc('_privateCredentials/'+credentialKey({appId,companyId,userId})).set({...hashPin('5273'),failures:0,windowStart:Date.now(),lockedUntil:0,revision:1});
  const session=await endpoints.authenticateDeveloper.run({data:{appId,pin:'5273'}});
  assert.equal(typeof session.token,'string');
  assert.equal(session.user.id,userId);
  assert.equal(session.user.isDeveloper,true);
  assert.equal(session.user.isEmployee,false);
  assert.equal(session.user.pin,undefined);
  assert.equal((await company.collection('users').doc(userId).get()).exists,false);
  const pushToken='fixture:push_token_1234567890';
  await assert.rejects(()=>endpoints.registerSupportPushToken.run({data:{token:pushToken}}),e=>e.code==='unauthenticated');
  await assert.rejects(()=>endpoints.registerSupportPushToken.run({
    data:{token:pushToken},auth:{uid:'employee',token:{companyId,isDeveloper:true}},
  }),e=>e.code==='permission-denied');
  await assert.rejects(()=>endpoints.registerSupportPushToken.run({
    data:{token:pushToken},auth:{uid:userId,token:{companyId:'other',isDeveloper:true}},
  }),e=>e.code==='permission-denied');
  const supportAuth={uid:userId,token:{companyId,isDeveloper:true}};
  assert.deepEqual(await endpoints.registerSupportPushToken.run({data:{token:pushToken},auth:supportAuth}),{registered:true});
  await endpoints.registerSupportPushToken.run({data:{token:pushToken},auth:supportAuth});
  assert.deepEqual(await getSupportNotificationTokens(db,appId,[userId,'employee'],'employee'),[pushToken]);
  assert.deepEqual(await getSupportNotificationTokens(db,appId,[userId,'employee'],userId),[]);
  assert.deepEqual(await getSupportNotificationTokens(db,appId,['employee'],'employee'),[]);
  assert.equal((await company.collection('users').doc(userId).get()).exists,false);
  await access.update({enabled:false});
  assert.deepEqual(await getSupportNotificationTokens(db,appId,[userId,'employee'],'employee'),[]);
  await assert.rejects(()=>endpoints.registerSupportPushToken.run({data:{token:pushToken},auth:supportAuth}),e=>e.code==='permission-denied');
  await assert.rejects(()=>endpoints.authenticateDeveloper.run({data:{appId,pin:'5273'}}),e=>e.code==='permission-denied');
});
test('company registration is exclusive to active platform support and rejects concurrent duplicate codes',async()=>{
  const data={appId:'comunica-salvador',name:'Fixture',code:'NEW-'+Date.now(),adminName:'Administrator',adminPin:'5273'};
  const auth={uid:'platform-support-francielton',token:{companyId:'support-registration-'+Date.now(),isDeveloper:true}};
  await db.doc('_platformSupport/platform-support-francielton').set({appId:data.appId,companyId:auth.token.companyId,enabled:true});
  await assert.rejects(()=>endpoints.registerCompany.run({data}),error=>error.code==='permission-denied');
  await assert.rejects(()=>endpoints.registerCompany.run({data,auth:{uid:'other',token:{isDeveloper:true}}}),error=>error.code==='permission-denied');
  const results=await Promise.allSettled([endpoints.registerCompany.run({data,auth}),endpoints.registerCompany.run({data,auth})]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  const result=results.find(result=>result.status==='fulfilled').value;
  assert.equal(result.user.pin,undefined);
  assert.equal(result.token,undefined);
  const profile=await db.doc(`artifacts/${data.appId}/public/data/companies/${result.company.id}/users/${result.user.id}`).get();
  assert.equal(profile.data().pin,undefined);
  assert.equal(await privateCredentials(db).verify({appId:data.appId,companyId:result.company.id,userId:result.user.id},'5273'),'ok');
});
test('support login reports lockout on the fifth incorrect PIN',async()=>{
  const {credentialKey,hashPin}=require('../lib/privateCredentials');
  const appId='comunica-salvador',companyId='support-lock-'+Date.now(),userId='platform-support-francielton';
  await db.doc(`_platformSupport/${userId}`).set({appId,companyId,enabled:true});
  await db.doc('_privateCredentials/'+credentialKey({appId,companyId,userId})).set({
    ...hashPin('5273'),failures:0,windowStart:Date.now(),lockedUntil:0,revision:1,
  });
  for(let attempt=1;attempt<5;attempt++){
    await assert.rejects(()=>endpoints.authenticateDeveloper.run({data:{appId,pin:'0000'}}),error=>error.code==='permission-denied');
  }
  await assert.rejects(()=>endpoints.authenticateDeveloper.run({data:{appId,pin:'0000'}}),error=>error.code==='resource-exhausted');
  await assert.rejects(()=>endpoints.authenticateDeveloper.run({data:{appId,pin:'5273'}}),error=>error.code==='resource-exhausted');
});
after(async()=>{await db.terminate();await deleteApp(getApp());});
test('callables enforce identity and preserve private PIN through create/reset/change',async()=>{
  const appId='comunica-salvador',companyId='callable-'+Date.now();
  const company=db.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  await company.set({name:'Fixture',code:companyId.toUpperCase()});
  await company.collection('users').doc('admin').set({isAdmin:true});
  const auth={uid:'admin',token:{companyId,isAdmin:true}};
  const data={appId,userId:'employee',profile:{name:'Fixture',depts:['A'],isDeveloper:true},pin:'5273'};
  await assert.rejects(()=>endpoints.createEmployee.run({data}),e=>e.code==='unauthenticated');
  const created=await endpoints.createEmployee.run({data,auth});
  assert.equal(created.user.pin,undefined);
  assert.equal(created.user.isDeveloper,false);
  await assert.rejects(()=>endpoints.resetEmployeePin.run({auth:{uid:'employee',token:{companyId,isAdmin:true}},data:{appId,userId:'employee',newPin:'6342'}}));
  assert.deepEqual(await endpoints.resetEmployeePin.run({auth,data:{appId,userId:'employee',companyId:'forged',newPin:'6342'}}),{changed:true});
  assert.deepEqual(await endpoints.changeOwnPin.run({auth:{uid:'employee',token:{companyId}},data:{appId,userId:'admin',currentPin:'6342',newPin:'7531'}}),{changed:true});
  const profile=(await company.collection('users').doc('employee').get()).data();
  assert.equal(profile.pin,undefined);
  assert.equal(await privateCredentials(db).verify({appId,companyId,userId:'employee'},'7531'),'ok');
  const session=await endpoints.authenticateWithPin.run({data:{appId,companyCode:companyId,userId:'employee',pin:'7531'}});
  assert.equal(typeof session.token,'string');
  assert.equal(session.user.pin,undefined);
  assert.equal(session.user.id,'employee');
  for(let attempt=1;attempt<5;attempt++){
    await assert.rejects(()=>endpoints.authenticateWithPin.run({data:{appId,companyCode:companyId,userId:'employee',pin:'0000'}}),error=>error.code==='permission-denied');
  }
  await assert.rejects(()=>endpoints.authenticateWithPin.run({data:{appId,companyCode:companyId,userId:'employee',pin:'0000'}}),error=>error.code==='resource-exhausted');
  await assert.rejects(()=>endpoints.authenticateWithPin.run({data:{appId,companyCode:companyId,userId:'employee',pin:'7531'}}),error=>error.code==='resource-exhausted');
  await assert.rejects(()=>endpoints.changeOwnPin.run({auth:{uid:'employee',token:{companyId:'other'}},data:{appId,currentPin:'7531',newPin:'8888'}}));
});

test('removing an employee revokes private credentials and presence but preserves history',async()=>{
  const {credentialKey}=require('../lib/privateCredentials');
  const appId='comunica-salvador',companyId='removal-'+Date.now();
  const company=db.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  await company.set({name:'Fixture',code:companyId.toUpperCase()});
  await company.collection('users').doc('admin').set({id:'admin',name:'Administrador',isAdmin:true});
  const admin={uid:'admin',token:{companyId,isAdmin:true}};
  const created=await endpoints.createEmployee.run({auth:admin,data:{
    appId,userId:'employee',profile:{name:'Colaborador',depts:['A']},pin:'5273',
  }});
  const history=company.collection('messages').doc('history');
  await history.set({senderId:'employee',content:'Histórico preservado'});

  await assert.rejects(()=>endpoints.removeEmployee.run({
    auth:{uid:'employee',token:{companyId,isAdmin:true}},data:{appId,userId:'admin'},
  }),error=>error.code==='failed-precondition');
  assert.equal((await company.collection('users').doc('admin').get()).exists,true);
  await assert.rejects(()=>endpoints.removeEmployee.run({
    auth:admin,data:{appId,userId:'admin'},
  }),error=>error.code==='failed-precondition');

  assert.deepEqual(await endpoints.removeEmployee.run({auth:admin,data:{
    appId,userId:'employee',companyId:'forged',
  }}),{removed:true,presenceRemoved:1});
  assert.equal((await company.collection('users').doc('employee').get()).exists,false);
  assert.equal((await company.collection('presence').doc(created.presence.id).get()).exists,false);
  assert.equal((await db.collection('_privateCredentials').doc(credentialKey({appId,companyId,userId:'employee'})).get()).exists,false);
  assert.equal((await history.get()).exists,true);
  await assert.rejects(()=>endpoints.authenticateWithPin.run({data:{
    appId,companyCode:companyId.toUpperCase(),userId:'employee',pin:'5273',
  }}),error=>error.code==='not-found');
  await assert.rejects(()=>endpoints.generateAiText.run({
    auth:{uid:'employee',token:{companyId}},data:{prompt:'Teste',systemInstruction:'Teste'},
  }),error=>error.code==='permission-denied');
});
