import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScheduleAiRequest, validateScheduleAiResponse } from '../src/scheduleAiAdvisor.js';
import { shiftDate } from '../src/scheduleDayRules.js';

const start = '2026-11-02';
function fixture() {
  const rows = Array.from({ length: 7 }, (_, index) => {
    const working = ![1, 6].includes(index);
    return { key: 'person-' + index, userId: 'private-user-id', userName: 'Nome que não deve sair', dept: 'private-sector', date: shiftDate(start, index), weekKey: start,
      status: working ? 'Presencial' : 'Folga', shiftStart: working ? '08:00' : '', shiftEnd: working ? '17:00' : '',
      breakStart: working ? '12:00' : '', breakEnd: working ? '13:00' : '', breakMinutes: working ? 60 : 0, extraHours: 0,
      workDaysPerWeek: 5, weekHoursTarget: 40, restEveryDays: 7, maxConsecutiveRestDays: 2, minRestHours: 11, maxDailyHours: 8, maxWeeklyHours: 40, maxExtraHoursPerDay: 0, allowed: true };
  });
  const requirements = [{ id: 'tuesday', department: 'private-sector', start: '08:00', end: '12:00', minimum: 1, weekdays: [2], includeRemote: false },
    { id: 'closed-sunday', department: 'private-sector', date: '2026-11-08', closed: true, scope: 'date' }];
  const context = { history: [], absences: [], employees: [{ id: 'private-user-id', name: 'Nome que não deve sair', depts: ['private-sector'] }] };
  return { rows, requirements, context };
}
const response = swaps => JSON.stringify({ summary: 'Proposta de redistribuição.', swaps });
const swap = { person: 'P1', from: start, to: '2026-11-03' };

test('requisição envia códigos temporários sem nomes, IDs reais ou motivos de ausência', () => {
  const { rows, requirements, context } = fixture();
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.doesNotMatch(request.prompt, /Nome que não deve sair|private-user-id|private-sector/);
  assert.equal(request.people.P1, 'private-user-id');
  assert.equal(request.week, start);
});

test('troca só é aceita após melhorar a cobertura e mantém horas e origem na prévia', () => {
  const { rows, requirements, context } = fixture();
  const original = JSON.stringify(rows);
  const request = buildScheduleAiRequest(rows, requirements, context);
  const result = validateScheduleAiResponse(response([swap]), request, rows, requirements, context);
  assert.equal(result.after.missingMinutes, 0);
  assert.ok(result.after.missingMinutes < result.before.missingMinutes);
  assert.equal(result.rows[0].status, 'Folga');
  assert.equal(result.rows[1].shiftStart, '08:00');
  assert.equal(result.rows[1].breakStart, '12:00');
  assert.equal(result.rows[1].locked, true);
  assert.equal(result.rows[1].ruleTrace.entries.at(-1).source, 'ai');
  assert.equal(JSON.stringify(rows), original);
});

test('pessoa inventada, mudança entre semanas, repetição de dia e regra fixa são recusadas', () => {
  for (const variant of ['person', 'week', 'repeat', 'fixed']) {
    const { rows, requirements, context } = fixture();
    if (variant === 'week') rows[1].weekKey = '2026-11-09';
    if (variant === 'fixed') rows[0].pinned = true;
    const request = buildScheduleAiRequest(rows, requirements, context);
    const swaps = variant === 'person' ? [{ ...swap, person: 'P999' }] : variant === 'repeat' ? [swap, swap] : [swap];
    assert.throws(() => validateScheduleAiResponse(response(swaps), request, rows, requirements, context), /permitidos/);
  }
});

test('limite de duas folgas considera o histórico da semana anterior', () => {
  const { rows, requirements, context } = fixture();
  context.history.push({ id: 'previous', userId: 'private-user-id', startDate: '2026-10-31', endDate: '2026-11-01', status: 'Folga', dept: 'private-sector' });
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.throws(() => validateScheduleAiResponse(response([swap]), request, rows, requirements, context), /folgas consecutivas/);
});

test('ganho total não autoriza criar falta em um dia anteriormente coberto', () => {
  const { rows, requirements, context } = fixture();
  requirements[0].end = '17:00';
  requirements.push({ id: 'monday', department: 'private-sector', start: '08:00', end: '12:00', minimum: 1, weekdays: [1] });
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.throws(() => validateScheduleAiResponse(response([swap]), request, rows, requirements, context), /não melhora a cobertura/);
});

test('domingo fechado, feriado protegido e turno noturno não são liberados pela IA', () => {
  for (const variant of ['closed', 'holiday', 'night']) {
    const { rows, requirements, context } = fixture();
    let suggestion = swap;
    if (variant === 'closed') suggestion = { ...swap, to: '2026-11-08' };
    if (variant === 'holiday') rows[1].holiday = true;
    if (variant === 'night') { rows[0].shiftStart = '22:00'; rows[0].shiftEnd = '06:00'; }
    assert.throws(() => {
      const request = buildScheduleAiRequest(rows, requirements, context);
      validateScheduleAiResponse(response([suggestion]), request, rows, requirements, context);
    });
  }
});

test('resposta inválida e prévia desatualizada nunca alteram os registros', () => {
  const { rows, requirements, context } = fixture();
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.throws(() => validateScheduleAiResponse('não sou JSON', request, rows, requirements, context), /interpretar/);
  assert.throws(() => validateScheduleAiResponse(response(Array(21).fill(swap)), request, rows, requirements, context), /proposta válida/);
  assert.throws(() => validateScheduleAiResponse(response([swap]), request, rows.map(row => ({ ...row, locked: true })), requirements, context), /prévia mudou/);
  const diagnostic = validateScheduleAiResponse(response([]), request, rows, requirements, context);
  assert.equal(diagnostic.rows, null);
  assert.equal(rows[0].status, 'Presencial');
});

test('não consome análise para período já correto, nem para horários sem confirmação', () => {
  const { rows, requirements, context } = fixture();
  const request = buildScheduleAiRequest(rows, requirements, context);
  const correct = validateScheduleAiResponse(response([swap]), request, rows, requirements, context).rows;
  assert.throws(() => buildScheduleAiRequest(correct, requirements, context), /Não é necessário consumir/);
  const incomplete = rows.map(row => ({ ...row, shiftStart: row.status === 'Presencial' ? '' : row.shiftStart }));
  assert.throws(() => buildScheduleAiRequest(incomplete, requirements, context), /Confira os horários/);
});


test('pendência de funcionamento em outra semana não bloqueia revisão nem aplicação segura', () => {
  const { rows, requirements, context } = fixture();
  rows.push({ ...rows[6], key: 'other-sunday', date: '2026-11-15', weekKey: '2026-11-09' });
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.equal(request.week, start);
  assert.ok(request.analysis.unknown > 0);
  const result = validateScheduleAiResponse(response([swap]), request, rows, requirements, context);
  assert.equal(result.rows.at(-1).date, '2026-11-15');
  assert.deepEqual(result.rows.at(-1), rows.at(-1));
  assert.equal(result.after.unknown, result.before.unknown);
  assert.equal(result.after.missingMinutes, 0);
});

test('bloqueio de domingo ou feriado informa data, nome do setor e campo correto', () => {
  for (const holiday of [false, true]) {
    const { rows, requirements, context } = fixture();
    context.departments = [{ id: 'private-sector', name: 'Vila A' }];
    if (holiday) context.holidays = ['2026-11-03'];
    else requirements.pop();
    assert.throws(() => buildScheduleAiRequest(rows, requirements, context), error => {
      assert.match(error.message, new RegExp((holiday ? '03' : '08') + '/11/2026 · Vila A'));
      assert.match(error.message, /defina aberto ou fechado em Necessidade de pessoas/);
      return true;
    });
  }
});

test('configuração válida de domingo e feriado permite análise sem alterar necessidades', () => {
  const { rows, requirements, context } = fixture();
  context.holidays = ['2026-11-03'];
  requirements.push({ ...requirements[0], id: 'holiday', date: '2026-11-03' });
  const original = JSON.stringify(requirements);
  assert.equal(buildScheduleAiRequest(rows, requirements, context).week, start);
  assert.equal(JSON.stringify(requirements), original);
});

test('marcação incompleta na semana continua bloqueando IA com data e setor', () => {
  const { rows, requirements, context } = fixture();
  requirements[0].weekdays = [1, 2];
  rows[0].breakEnd = '';
  context.departments = [{ id: 'private-sector', name: 'Vila A' }];
  assert.throws(() => buildScheduleAiRequest(rows, requirements, context), /02\/11\/2026 · Vila A: confira entrada, saída e início\/fim do intervalo/);
});

test('pendência antiga de outra semana é preservada sem impedir melhoria da semana válida', () => {
  const { rows, requirements, context } = fixture();
  rows.push({ ...rows[0], key: 'other-monday', date: '2026-11-09', weekKey: '2026-11-09', shiftStart: '' });
  const request = buildScheduleAiRequest(rows, requirements, context);
  const result = validateScheduleAiResponse(response([swap]), request, rows, requirements, context);
  assert.deepEqual(result.rows.at(-1), rows.at(-1));
  assert.equal(result.after.missingMinutes, 0);
});

test('troca que cria violação na fronteira da próxima semana continua bloqueada', () => {
  const { rows, requirements, context } = fixture();
  rows.forEach(row => { row.restEveryDays = 6; });
  rows.push({ ...rows[0], key: 'other-monday', date: '2026-11-09', weekKey: '2026-11-09' });
  requirements[1] = { ...requirements[0], id: 'sunday', date: '2026-11-08', weekdays: [0] };
  const request = buildScheduleAiRequest(rows, requirements, context);
  assert.throws(() => validateScheduleAiResponse(response([{ ...swap, to: '2026-11-08' }]), request, rows, requirements, context), /validação/);
});
