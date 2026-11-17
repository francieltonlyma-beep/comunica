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
