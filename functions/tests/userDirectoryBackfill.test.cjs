const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {initializeApp,deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Emulador local obrigatório');
const projectId='demo-comunica-directory';
const app=initializeApp({projectId});
const db=getFirestore();

test('migração cria diretório idempotente sem copiar dados privados', async () => {
  const company=db.doc('artifacts/comunica-salvador/public/data/companies/fixture');
  await company.set({name:'Empresa fictícia'});
  await company.collection('users').doc('u1').set({name:'Pessoa',role:'Operação',birthDate:'2000-11-08',
    emergencyPhone:'999999999',pushTokens:['segredo'],isAdmin:false});
  for(let index=0;index<2;index++){
    const run=spawnSync(process.execPath,['scripts/backfill-user-directory.cjs'],{
      cwd:require('node:path').resolve(__dirname,'..'),encoding:'utf8',
      env:{...process.env,GCLOUD_PROJECT:projectId},timeout:30000});
    assert.equal(run.status,0,run.stderr);
  }
  const directory=(await company.collection('userDirectory').doc('u1').get()).data();
  assert.deepEqual(directory,{id:'u1',name:'Pessoa',role:'Operação',isAdmin:false,birthMonthDay:'11-08'});
  await db.terminate(); await deleteApp(app);
});
