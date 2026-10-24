import test from 'node:test';
import assert from 'node:assert/strict';
import { schedulePrintHtml, openSchedulePrintView } from '../src/schedulePrint.js';
const days = [{ date: '2026-12-01', events: [{ title: 'Confraternização' }], coverage: { status: 'sufficient', missingMax: 0 } }];
const rows = [{ name: 'Ana', departments: ['op'], cells: [{ date: days[0].date, schedules: [{ status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', notes: 'Mensagem privada', id: 'private-id' }], absences: [{ reason: 'Informação médica restrita', startTime: '10:00', endTime: '11:00' }] }] }];
const options = { rows, days, companyName: 'Empresa', departments: [{ id: 'op', name: 'Operação' }], printedAt: 0 };

test('impressão inclui somente a escala e os filtros, sem notas privadas ou motivos de ausência', () => {
  const html = schedulePrintHtml({ ...options, filterLabels: ['Setor: Operação', 'Busca: Ana'], showEvents: true });
  assert.ok(html.includes('Filtros aplicados: Setor: Operação | Busca: Ana'));
  assert.ok(html.includes('Confraternização')); assert.ok(html.includes('Presencial'));
  assert.ok(!html.includes('Mensagem privada')); assert.ok(!html.includes('Informação médica restrita')); assert.ok(!html.includes('private-id'));
  assert.ok(!schedulePrintHtml(options).includes('Confraternização'));
});

test('nomes, empresa, setor e eventos são texto seguro na janela de impressão', () => {
  const attack = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
  const html = schedulePrintHtml({ ...options, companyName: attack, filterLabels: [attack], rows: [{ ...rows[0], name: attack }], departments: [{ id: 'op', name: attack }], days: [{ ...days[0], events: [{ title: attack }] }], showEvents: true });
  assert.ok(!html.includes('<img')); assert.ok(!html.includes('<script')); assert.ok(!html.includes('src="http'));
  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('&quot;alert(1)&quot;'));
});

test('versão sem dados não abre janela e popup bloqueado produz erro claro', () => {
  let calls = 0;
  globalThis.window = { open: () => { calls++; return null; } };
  try {
    assert.throws(() => openSchedulePrintView({ ...options, rows: [] }), /Não há colaboradores/);
    assert.equal(calls, 0);
    assert.throws(() => openSchedulePrintView(options), /navegador bloqueou/);
    assert.equal(calls, 1);
  } finally { delete globalThis.window; }
});

test('janela permite revisar antes de imprimir, sem manter acesso à página principal', () => {
  const handlers = {}, calls = [];
  const preview = { opener: {}, document: { open() {}, write: html => calls.push(html), close() {}, getElementById: id => ({ addEventListener: (event, callback) => { handlers[id] = callback; } }) }, focus() {}, print: () => calls.push('printed'), close: () => calls.push('closed') };
  globalThis.window = { open: () => preview };
  try {
    assert.equal(openSchedulePrintView(options), preview); assert.equal(preview.opener, null);
    assert.equal(calls.length, 1);
    handlers['schedule-print-now'](); assert.equal(calls.at(-1), 'printed');
    handlers['schedule-print-close'](); assert.equal(calls.at(-1), 'closed');
  } finally { delete globalThis.window; }
});
