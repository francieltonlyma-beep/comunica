import test from 'node:test';import assert from 'node:assert/strict';
import {surveyDraftQuestions,normalizeSurveyQuestions,surveyTopics,validateSurveyAnswers} from '../functions/src/surveyModel.mjs';
const q=(topicId='t1')=>({topicId,type:'yesNo',question:'A comunicação funciona?',options:['Sim','Não']});
test('pesquisa permite 20 tópicos e 200 perguntas organizadas, sem ultrapassar limites',()=>{
 const topics=Array.from({length:20},(_,i)=>({id:`t${i+1}`,title:`Tema ${i+1}`}));
 const questions=topics.flatMap(t=>Array.from({length:10},()=>q(t.id)));
 const normalized=surveyDraftQuestions({topics,questions});assert.equal(normalized.length,200);assert.equal(surveyTopics(normalized).length,20);
 assert.equal(normalized[10].topicTitle,'Tema 2');assert.equal(normalized[10].topicOrder,2);
 assert.throws(()=>normalizeSurveyQuestions([...normalized,normalized[0]]),/200/);
 assert.throws(()=>surveyDraftQuestions({topics:[...topics,{id:'t21',title:'Extra'}],questions}),/20/);
});
test('tópicos vazios, nomes ausentes e perguntas incompletas são recusados',()=>{
 assert.throws(()=>surveyDraftQuestions({topics:[{id:'t1',title:'Liderança'},{id:'t2',title:'Ambiente'}],questions:[q()]}),/ao menos uma/);
 assert.throws(()=>surveyDraftQuestions({topics:[{id:'t1',title:''}],questions:[q()]}),/título/);
 assert.throws(()=>surveyDraftQuestions({topics:[{id:'t1',title:'Liderança'}],questions:[{...q(),question:''}]}),/enunciado/);
});
test('compatibilidade com enquetes antigas e validação de todas as respostas',()=>{
 const polls=[{id:'1',question:'Sim?',options:['Sim','Não']},{id:'2',question:'Gostou?',options:['Sim','Não']}];
 assert.equal(surveyTopics(polls)[0].title,'Perguntas');assert.equal(surveyTopics(polls)[0].questions.length,2);
 assert.deepEqual(validateSurveyAnswers(polls,{'1':0,'2':1}),{'1':0,'2':1});
 assert.throws(()=>validateSurveyAnswers(polls,{'1':0}),/todas/);assert.throws(()=>validateSurveyAnswers(polls,{'1':0,'2':5}),/resposta/);
 assert.throws(()=>validateSurveyAnswers(polls,{'1':0,'2':1,extra:0}),/todas/);
});

test('relatório agrega escala por tópico sem identificar participantes e ignora votos inválidos',async()=>{
 const {surveyReport,isSurveyManager}=await import('../functions/src/surveyModel.mjs');
 const result=surveyReport([{id:'a',topicId:'t',topicTitle:'Ambiente',question:'Escala',type:'scale',options:['1','2','3','4','5'],votes:{personA:4,personB:2,bad:99}},{id:'b',topicId:'t',topicTitle:'Ambiente',question:'Sim?',type:'yesNo',options:['Sim','Não'],votes:{personA:0}}]);
 assert.equal(result.respondents,2);assert.equal(result.completed,1);assert.equal(result.partial,1);assert.equal(result.answers,3);assert.equal(result.topics[0].average,4);assert.equal(result.topics[0].questions[0].favorable,50);assert.equal(result.topics[0].questions[1].average,null);assert.equal(JSON.stringify(result).includes('personA'),false);
 assert.equal(isSurveyManager({department:'RH'}),true);assert.equal(isSurveyManager({role:'Analista de Recursos Humanos'}),true);assert.equal(isSurveyManager({depts:['RH']}),true);assert.equal(isSurveyManager({role:'Gerente de vendas'}),false);
});
