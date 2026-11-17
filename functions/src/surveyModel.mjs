export const SURVEY_LIMITS={topics:20,questions:200,options:8};
export const SURVEY_TYPES={
 single:{label:'Escolha única',options:['','']},
 yesNo:{label:'Sim ou não',options:['Sim','Não']},
 scale:{label:'Escala de 1 a 5',options:['1 — Muito baixo','2 — Baixo','3 — Regular','4 — Bom','5 — Excelente']},
 mood:{label:'Clima com emojis',options:['😞 Muito ruim','😕 Ruim','😐 Neutro','🙂 Bom','🤩 Excelente']},
};
export function normalizeSurveyQuestions(questions) {
 if(!Array.isArray(questions)||questions.length<1||questions.length>SURVEY_LIMITS.questions)throw Error('Informe de 1 a 200 perguntas.');
 const topics=new Map();
 return questions.map((item,index)=>{
  const question=String(item?.question || '').trim();
  const type=Object.hasOwn(SURVEY_TYPES,item?.type)?item.type:'single';
  if(!Array.isArray(item?.options))throw Error(`A pergunta ${index+1} precisa de 2 a 8 opções.`);
  const options=item.options.map(o=>String(o || '').trim()).filter(Boolean);
  if(!question)throw Error(`Escreva o enunciado da pergunta ${index+1}.`);
  if(question.length>500)throw Error(`A pergunta ${index+1} excede 500 caracteres.`);
  if(options.length<2||options.length>8||options.some(o=>o.length>240))throw Error(`A pergunta ${index+1} precisa de 2 a 8 opções, com até 240 caracteres.`);
  const result={question,type,options};
  if(item.topicId!==undefined){
   const topicId=String(item.topicId),topicTitle=String(item.topicTitle || '').trim();
   if(!/^[a-zA-Z0-9_-]{1,80}$/.test(topicId)||!topicTitle||topicTitle.length>120)throw Error('Informe o título de cada tópico, com até 120 caracteres.');
   if(topics.has(topicId)&&topics.get(topicId)!==topicTitle)throw Error('Um tópico possui títulos diferentes.');
   topics.set(topicId,topicTitle);if(topics.size>20)throw Error('Use até 20 tópicos por pesquisa.');
   Object.assign(result,{topicId,topicTitle,topicOrder:Math.max(1,Math.min(20,Number(item.topicOrder)||topics.size))});
  }
  return result;
 });
}
export function surveyDraftQuestions(draft) {
 const topics=draft.topics || [{id:'topic-1',title:'Geral'}];
 if(!topics.length||topics.length>20||new Set(topics.map(t=>t.id)).size!==topics.length)throw Error('Crie de 1 a 20 tópicos diferentes.');
 for(const topic of topics)if(!(draft.questions || []).some(q=>(q.topicId || 'topic-1')===topic.id))throw Error(`Inclua ao menos uma pergunta no tópico ${topic.title || 'sem título'}.`);
 const ordered=topics.flatMap((topic,index)=>(draft.questions || []).filter(q=>(q.topicId || 'topic-1')===topic.id).map(q=>({...q,topicId:topic.id,topicTitle:topic.title,topicOrder:index+1})));
 if(ordered.length!==(draft.questions || []).length)throw Error('Há perguntas sem um tópico válido.');
 return normalizeSurveyQuestions(ordered);
}
export function surveyTopics(questions) {
 const groups=new Map();
 for(const q of [...questions].sort((a,b)=>(a.topicOrder || 1)-(b.topicOrder || 1)||(a.formOrder || 0)-(b.formOrder || 0))){
  const id=q.topicId || 'general';if(!groups.has(id))groups.set(id,{id,title:q.topicTitle || 'Perguntas',questions:[]});groups.get(id).questions.push(q);
 }
 return [...groups.values()];
}
export function validateSurveyAnswers(questions,answers) {
 if(!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length!==questions.length)throw Error('Responda todas as perguntas antes de enviar.');
 for(const q of questions){const value=answers[q.id];if(!Number.isInteger(value)||value<0||value>=q.options.length)throw Error(`Confira a resposta da pergunta: ${q.question}`);}
 return Object.fromEntries(questions.map(q=>[q.id,answers[q.id]]));
}
