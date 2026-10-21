// Read-only audit. Never logs profile fields, PINs, hashes, tokens or names.
const fs = require('node:fs');
const path = require('node:path');
const {credentialKey} = require('../lib/privateCredentials');
const project = 'comunica-salvador';
const config = JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE, '.config/configstore/firebase-tools.json'), 'utf8'));
const token = config.tokens?.access_token;
if (!token) throw new Error('Firebase authentication required');
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
async function get(route, allowMissing=false) {
  const response = await fetch(base+'/'+route, {headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
  if (response.status===404 && allowMissing) return null;
  if (!response.ok) throw new Error('Audit HTTP '+response.status);
  return response.json();
}
async function list(route) {
  const docs=[]; let cursor='';
  do {
    const data=await get(route+'?pageSize=300'+(cursor?'&pageToken='+encodeURIComponent(cursor):''));
    docs.push(...(data.documents||[])); cursor=data.nextPageToken||'';
  } while(cursor);
  return docs;
}
(async()=>{
  const summary={companies:0,users:0,privateCredentials:0,publicPinFields:0,validLegacy:0,missingOrInvalid:0,supportProfiles:0,supportAuthorizationActive:false};
  const companies=await list('artifacts/'+project+'/public/data/companies');
  summary.companies=companies.length;
  for(const company of companies){
    const companyId=company.name.split('/').pop();
    const users=await list(`artifacts/${project}/public/data/companies/${companyId}/users`);
    for(const user of users){
      summary.users++;
      if(Object.hasOwn(user.fields||{},'pin'))summary.publicPinFields++;
      const userId=user.name.split('/').pop();
      if(userId==='platform-support-francielton')summary.supportProfiles++;
      const key=credentialKey({appId:project,companyId,userId});
      const secret=await get('_privateCredentials/'+key,true);
      if(secret)summary.privateCredentials++;
      else if(/^\d{4,6}$/.test(user.fields?.pin?.stringValue||''))summary.validLegacy++;
      else summary.missingOrInvalid++;
    }
  }
  const support=await get('_platformSupport/platform-support-francielton',true);
  summary.supportAuthorizationActive=support?.fields?.enabled?.booleanValue===true;
  console.log(JSON.stringify(summary));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
