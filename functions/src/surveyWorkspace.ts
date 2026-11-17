import {Firestore,Transaction,DocumentReference,FieldPath} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {createHash,randomBytes} from 'node:crypto';
import {normalizeSurveyQuestions,validateSurveyAnswers} from './surveyModel.mjs';
type Data=Record<string,any>;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const key=(value:unknown)=>{const s=String(value || '');if(!/^[a-zA-Z0-9_-]{1,128}$/.test(s))throw new HttpsError('invalid-argument','Identificação da pesquisa inválida.');return s;};
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
async function access(tx:Transaction,base:DocumentReference,auth:any,admin=false){
 if(!auth||auth.token.companyId!==base.id)throw new HttpsError('permission-denied','Entre no Comunica com uma conta desta empresa.');
 const [company,profile]=await Promise.all([tx.get(base),tx.get(base.collection('users').doc(auth.uid))]);
 if(!company.exists||company.data()?.codeBlocked||!profile.exists||(admin&&profile.data()?.isAdmin!==true))throw new HttpsError('permission-denied','Sem permissão para esta pesquisa.');
 return company.data()!;
}
async function source(tx:Transaction,base:DocumentReference,groupId:string){
 const direct=await tx.get(base.collection('polls').doc(groupId));
 const docs=direct.exists&&!direct.data()!.formId?[direct]:(await tx.get(base.collection('polls').where('formId','==',groupId).limit(201))).docs;
 if(!docs.length||docs.length>200)throw new HttpsError('not-found','Pesquisa não encontrada ou acima de 200 perguntas.');
 const polls=docs.map(d=>({id:d.id,...d.data()} as Data)).sort((a,b)=>(a.formOrder || 1)-(b.formOrder || 1));
 normalizeSurveyQuestions(polls);
 if(polls.some(p=>p.expiresAt&&p.expiresAt<today()))throw new HttpsError('failed-precondition','Esta pesquisa já foi encerrada.');
 return polls;
}
function signature(polls:Data[]){return hash(JSON.stringify(polls.map(p=>[p.id,p.question,p.options,p.type,p.topicId || '',p.topicTitle || '',p.topicOrder || 1,p.formOrder || 1,p.expiresAt || '',p.formTitle || '',p.formDescription || ''])));}
function publicView(polls:Data[],companyName:string,uid?:string){
 return {companyName,title:String(polls[0].formTitle || polls[0].question).slice(0,160),description:String(polls[0].formDescription || '').slice(0,2000),expiresAt:polls[0].expiresAt || '',questions:polls.map(p=>({id:p.id,question:p.question,options:p.options,type:p.type || 'single',topicId:p.topicId || 'general',topicTitle:p.topicTitle || 'Perguntas',topicOrder:p.topicOrder || 1,formOrder:p.formOrder || 1,...(uid&&p.votes?.[uid]!==undefined?{answer:p.votes[uid]}:{})}))};
}
export async function surveyWorkspaceAction(db:Firestore,data:Data,auth?:any,ip='unknown'){
 try {
 const action=String(data.action || '');
 if(['createLink','revokeLink','readInternal','submitInternal'].includes(action)){
  const base=db.doc(`artifacts/comunica-salvador/public/data/companies/${key(data.companyId)}`),groupId=key(data.groupId);
  const newToken=randomBytes(32).toString('base64url');
  return db.runTransaction(async tx=>{
   const company=await access(tx,base,auth,['createLink','revokeLink'].includes(action));
   const metaRef=base.collection('surveyLinks').doc(groupId),meta=await tx.get(metaRef);
   if(action==='revokeLink'){
    if(meta.data()?.tokenHash)tx.update(db.collection('_surveyLinks').doc(meta.data()!.tokenHash),{revoked:true});
    tx.set(metaRef,{revoked:true,updatedBy:auth.uid,updatedAt:Date.now()},{merge:true});return {revoked:true};
   }
   const polls=await source(tx,base,groupId);
   if(action==='readInternal')return {...publicView(polls,String(company.name || 'Comunica'),auth.uid),submitted:polls.every(p=>p.votes?.[auth.uid]!==undefined)};
   if(action==='submitInternal'){
    const answers=validateSurveyAnswers(polls,data.answers);
    for(const p of polls)if(p.votes?.[auth.uid]===undefined)tx.update(base.collection('polls').doc(p.id),new FieldPath('votes',auth.uid),answers[p.id]);
    return {submitted:true};
   }
   const audience=data.audience==='public'?'public':'team',fingerprint=signature(polls);
   if(meta.exists&&!meta.data()!.revoked&&meta.data()!.audience===audience&&meta.data()!.signature===fingerprint&&meta.data()!.validUntil>Date.now())return {token:meta.data()!.token,audience,validUntil:meta.data()!.validUntil};
   const tokenHash=hash(newToken),validUntil=Date.now()+90*86400000;
   if(meta.data()?.tokenHash)tx.update(db.collection('_surveyLinks').doc(meta.data()!.tokenHash),{revoked:true});
   const link={companyId:base.id,groupId,audience,signature:fingerprint,validUntil,revoked:false,createdAt:Date.now(),createdBy:auth.uid};
   tx.create(db.collection('_surveyLinks').doc(tokenHash),link);
   tx.set(metaRef,{...link,token:newToken,tokenHash});return {token:newToken,audience,validUntil};
  });
 }
 if(!['read','submit'].includes(action))throw new HttpsError('invalid-argument','Ação inválida.');
 const token=String(data.token || '');if(!/^[a-zA-Z0-9_-]{43}$/.test(token))throw new HttpsError('not-found','Link da pesquisa inválido ou encerrado.');
 const linkHash=hash(token),linkRef=db.collection('_surveyLinks').doc(linkHash);
 return db.runTransaction(async tx=>{
  const link=await tx.get(linkRef),v=link.data();if(!v||v.revoked||v.validUntil<Date.now())throw new HttpsError('not-found','Link da pesquisa inválido ou encerrado.');
  const base=db.doc(`artifacts/comunica-salvador/public/data/companies/${key(v.companyId)}`);
  let company:Data;
  if(v.audience==='team'){
   if(!auth)return {requiresLogin:true};company=await access(tx,base,auth);
  }else{const doc=await tx.get(base);if(!doc.exists||doc.data()?.codeBlocked)throw new HttpsError('permission-denied','Pesquisa indisponível.');company=doc.data()!;}
  const polls=await source(tx,base,v.groupId);if(signature(polls)!==v.signature)throw new HttpsError('failed-precondition','A pesquisa foi alterada. Solicite um novo link ao responsável.');
  const respondent=String(data.respondentId || '');
  if(v.audience==='public'&&!/^[a-zA-Z0-9_-]{16,128}$/.test(respondent))throw new HttpsError('invalid-argument','Não foi possível identificar este navegador.');
  const responseId=hash(`${base.id}|${v.groupId}|${v.audience}|${v.audience==='team'?auth.uid:respondent}`),uid=v.audience==='team'?auth.uid:`external-${responseId.slice(0,40)}`;
  const responseRef=base.collection('surveyResponses').doc(responseId),response=await tx.get(responseRef);
  const submitted=response.exists||polls.every(p=>p.votes?.[uid]!==undefined);
  if(action==='read')return {...publicView(polls,String(company.name || 'Comunica'),v.audience==='team'?uid:undefined),submitted};
  if(submitted)return {submitted:true};
  const answers=validateSurveyAnswers(polls,data.answers);
  if(v.audience==='public'){
   const rateRef=db.collection('_surveyRateLimits').doc(hash(`${linkHash}|${ip}|${today()}`)),rate=await tx.get(rateRef);
   const recent=Date.now()-Number(rate.data()?.window || 0)<60000,count=recent?Number(rate.data()?.count || 0):0;
   if(count>=120)throw new HttpsError('resource-exhausted','Muitas respostas simultâneas. Aguarde um minuto.');
   tx.set(rateRef,{window:recent?rate.data()!.window:Date.now(),count:count+1});
  }
  for(const p of polls)if(p.votes?.[uid]===undefined)tx.update(base.collection('polls').doc(p.id),new FieldPath('votes',uid),answers[p.id]);
  tx.create(responseRef,{submittedAt:Date.now(),groupId:v.groupId,audience:v.audience});
  return {submitted:true};
 });
 }catch(error:any){if(error instanceof HttpsError)throw error;throw new HttpsError('invalid-argument',error.message || 'Não foi possível concluir a pesquisa.');}
}
