// Tests only the platform owner's support login; never prints credentials or tokens.
const fs=require('node:fs'),path=require('node:path');
const config=JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE,'.config/configstore/firebase-tools.json'),'utf8'));
const base='https://firestore.googleapis.com/v1/projects/comunica-salvador/databases/(default)/documents';
async function read(route){const r=await fetch(base+'/'+route,{headers:{Authorization:'Bearer '+config.tokens.access_token},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('Read HTTP '+r.status);return r.json();}
async function call(name,data){const r=await fetch('https://us-central1-comunica-salvador.cloudfunctions.net/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data}),signal:AbortSignal.timeout(60000)});return {status:r.status,body:await r.json()};}
(async()=>{
 const authorization=await read('_platformSupport/platform-support-francielton');
 const companyId=authorization.fields.companyId.stringValue;
 const profile=await read(`artifacts/comunica-salvador/public/data/companies/${companyId}/users/platform-support-francielton`);
 const pin=profile.fields.pin?.stringValue;
 if(!pin)throw new Error('Legacy support PIN already removed; do not recover or log secrets automatically');
 const login=await call('authenticateDeveloper',{appId:'comunica-salvador',pin});
 const result=login.body.result;
 if(login.status!==200||!result?.token||result.user?.id!=='platform-support-francielton'||result.user.pin!==undefined||result.user.isDeveloper!==true)throw new Error('Support login smoke failed');
 const denied=await call('resetEmployeePin',{appId:'comunica-salvador',userId:'fixture',newPin:'1234'});
 if(denied.body.error?.status!=='UNAUTHENTICATED')throw new Error('Anonymous request was not denied');
 console.log(JSON.stringify({supportLogin:true,profileWithoutPin:true,anonymousResetDenied:true}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
