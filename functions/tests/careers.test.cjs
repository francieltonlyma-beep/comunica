const test = require('node:test');
const assert = require('node:assert/strict');
const { matchCandidateSkills, resumeFormat, isHumanResourcesProfile } = require('../lib/careers.js');
const { extractResumeText } = require('../lib/resumeExtraction.js');

test('adequação considera competências declaradas sem decidir contratação', () => {
  assert.deepEqual(matchCandidateSkills(['Excel', 'Comunicação', 'Operação'], ['excel', 'Comunicacao']), {
    version: 3, matched: ['Excel', 'Comunicação'], matchedDeclared: ['Excel', 'Comunicação'], matchedFromCv: [],
    evidenceFromCv: [], missing: ['Operação'], criteriaCount: 3, matchedCount: 2, percentage: 67,
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

test('a comparação inclui descrição, formação e experiência, com evidência além de 12 mil caracteres', () => {
  const vacancy = {
    description: 'Atividades:\nControle de estoque.\nEmissão de notas fiscais.\nBenefícios: Vale-alimentação',
    details: { requirements: 'Ensino médio completo', experience: 'Experiência com atendimento ao público' },
  };
  const cv = 'Histórico profissional detalhado.\n'.repeat(500) + 'Responsável pelo controle de estoque. Fiz a emissão de notas\nfiscais.';
  const fit = matchCandidateSkills([], [], cv, 'Atendimento ao público. Ensino médio completo.', vacancy);
  assert.equal(fit.criteriaCount, 4);
  assert.equal(fit.percentage, 100);
  assert.equal(fit.evidenceFromCv.find(item => item.skill === 'Emissão de notas fiscais').source, 'Currículo anexado');
});

test('menção expressa como falta de experiência não conta como evidência', () => {
  const fit = matchCandidateSkills(['Excel'], [], 'Sem experiência em Excel. Não tenho conhecimento de Excel.');
  assert.equal(fit.percentage, 0);
  assert.deepEqual(fit.evidenceFromCv, []);
});

test('a extração de PDF lê a última página de um currículo com mais de dez páginas', async () => {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pages = [];
  for (let page = 1; page <= 11; page++) {
    const id = objects.length + 1;
    pages.push(id + ' 0 R');
    const stream = 'BT /F1 12 Tf 40 50 Td (' + (page === 11 ? 'Controle de estoque e inventario' : 'Historico profissional') + ') Tj ET';
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 3 0 R >> >> /Contents ' + (id + 1) + ' 0 R >>');
    objects.push('<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + '\nendstream');
  }
  objects[1] = '<< /Type /Pages /Count 11 /Kids [' + pages.join(' ') + '] >>';
  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f '];
  objects.forEach((value, index) => {
    offsets.push(String(Buffer.byteLength(pdf)).padStart(10, '0') + ' 00000 n ');
    pdf += (index + 1) + ' 0 obj\n' + value + '\nendobj\n';
  });
  const xref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 ' + offsets.length + '\n' + offsets.join('\n') + '\ntrailer\n<< /Size ' + offsets.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
  const result = await extractResumeText(Buffer.from(pdf), 'application/pdf');
  assert.equal(result.readable, true);
  assert.match(result.text, /Controle de estoque e inventario/);
});
