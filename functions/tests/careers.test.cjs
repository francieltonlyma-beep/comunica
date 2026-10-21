const test = require('node:test');
const assert = require('node:assert/strict');
const { matchCandidateSkills, resumeFormat, isHumanResourcesProfile } = require('../lib/careers.js');

test('adequação considera competências declaradas sem decidir contratação', () => {
  assert.deepEqual(matchCandidateSkills(['Excel', 'Comunicação', 'Operação'], ['excel', 'Comunicacao']), {
    matched: ['Excel', 'Comunicação'], matchedDeclared: ['Excel', 'Comunicação'], matchedFromCv: [], missing: ['Operação'], percentage: 67,
  });
  assert.equal(matchCandidateSkills([], ['Excel']).percentage, null);
  assert.deepEqual(matchCandidateSkills(['Excel', 'Produção'], [], 'Tenho experiência em produção industrial.').matchedFromCv, ['Produção']);
});

test('anexos aceitam assinaturas PDF e Word, rejeitando outros arquivos', () => {
  assert.equal(resumeFormat('curriculo.pdf', Buffer.from('%PDF-1.7')), 'application/pdf');
  assert.equal(resumeFormat('curriculo.docx', Buffer.from('504b0304', 'hex')), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.throws(() => resumeFormat('curriculo.doc', Buffer.from('d0cf11e0a1b11ae1', 'hex')));
  assert.throws(() => resumeFormat('curriculo.pdf', Buffer.from('texto comum')));
});

test('acesso de recrutamento reconhece RH sem liberar outros setores', () => {
  assert.equal(isHumanResourcesProfile({ role: 'Analista de RH' }), true);
  assert.equal(isHumanResourcesProfile({ departments: ['Recursos Humanos'] }), true);
  assert.equal(isHumanResourcesProfile({ role: 'Produção', department: 'Operações' }), false);
});
