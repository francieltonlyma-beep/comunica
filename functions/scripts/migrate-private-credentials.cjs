const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {credentialKey,hashPin,matchesPin}=require('../lib/privateCredentials');
const emulator=process.argv.includes('--emulator');
const mode=process.argv.includes('--prepare')?'prepare':process.argv.includes('--finalize')?'finalize':'audit';
const project=emulator?'demo-comunica-migration':'comunica-salvador';
const appId='comunica-salvador',supportId='platform-support-francielton';
const origin=emulator?'http://127.0.0.1:8080':'https://firestore.googleapis.com';
const root=`projects/${project}/databases/(default)/documents`;
const token=emulator?'owner':JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE,'.config/configstore/firebase-tools.json'),'utf8')).tokens.access_token;
async function api(route,method='GET',body,missing=false){
 const response=await fetch(`${origin}/v1/${root}${route}`,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(response.status===404&&missing)return null;
 if(!response.ok){
  const failure=await response.json().catch(()=>({}));
  const safeMessage=String(failure.error?.message||'').replace(/projects\/[^\s"']+/g,'[document]').replace(/[A-Za-z0-9_-]{24,}/g,'[redacted]').replace(/\b\d{4,}\b/g,'[number]');
  throw new Error('Migration HTTP '+response.status+' '+(failure.error?.status||'')+': '+safeMessage);
 }
 return response.json();
}
async function list(route){const result=[];let next='';do{const page=await api(route+'?pageSize=300'+(next?'&pageToken='+encodeURIComponent(next):''));result.push(...(page.documents||[]));next=page.nextPageToken||'';}while(next);return result;}
const encode=values=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,typeof value==='boolean'?{booleanValue:value}:typeof value==='number'?{integerValue:String(value)}:{stringValue:value}]));
const decode=fields=>Object.fromEntries(Object.entries(fields||{}).map(([key,value])=>[key,value.stringValue??value.booleanValue??Number(value.integerValue)]));
function backup(snapshot){
 const command="Add-Type -AssemblyName System.Security; $raw=[Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd()); $protected=[Security.Cryptography.ProtectedData]::Protect($raw,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); $check=[Security.Cryptography.ProtectedData]::Unprotect($protected,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); if([Convert]::ToBase64String($check) -ne [Convert]::ToBase64String($raw)){throw 'Backup verification failed'}; [Console]::Out.Write([Convert]::ToBase64String($protected))";
 const encrypted=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{input:JSON.stringify(snapshot),encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true});
 if(encrypted.status!==0||!encrypted.stdout.trim())throw new Error('Encrypted backup failed');
 const directory=path.resolve(__dirname,'../../backups');fs.mkdirSync(directory,{recursive:true});
 const target=path.join(directory,`credentials-${emulator?'emulator-':''}${mode}-${Date.now()}.dpapi`);
 fs.writeFileSync(target,Buffer.from(encrypted.stdout.trim(),'base64'),{flag:'wx'});
 return path.basename(target);
}
(async()=>{
 const companies=await list(`/artifacts/${appId}/public/data/companies`);
 const writes=[],snapshot=[],supports=[];let users=0;
 for(const company of companies){
  const companyId=company.name.split('/').pop();
  for(const user of await list(`/artifacts/${appId}/public/data/companies/${companyId}/users`)){
   users++;const userId=user.name.split('/').pop();
   const key=credentialKey({appId,companyId,userId});
   const secret=await api('/_privateCredentials/'+key,'GET',undefined,true);
   const pin=user.fields?.pin?.stringValue;
   snapshot.push({user,secret});
   if(mode==='prepare'&&secret&&pin&&!matchesPin(pin,decode(secret.fields)))throw new Error('Existing private credential differs; nothing committed');
   if(userId===supportId)supports.push(companyId);
   if(mode==='prepare'&&!secret){
    if(!/^\d{4,6}$/.test(pin||''))throw new Error('Account requires manual credential recovery; nothing committed');
    writes.push({verify:user.name,currentDocument:{updateTime:user.updateTime}});
    writes.push({update:{name:root+'/_privateCredentials/'+key,fields:encode({...hashPin(pin),failures:0,windowStart:Date.now(),lockedUntil:0,revision:1})},currentDocument:{exists:false}});
   }
   if(mode==='finalize'&&user.fields&&Object.hasOwn(user.fields,'pin')){
    if(!secret||!matchesPin(pin,decode(secret.fields)))throw new Error('Credential changed since preparation; nothing committed');
    writes.push({verify:secret.name,currentDocument:{updateTime:secret.updateTime}});
    writes.push({update:{name:user.name,fields:{}},updateMask:{fieldPaths:['pin']},currentDocument:{updateTime:user.updateTime}});
   }
  }
 }
 const support=await api('/_platformSupport/'+supportId,'GET',undefined,true);
 snapshot.push({support});
 if(mode==='prepare'){
  if(supports.length!==1)throw new Error('Expected exactly one support profile; nothing committed');
  if(support&&(support.fields?.companyId?.stringValue!==supports[0]||support.fields?.appId?.stringValue!==appId||support.fields?.enabled?.booleanValue!==true))throw new Error('Existing support authorization differs; nothing committed');
  if(!support)writes.push({update:{name:root+'/_platformSupport/'+supportId,fields:encode({enabled:true,appId,companyId:supports[0]})},currentDocument:{exists:false}});
 }
 if(writes.length>450)throw new Error('Migration exceeds reviewed transaction size');
 let backupFile=null;
 if(writes.length){backupFile=backup(snapshot);await api(':commit','POST',{writes});}
 console.log(JSON.stringify({mode,emulator,users,writes:writes.length,backupFile}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
