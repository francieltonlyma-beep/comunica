import test from 'node:test';
import assert from 'node:assert/strict';
import { pollVoteCount, pollParticipation, pollOptionResults, pollFormCompletion, parsePollFormQuestions, normalizePollQuestions, pollTimelineItems } from '../src/pollInsights.js';

test('indicadores contam apenas colaboradores atuais e votos válidos', () => {
  const poll = { options: ['Sim', 'Não'], votes: { a: 0, b: 1, antiga: 9 } };
  assert.equal(pollVoteCount(poll), 3);
  assert.equal(pollParticipation(poll, ['a', 'b', 'c']), 67);
  assert.deepEqual(pollOptionResults(poll), [
    { option: 'Sim', count: 1, percentage: 50 },
    { option: 'Não', count: 1, percentage: 50 },
  ]);
});

test('conclusão de formulário exige resposta em todas as perguntas', () => {
  assert.deepEqual(pollFormCompletion([{ votes: { a: 0, b: 1 } }, { votes: { a: 1 } }], ['a', 'b', 'c']), { completed: 1, percentage: 33 });
});

test('formulário exige perguntas com duas ou mais opções', () => {
  assert.deepEqual(parsePollFormQuestions('Clima? | Bom | Ruim\nComunicação? | Clara | Confusa'), [
    { question: 'Clima?', options: ['Bom', 'Ruim'] },
    { question: 'Comunicação?', options: ['Clara', 'Confusa'] },
  ]);
  assert.throws(() => parsePollFormQuestions('Clima? | Bom'), /2 a 8 opções/);
});

test('construtor visual normaliza formatos e rejeita perguntas incompletas', () => {
  assert.deepEqual(normalizePollQuestions([{ type: 'mood', question: ' Como está o clima? ', options: [' 🙂 Bom ', ' 😐 Regular '] }]), [
    { type: 'mood', question: 'Como está o clima?', options: ['🙂 Bom', '😐 Regular'] },
  ]);
  assert.throws(() => normalizePollQuestions([{ type: 'single', question: '', options: ['A', 'B'] }]), /enunciado/);
});

test('timeline publica uma enquete simples e apenas a primeira pergunta de cada formulário', () => {
  const items = pollTimelineItems([
    { id: 'simple', question: 'Você gostou?', category: 'Pulso', author: 'Ana' },
    { id: 'form-1', formId: 'form', formOrder: 1, formQuestionCount: 2, formTitle: 'Clima', question: 'Pergunta 1', author: 'RH' },
    { id: 'form-2', formId: 'form', formOrder: 2, formQuestionCount: 2, formTitle: 'Clima', question: 'Pergunta 2', author: 'RH' },
  ]);
  assert.deepEqual(items.map(item => item.id), ['simple', 'form-1']);
  assert.equal(items[0].notifType, 'poll');
  assert.match(items[1].content, /2 perguntas/);
});
