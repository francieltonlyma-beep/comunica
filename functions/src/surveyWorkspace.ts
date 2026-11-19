import {Firestore,Transaction,DocumentReference,FieldPath} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {createHash,randomBytes} from 'node:crypto';
import {normalizeSurveyQuestions,normalizeSurveySuggestion,validateSurveyAnswers,surveyDraftQuestions,isSurveyManager,surveyReport} from './surveyModel.mjs';
type Data=Record<string,any>;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const key=(value:unknown)=>{const s=String(value || '');if(!/^[a-zA-Z0-9_-]{1,128}$/.test(s))throw new HttpsError('invalid-argument','Identificação da pesquisa inválida.');return s;};
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
function profileSectors(profile:Data={}){return [...new Set([profile.dept,profile.department,...(Array.isArray(profile.departments)?profile.departments:[]),...(Array.isArray(profile.depts)?profile.depts:[])].map(v=>String(v||'').trim()).filter(Boolean))];}
async function assertSurveySector(tx:Transaction,base:DocumentReference,auth:any,sectorId:unknown){const target=String(sectorId||'').trim();if(!target)throw new HttpsError('failed-precondition','Defina o setor desta pesquisa antes de abrir a participação interna.');const profile=(await tx.get(base.collection('users').doc(auth.uid))).data()||{};if(!profileSectors(profile).includes(target))throw new HttpsError('permission-denied','Esta pesquisa está disponível somente para o setor indicado.');}
function surveyChannelId(audience:string,sectorId=''){return audience==='public'?'public':`sector-${hash(sectorId).slice(0,24)}`;}
function surveyChannelRef(base:DocumentReference,groupId:string,audience:string,sectorId=''){return base.collection('surveyLinks').doc(groupId).collection('channels').doc(surveyChannelId(audience,sectorId));}
async function revokeSurveyLinks(tx:Transaction,db:Firestore,base:DocumentReference,groupId:string,legacy:any){
 if(legacy?.tokenHash)tx.update(db.collection('_surveyLinks').doc(legacy.tokenHash),{revoked:true});
 const channels=await tx.get(base.collection('surveyLinks').doc(groupId).collection('channels'));
 for(const channel of channels.docs){const hashValue=channel.data().tokenHash;if(hashValue)tx.update(db.collection('_surveyLinks').doc(hashValue),{revoked:true});tx.set(channel.ref,{revoked:true,updatedAt:Date.now()},{merge:true});}
}
async function access(tx:Transaction,base:DocumentReference,auth:any,admin=false){
 if(!auth||auth.token.companyId!==base.id)throw new HttpsError('permission-denied','Entre no Comunica com uma conta desta empresa.');
 const [company,profile]=await Promise.all([tx.get(base),tx.get(base.collection('users').doc(auth.uid))]);
 if(!company.exists||company.data()?.codeBlocked||!profile.exists||(admin&&!isSurveyManager(profile.data())))throw new HttpsError('permission-denied','Sem permissão para esta pesquisa.');
 return company.data()!;
}
async function source(tx:Transaction,base:DocumentReference,groupId:string,management=false){
 const direct=await tx.get(base.collection('polls').doc(groupId));
 const docs=direct.exists&&!direct.data()!.formId?[direct]:(await tx.get(base.collection('polls').where('formId','==',groupId).limit(201))).docs;
 if(!docs.length||docs.length>200)throw new HttpsError('not-found','Pesquisa não encontrada ou acima de 200 perguntas.');
 const polls=docs.map(d=>({id:d.id,...d.data()} as Data)).sort((a,b)=>(a.formOrder || 1)-(b.formOrder || 1));
 normalizeSurveyQuestions(polls);
 if(!management&&polls.some(p=>p.archived))throw new HttpsError('failed-precondition','Esta pesquisa está arquivada.');
 if(!management&&polls.some(p=>p.expiresAt&&p.expiresAt<today()))throw new HttpsError('failed-precondition','Esta pesquisa já foi encerrada.');
 return polls;
}
function suggestionCollection(base:DocumentReference,groupId:string){
 return base.collection('surveyLinks').doc(groupId).collection('suggestions');
}
function saveSuggestion(tx:Transaction,base:DocumentReference,groupId:string,value:unknown){
 const text=normalizeSurveySuggestion(value);
 if(text)tx.create(suggestionCollection(base,groupId).doc(),{text,createdAt:Date.now()});
}
function signature(polls:Data[]){return hash(JSON.stringify(polls.map(p=>[p.id,p.question,p.options,p.type,p.topicId || '',p.topicTitle || '',p.topicOrder || 1,p.formOrder || 1,p.expiresAt || '',p.formTitle || '',p.formDescription || ''])));}
function publicView(polls:Data[],companyName:string,uid?:string){
 return {companyName,title:String(polls[0].formTitle || polls[0].question).slice(0,160),description:String(polls[0].formDescription || '').slice(0,2000),expiresAt:polls[0].expiresAt || '',questions:polls.map(p=>({id:p.id,question:p.question,options:p.options,type:p.type || 'single',topicId:p.topicId || 'general',topicTitle:p.topicTitle || 'Perguntas',topicOrder:p.topicOrder || 1,formOrder:p.formOrder || 1,...(uid&&p.votes?.[uid]!==undefined?{answer:p.votes[uid]}:{})}))};
}
export async function surveyWorkspaceAction(db:Firestore,data:Data,auth?:any,ip='unknown'){
 try {
 const action=String(data.action || '');
 if(['createLink','revokeLink','readInternal','submitInternal','edit','archive','restore','report','listSectors'].includes(action)){
  const base=db.doc(`artifacts/comunica-salvador/public/data/companies/${key(data.companyId)}`),groupId=key(data.groupId);
  const newToken=randomBytes(32).toString('base64url');
  return db.runTransaction(async tx=>{
   const company=await access(tx,base,auth,!['readInternal','submitInternal'].includes(action));
   const metaRef=base.collection('surveyLinks').doc(groupId),meta=await tx.get(metaRef);
   if(action==='listSectors'){const users=await tx.get(base.collection('users'));const sectors=[...new Set(users.docs.flatMap(doc=>profileSectors(doc.data())))].sort((a,b)=>a.localeCompare(b,'pt-BR'));return {sectors};}
   if(action==='revokeLink'){
    await revokeSurveyLinks(tx,db,base,groupId,meta.data());
    tx.set(metaRef,{revoked:true,updatedBy:auth.uid,updatedAt:Date.now()},{merge:true});return {revoked:true};
   }
   const management=['edit','archive','restore','report'].includes(action);
   const polls=await source(tx,base,groupId,management);
   if(action==='report'){
    const limit=200;
    const suggestions=await tx.get(suggestionCollection(base,groupId).orderBy('createdAt','desc').limit(limit+1));
    const responses=await tx.get(base.collection('surveyResponses').where('groupId','==',groupId).limit(5000));
    const responseBreakdown={public:0,sectors:{} as Record<string,number>,legacyInternal:0};
    const attributedUsers=new Set<string>();
    for(const doc of responses.docs){const value=doc.data();if(value.audience==='public')responseBreakdown.public++;else if(value.audience==='sector'){const sector=String(value.sectorId||'Setor não informado');responseBreakdown.sectors[sector]=(responseBreakdown.sectors[sector]||0)+1;if(value.respondentUid)attributedUsers.add(String(value.respondentUid));}else responseBreakdown.legacyInternal++;}
    const legacyVoters=new Set(polls.flatMap(p=>Object.keys(p.votes||{}).filter(uid=>!uid.startsWith('external-')&&!attributedUsers.has(uid))));
    responseBreakdown.legacyInternal=Math.max(responseBreakdown.legacyInternal,legacyVoters.size);
    return {...surveyReport(polls),responseBreakdown,title:polls[0].formTitle || polls[0].question,archived:Boolean(polls[0].archived),suggestions:suggestions.docs.slice(0,limit).map(doc=>doc.data().text),suggestionsLimited:suggestions.size>limit};
   }
   if(action==='archive'||action==='restore'){
    await revokeSurveyLinks(tx,db,base,groupId,meta.data());
    tx.set(metaRef,{revoked:true,updatedAt:Date.now(),updatedBy:auth.uid},{merge:true});
    for(const p of polls)tx.update(base.collection('polls').doc(p.id),{archived:action==='archive',updatedAt:Date.now(),updatedBy:auth.uid});
    return {archived:action==='archive'};
   }
   if(action==='edit'){
    const draft=data.draft || {},normalized=surveyDraftQuestions(draft);
    const title=String(draft.title || '').trim(),description=String(draft.description || '').trim(),category=String(draft.category || 'Pesquisa de clima').trim(),expiresAt=String(draft.expiresAt || '');
    if(!title||title.length>160||description.length>2000||category.length>120||(expiresAt&&!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)))throw new HttpsError('invalid-argument','Confira o título e o prazo da pesquisa.');
    const ordered=draft.topics.flatMap((t:Data)=>draft.questions.filter((q:Data)=>(q.topicId || 'topic-1')===t.id));
    const old=new Map(polls.map(p=>[p.id,p])),seen=new Set<string>();
    const next=normalized.map((q:Data,i:number)=>{const id=ordered[i].id?key(ordered[i].id):`question-${randomBytes(12).toString('hex')}`;
     if(seen.has(id)||(ordered[i].id&&!old.has(id)))throw new HttpsError('invalid-argument','Identificação de pergunta inválida.');seen.add(id);return {id,...q};});
    const answered=polls.some(p=>Object.keys(p.votes || {}).length>0);
    if(answered&&(next.length!==polls.length||next.some((q:Data)=>{const previous=old.get(q.id);return !previous||q.question!==previous.question||q.type!==(previous.type || 'single')||JSON.stringify(q.options)!==JSON.stringify(previous.options);})))throw new HttpsError('failed-precondition','Esta pesquisa já recebeu respostas. Altere apenas título, apresentação, tópicos, categoria ou prazo para preservar os resultados.');
    await revokeSurveyLinks(tx,db,base,groupId,meta.data());
    tx.set(metaRef,{revoked:true,updatedAt:Date.now(),updatedBy:auth.uid},{merge:true});
    for(const p of polls)if(!seen.has(p.id))tx.delete(base.collection('polls').doc(p.id));
    next.forEach((q:Data,i:number)=>{const previous=old.get(q.id);tx.set(base.collection('polls').doc(q.id),{...(previous || {votes:{},createdAt:Date.now(),authorId:auth.uid,author:'RH'}),...q,formId:groupId,formTitle:title,formDescription:description,formOrder:i+1,formQuestionCount:next.length,category,expiresAt,archived:Boolean(polls[0].archived),updatedAt:Date.now(),updatedBy:auth.uid});});
    return {saved:true};
   }
   if(action==='readInternal'){await assertSurveySector(tx,base,auth,meta.data()?.sectorId||polls[0].surveySectorId);return {...publicView(polls,String(company.name || 'Comunica'),auth.uid),submitted:polls.every(p=>p.votes?.[auth.uid]!==undefined)};}
   if(action==='submitInternal'){
    await assertSurveySector(tx,base,auth,meta.data()?.sectorId||polls[0].surveySectorId);
    if(polls.every(p=>p.votes?.[auth.uid]!==undefined))return {submitted:true};
    const answers=validateSurveyAnswers(polls,data.answers),sectorId=String(meta.data()?.sectorId||polls[0].surveySectorId||''),responseRef=base.collection('surveyResponses').doc(hash(`${base.id}|${groupId}|internal|${auth.uid}`)),response=await tx.get(responseRef);
    saveSuggestion(tx,base,groupId,data.suggestion);
    for(const p of polls)if(p.votes?.[auth.uid]===undefined)tx.update(base.collection('polls').doc(p.id),new FieldPath('votes',auth.uid),answers[p.id]);
    if(!response.exists)tx.create(responseRef,{submittedAt:Date.now(),groupId,audience:sectorId?'sector':'internal',sectorId,respondentUid:auth.uid});
    return {submitted:true};
   }
   const audience=data.audience==='public'?'public':data.audience==='team'?'team':'sector',sectorId=String(data.sectorId||polls[0].surveySectorId||meta.data()?.sectorId||'').trim(),fingerprint=signature(polls);
   if(audience==='sector'||(audience==='public'&&sectorId)){
    if(!sectorId||sectorId.length>120)throw new HttpsError('invalid-argument','Selecione o setor da divulgação.');
    const users=await tx.get(base.collection('users')),available=new Set(users.docs.flatMap(doc=>profileSectors(doc.data())));
    if(!available.has(sectorId))throw new HttpsError('invalid-argument','O setor selecionado não existe nesta empresa.');
   }
   const currentSector=String(polls[0].surveySectorId||meta.data()?.sectorId||''),channelRef=surveyChannelRef(base,groupId,audience,sectorId),channel=await tx.get(channelRef);
   if(channel.exists&&!channel.data()!.revoked&&channel.data()!.signature===fingerprint&&(!sectorId||currentSector===sectorId)&&channel.data()!.validUntil>Date.now())return {token:channel.data()!.token,audience,sectorId,validUntil:channel.data()!.validUntil};
   const tokenHash=hash(newToken),validUntil=Date.now()+90*86400000;
   if(channel.data()?.tokenHash)tx.update(db.collection('_surveyLinks').doc(channel.data()!.tokenHash),{revoked:true});
   const link={companyId:base.id,groupId,audience,sectorId,signature:fingerprint,validUntil,revoked:false,createdAt:Date.now(),createdBy:auth.uid};
   tx.create(db.collection('_surveyLinks').doc(tokenHash),link);
   tx.set(channelRef,{...link,token:newToken,tokenHash});if(sectorId){for(const p of polls)tx.update(base.collection('polls').doc(p.id),{surveySectorId:sectorId});tx.set(metaRef,{sectorId,updatedAt:Date.now(),updatedBy:auth.uid},{merge:true});}return {token:newToken,audience,sectorId,validUntil};
  });
 }
 if(!['read','submit'].includes(action))throw new HttpsError('invalid-argument','Ação inválida.');
 const token=String(data.token || '');if(!/^[a-zA-Z0-9_-]{43}$/.test(token))throw new HttpsError('not-found','Link da pesquisa inválido ou encerrado.');
 const linkHash=hash(token),linkRef=db.collection('_surveyLinks').doc(linkHash);
 return db.runTransaction(async tx=>{
  const link=await tx.get(linkRef),v=link.data();if(!v||v.revoked||v.validUntil<Date.now())throw new HttpsError('not-found','Link da pesquisa inválido ou encerrado.');
  const base=db.doc(`artifacts/comunica-salvador/public/data/companies/${key(v.companyId)}`);
  let company:Data;
  if(v.audience==='sector'||v.audience==='team'){
   if(!auth)return {requiresLogin:true};
   company=await access(tx,base,auth);
   const profile=(await tx.get(base.collection('users').doc(auth.uid))).data()||{};
   if(v.audience==='sector'&&!profileSectors(profile).includes(String(v.sectorId||'')))throw new HttpsError('permission-denied','Esta pesquisa está disponível somente para o setor indicado.');
   const channel=await tx.get(surveyChannelRef(base,key(v.groupId),v.audience,String(v.sectorId||'')));
   if(channel.data()?.revoked||channel.data()?.tokenHash!==linkHash)throw new HttpsError('not-found','Link da pesquisa inválido ou encerrado.');
  }
  else{const doc=await tx.get(base);if(!doc.exists||doc.data()?.codeBlocked)throw new HttpsError('permission-denied','Pesquisa indisponível.');company=doc.data()!;}
  const polls=await source(tx,base,v.groupId);if(v.audience==='sector'&&polls[0].surveySectorId&&String(polls[0].surveySectorId)!==String(v.sectorId||''))throw new HttpsError('not-found','Este link foi substituído por uma divulgação de outro setor. Solicite o link atualizado.');if(signature(polls)!==v.signature)throw new HttpsError('failed-precondition','A pesquisa foi alterada. Solicite um novo link ao responsável.');
  const respondent=String(data.respondentId || '');
  if(v.audience==='public'&&!/^[a-zA-Z0-9_-]{16,128}$/.test(respondent))throw new HttpsError('invalid-argument','Não foi possível identificar este navegador.');
  const responseKey=v.audience==='sector'?`${base.id}|${v.groupId}|sector|${v.sectorId}|${auth.uid}`:`${base.id}|${v.groupId}|${v.audience}|${v.audience==='team'?auth.uid:respondent}`,responseId=hash(responseKey),uid=(v.audience==='sector'||v.audience==='team')?auth.uid:`external-${responseId.slice(0,40)}`;
  const responseRef=base.collection('surveyResponses').doc(responseId),response=await tx.get(responseRef);
  const submitted=response.exists||polls.every(p=>p.votes?.[uid]!==undefined);
  if(action==='read')return {...publicView(polls,String(company.name || 'Comunica'),(v.audience==='sector'||v.audience==='team')?uid:undefined),submitted};
  if(submitted)return {submitted:true};
  const answers=validateSurveyAnswers(polls,data.answers);
  if(v.audience==='public'){
   const rateRef=db.collection('_surveyRateLimits').doc(hash(`${linkHash}|${ip}|${today()}`)),rate=await tx.get(rateRef);
   const recent=Date.now()-Number(rate.data()?.window || 0)<60000,count=recent?Number(rate.data()?.count || 0):0;
   if(count>=120)throw new HttpsError('resource-exhausted','Muitas respostas simultâneas. Aguarde um minuto.');
   tx.set(rateRef,{window:recent?rate.data()!.window:Date.now(),count:count+1});
  }
  saveSuggestion(tx,base,v.groupId,data.suggestion);
  for(const p of polls)if(p.votes?.[uid]===undefined)tx.update(base.collection('polls').doc(p.id),new FieldPath('votes',uid),answers[p.id]);
  tx.create(responseRef,{submittedAt:Date.now(),groupId:v.groupId,audience:v.audience,sectorId:v.sectorId||'',respondentUid:(v.audience==='sector'||v.audience==='team')?auth.uid:''});
  return {submitted:true};
 });
 }catch(error:any){if(error instanceof HttpsError)throw error;throw new HttpsError('invalid-argument',error.message || 'Não foi possível concluir a pesquisa.');}
}
