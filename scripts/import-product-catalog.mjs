// One-time, authenticated catalog import. Input data stays outside the repository.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {catalogProductFields} from '../functions/src/purchaseProductCatalog.mjs';
import {normalizeSearch} from '../functions/src/procurement.mjs';
const args=process.argv.slice(2);
const option=name=>args[args.indexOf(name)+1];
const project=option('--project'),company=option('--company'),input=option('--input'),expectedName=option('--expected-company');
if(!args.includes('--project')||!args.includes('--company')||!args.includes('--input')||!args.includes('--expected-company')||!process.env.FIREBASE_TOOLS_ROOT)throw Error('Informe --project, --company, --input, --expected-company e FIREBASE_TOOLS_ROOT.');
if(!/^[a-zA-Z0-9_-]+$/.test(project)||!/^[a-zA-Z0-9_-]+$/.test(company))throw Error('Destino inválido.');
const requireTools=createRequire(resolve(process.env.FIREBASE_TOOLS_ROOT,'package.json'));
const auth=requireTools('./lib/auth.js');
const account=auth.getGlobalDefaultAccount();
if(!account)throw Error('Conclua o login autorizado do Firebase CLI antes de importar.');
const credentials=await auth.getAccessToken(account.tokens.refresh_token,account.scopes);
const origin=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
async function request(url,body){const response=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${credentials.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw Error(result.error?.message || `HTTP ${response.status}`);return result;}
const companyDoc=await request(`${origin}/artifacts/comunica-salvador/public/data/companies/${company}`);
if(companyDoc.fields?.name?.stringValue!==expectedName)throw Error('A empresa do destino não corresponde ao nome confirmado.');
const collection=`${origin}/artifacts/comunica-salvador/public/data/companies/${company}/purchaseProducts`;
async function listProducts(){let docs=[],pageToken;do{const url=new URL(collection);url.searchParams.set('pageSize','300');url.searchParams.append('mask.fieldPaths','code');url.searchParams.append('mask.fieldPaths','name');if(pageToken)url.searchParams.set('pageToken',pageToken);const result=await request(url);docs.push(...(result.documents || []));pageToken=result.nextPageToken;}while(pageToken);return docs;}
const rows=JSON.parse(readFileSync(input,'utf8'));
if(!Array.isArray(rows)||!rows.length)throw Error('Arquivo de produtos vazio.');
const seen=new Set();for(const row of rows){catalogProductFields(row);if(!row.code||seen.has(normalizeSearch(row.code)))throw Error('Código ausente ou duplicado no arquivo.');seen.add(normalizeSearch(row.code));}
const before=await listProducts(),existing=new Map();for(const doc of before){const code=doc.fields?.code?.stringValue;if(!code)continue;const key=normalizeSearch(code);if(existing.has(key)&&seen.has(key))throw Error('Há cadastros duplicados para um código importado. Revise antes de alterar.');existing.set(key,doc);}
console.log(JSON.stringify({project,company:expectedName,products:rows.length,existingCodes:rows.filter(p=>existing.has(normalizeSearch(p.code))).length,apply:args.includes('--apply')}));
if(args.includes('--apply')){
 let saved=0;
 for(let offset=0;offset<rows.length;offset+=200){
  const writes=rows.slice(offset,offset+200).map(row=>{const old=existing.get(normalizeSearch(row.code));const normalized=catalogProductFields(row);const fields=old?Object.fromEntries(Object.entries(normalized).filter(([key])=>row[key]!==undefined)):normalized;
   fields.updatedAt=Date.now();fields.updatedBy='authorized-catalog-import';
   const name=old?.name || `${collection.replace('https://firestore.googleapis.com/v1/','')}/${createHash('sha256').update(normalizeSearch(row.code)).digest('hex').slice(0,32)}`;
   const encoded=Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,typeof value==='number'?{integerValue:String(value)}:Array.isArray(value)?{arrayValue:{values:value.map(v=>({stringValue:v}))}}:{stringValue:value}]));
   return {update:{name,fields:encoded},updateMask:{fieldPaths:Object.keys(fields)},currentDocument:old?{updateTime:old.updateTime}:{exists:false}};
  });
  await request(`${origin}:commit`,{writes});saved+=writes.length;console.log(`${saved}/${rows.length} produtos gravados`);
 }
 const after=await listProducts();const byCode=new Map(after.map(doc=>[normalizeSearch(doc.fields?.code?.stringValue),doc.fields?.name?.stringValue]));
 const verified=rows.filter(row=>byCode.get(normalizeSearch(row.code))===row.name).length;
 if(verified!==rows.length)throw Error(`Conferência incompleta: ${verified}/${rows.length}.`);
 console.log(JSON.stringify({imported:saved,verified,collectionTotal:after.length}));
}
