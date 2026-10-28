import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesDayRule, resolveDayRules, validateRuleGroups, buildRuleSchedule, scheduleRuleIssues, shiftDate } from '../src/scheduleDayRules.js';

const base = { status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', breakMinutes: 60 };
const rule = changes => ({ id: 'r1', name: 'Regra', kind: 'weekday', weekdays: [0], action: 'work', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '', userIds: [], priority: 0, enabled: true, ...changes });
const group = dayRules => ({ id: 'g1', name: 'Equipe A', userIds: ['1'], dayRules });
const rules = dayRules => ({ ...base, allowedWeekdays: [0, 1, 2, 3, 4, 5, 6], workDaysPerWeek: 5, hoursPerWeek: 40, restEveryDays: 7, holidaysCountAsRest: true, employeeOverrides: {}, reuseLastSchedule: false, calculateExtraAutomatically: true, ruleGroups: [group(dayRules)] });
const dates = (start, count) => Array.from({ length: count }, (_, i) => shiftDate(start, i));
const generate = (dayRules, options = {}) => buildRuleSchedule({ dates: dates('2026-10-26', 7), users: [{ id: '1', name: 'Ana' }], rules: rules(dayRules), holidays: [], ...options });

test('alternância mantém a referência através da virada do mês e antes da referência', () => {
  const alternating = rule({ kind: 'alternating', referenceDate: '2026-10-25', referenceWorks: false });
  const resolve = date => resolveDayRules(group([alternating]), date, false, '1', base);
  assert.equal(resolve('2026-10-18').status, 'Presencial');
  assert.equal(resolve('2026-10-25').status, 'Folga');
  assert.equal(resolve('2026-11-01').status, 'Presencial');
  assert.equal(resolve('2026-11-08').status, 'Folga');
  assert.equal(resolve('2026-11-15').status, 'Presencial');
  assert.equal(resolve('2026-11-01').shiftEnd, '12:00');
});

test('ocorrências identificam primeiro, terceiro e último domingo, incluindo meses com cinco', () => {
  const monthly = rule({ kind: 'monthly', occurrences: [1, 3, -1], action: 'rest' });
  for (const date of ['2026-11-01', '2026-11-15', '2026-11-29']) assert.equal(matchesDayRule(monthly, date, false, '1'), true);
  for (const date of ['2026-11-08', '2026-11-22', '2026-11-02']) assert.equal(matchesDayRule(monthly, date, false, '1'), false);
});

test('qualquer dia pode ter jornada própria, com escopo individual', () => {
  const tuesday = rule({ weekdays: [2], userIds: ['1'], shiftEnd: '14:00' });
  assert.equal(resolveDayRules(group([tuesday]), '2026-10-27', false, '1', base).shiftEnd, '14:00');
  assert.equal(resolveDayRules(group([tuesday]), '2026-10-27', false, '2', base).shiftEnd, '17:00');
});

test('feriado reduz jornada de quem trabalharia e preserva folga recorrente', () => {
  const holiday = rule({ kind: 'holiday', action: 'work', holidayMayActivate: false });
  assert.equal(resolveDayRules(group([holiday]), '2026-10-28', true, '1', base).shiftEnd, '12:00');
  const rest = rule({ action: 'rest' });
  assert.equal(resolveDayRules(group([rest, holiday]), '2026-11-01', true, '1', base).status, 'Folga');
  assert.equal(resolveDayRules(group([rest, { ...holiday, holidayMayActivate: true }]), '2026-11-01', true, '1', base).status, 'Presencial');
});

test('feriado sem regra usa descanso padrão e data específica pode definir trabalho', () => {
  assert.equal(resolveDayRules(group([]), '2026-10-28', true, '1', base).status, 'Folga');
  const specific = rule({ kind: 'date', startDate: '2026-10-28' });
  assert.equal(resolveDayRules(group([specific]), '2026-10-28', true, '1', base).status, 'Presencial');
  assert.equal(matchesDayRule(specific, '2026-10-29', false, '1'), false);
});

test('data específica, indivíduo e feriado possuem prioridades explícitas', () => {
  const recurrent = rule({ weekdays: [3], shiftEnd: '16:00' });
  const holiday = rule({ kind: 'holiday', holidayMayActivate: true, shiftEnd: '12:00' });
  const personal = rule({ weekdays: [3], userIds: ['1'], shiftEnd: '14:00' });
  const specific = rule({ kind: 'date', startDate: '2026-10-28', shiftEnd: '10:00' });
  assert.equal(resolveDayRules(group([recurrent, holiday]), '2026-10-28', true, '1', base).shiftEnd, '12:00');
  assert.equal(resolveDayRules(group([recurrent, holiday, personal]), '2026-10-28', true, '1', base).shiftEnd, '14:00');
  assert.equal(resolveDayRules(group([recurrent, holiday, personal, specific]), '2026-10-28', true, '1', base).shiftEnd, '10:00');
});

test('empates incompatíveis bloqueiam; prioridade resolve; regras idênticas não conflitam', () => {
  const first = rule({ name: 'Primeira' });
  const second = rule({ id: 'r2', name: 'Segunda', shiftEnd: '14:00' });
  assert.deepEqual(resolveDayRules(group([first, second]), '2026-11-01', false, '1', base).ruleConflicts, ['Primeira', 'Segunda']);
  assert.deepEqual(resolveDayRules(group([first, { ...second, priority: 1 }]), '2026-11-01', false, '1', base).ruleConflicts, []);
  assert.deepEqual(resolveDayRules(group([first, { ...first, id: 'r2' }]), '2026-11-01', false, '1', base).ruleConflicts, []);
});

test('vigência e pausas limitam aplicação', () => {
  const limited = rule({ weekdays: [2], startDate: '2026-10-27', endDate: '2026-11-03' });
  assert.equal(matchesDayRule(limited, '2026-10-20', false, '1'), false);
  assert.equal(matchesDayRule(limited, '2026-10-27', false, '1'), true);
  assert.equal(matchesDayRule(limited, '2026-11-10', false, '1'), false);
  assert.equal(matchesDayRule({ ...limited, enabled: false }, '2026-10-27', false, '1'), false);
});

test('validação rejeita referência ausente, intervalo fora da jornada e conjuntos duplicados', () => {
  assert.match(validateRuleGroups([group([rule({ kind: 'alternating' })])]).join(' '), /referência/);
  assert.match(validateRuleGroups([group([rule({ breakStart: '13:00', breakEnd: '14:00' })])]).join(' '), /intervalo/);
  assert.match(validateRuleGroups([group([]), { ...group([]), id: 'g2', name: 'Equipe B' }]).join(' '), /dois conjuntos/);
  assert.equal(validateRuleGroups([group([rule({ kind: 'alternating', referenceDate: '2026-10-25' })])]).length, 0);
});

test('jornadas noturnas aceitam intervalo após meia-noite e recusam intervalo excedente', () => {
  const night = rule({ shiftStart: '22:00', shiftEnd: '06:00', breakStart: '02:00', breakEnd: '03:00' });
  assert.equal(validateRuleGroups([group([night])]).length, 0);
  assert.match(validateRuleGroups([group([{ ...night, breakEnd: '08:00' }])]).join(' '), /intervalo/);
});

test('sábado reduzido fica fixo sem intervalo herdado nem complemento automático', () => {
  const rows = generate([rule({ weekdays: [6] })]);
  const saturday = rows.find(row => row.date === '2026-10-31');
  assert.equal(saturday.status, 'Presencial');
  assert.equal(saturday.shiftEnd, '12:00');
  assert.equal(saturday.breakMinutes, 0);
  assert.equal(saturday.extraHours, 0);
  assert.equal(saturday.ruleReason, 'Regra');
  assert.equal(rows.filter(row => row.status === 'Presencial').length, 5);
});

test('dois conjuntos geram sábados com jornadas diferentes', () => {
  const a = group([rule({ weekdays: [6] })]);
  const b = { id: 'g2', name: 'Equipe B', userIds: ['2'], dayRules: [rule({ weekdays: [6], shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00' })] };
  const rows = generate([], { users: [{ id: '1', name: 'Ana' }, { id: '2', name: 'Bia' }], rules: { ...rules([]), ruleGroups: [a, b] } });
  assert.equal(rows.find(row => row.userId === '1' && row.date === '2026-10-31').shiftEnd, '12:00');
  assert.equal(rows.find(row => row.userId === '2' && row.date === '2026-10-31').shiftEnd, '17:00');
});

test('gerar uma semana em partes preserva a distribuição e a alternância', () => {
  const patterns = [rule({ kind: 'alternating', referenceDate: '2026-10-25', referenceWorks: false })];
  const whole = generate(patterns);
  const part = generate(patterns, { dates: dates('2026-10-30', 3) });
  for (const row of part) assert.equal(row.status, whole.find(item => item.date === row.date).status);
  assert.equal(part.find(row => row.date === '2026-11-01').status, 'Presencial');
});

test('folga de domingo não é substituída para atingir carga ou dias de trabalho', () => {
  const rows = generate([rule({ kind: 'alternating', referenceDate: '2026-11-01', referenceWorks: false })]);
  assert.equal(rows.find(row => row.date === '2026-11-01').status, 'Folga');
  assert.ok(rows.every(row => row.extraHours === 0));
});

test('conflitos e excesso de dias consecutivos bloqueiam a publicação', () => {
  const allDays = rule({ weekdays: [0, 1, 2, 3, 4, 5, 6] });
  const rows = generate([allDays]);
  assert.ok(scheduleRuleIssues(rows).some(issue => issue.blocking && /consecutivos/.test(issue.message)));
  const conflicting = generate([rule({ weekdays: [6] }), rule({ id: 'r2', weekdays: [6], shiftEnd: '14:00' })]);
  assert.ok(scheduleRuleIssues(conflicting).some(issue => issue.blocking && /conflito/.test(issue.message)));
});

test('histórico anterior e posterior é considerado no limite de dias consecutivos', () => {
  const rows = generate([rule({ weekdays: [1, 2, 3, 4, 5, 6, 0] })], { dates: ['2026-10-28'] });
  const history = [{ userId: '1', startDate: '2026-10-22', endDate: '2026-10-27', ...base }];
  assert.ok(scheduleRuleIssues(rows, history).some(issue => issue.blocking && /consecutivos/.test(issue.message)));
  const future = [{ userId: '1', startDate: '2026-10-29', endDate: '2026-11-04', ...base }];
  assert.ok(scheduleRuleIssues(rows, future).some(issue => issue.blocking && /consecutivos/.test(issue.message)));
});

test('diferença de carga gera aviso sem estender o sábado reduzido', () => {
  const rows = generate([rule({ weekdays: [6] })]);
  assert.ok(scheduleRuleIssues(rows).some(issue => !issue.blocking && /meta/.test(issue.message)));
  assert.equal(rows.find(row => row.date === '2026-10-31').shiftEnd, '12:00');
});

test('feriado marcado é descanso e desmarcado segue a distribuição normal', () => {
  const holiday = ['2026-10-28'];
  const counted = generate([], { holidays: holiday });
  const separate = generate([], { holidays: holiday, rules: { ...rules([]), holidaysCountAsRest: false } });
  assert.equal(counted.filter(row => row.status === 'Presencial').length, 5);
  assert.equal(separate.filter(row => row.status === 'Presencial').length, 5);
  assert.ok(separate.every(row => ['Presencial', 'Folga'].includes(row.status)));
  const weekdaysOnly = generate([], { holidays: holiday, rules: { ...rules([]), holidaysCountAsRest: false, allowedWeekdays: [1, 2, 3, 4, 5] } });
  assert.equal(weekdaysOnly.find(row => row.date === holiday[0]).status, 'Presencial');
});

test('jornada especial anterior não vira o novo padrão nos dias comuns', () => {
  const history = [
    { userId: '1', startDate: '2026-10-19', endDate: '2026-10-23', ...base, shiftStart: '09:00', baseShiftEnd: '18:00' },
    { userId: '1', startDate: '2026-10-24', endDate: '2026-10-24', ...base, shiftEnd: '12:00', baseShiftEnd: '12:00', ruleApplied: true },
    { userId: '1', startDate: '2026-10-25', endDate: '2026-10-25', ...base, shiftEnd: '13:00', baseShiftEnd: '13:00', manuallyAdjusted: true },
  ];
  const rows = generate([], { history, rules: { ...rules([]), reuseLastSchedule: true } });
  const work = rows.find(row => row.status === 'Presencial');
  assert.equal(work.shiftStart, '09:00');
  assert.equal(work.shiftEnd, '18:00');
  assert.equal(work.extraHours, 0);
});

test('conjunto pode ter perfil próprio de jornada e limites com versão rastreável', () => {
  const profiledGroup = { ...group([]), name: 'Operação 44h', policy: { workDaysPerWeek: 6, hoursPerWeek: 44, restEveryDays: 7, shiftStart: '07:00', shiftEnd: '16:00', breakStart: '11:00', breakEnd: '12:00', minRestHours: 11, maxDailyHours: 10, maxWeeklyHours: 44, maxExtraHoursPerDay: 2, limitSeverity: 'blocking' } };
  const profiled = buildRuleSchedule({ dates: dates('2026-10-26', 7), users: [{ id: '1', name: 'Ana' }], rules: { ...rules([]), version: 4, name: 'Política da fábrica', ruleGroups: [profiledGroup] }, holidays: [] });
  assert.equal(profiled.filter(isWorking => ['Presencial', 'Home Office'].includes(isWorking.status)).length, 6);
  const work = profiled.find(row => row.status === 'Presencial');
  assert.equal(work.shiftStart, '07:00'); assert.equal(work.shiftEnd, '16:00'); assert.equal(work.weekHoursTarget, 44);
  assert.equal(work.profileName, 'Operação 44h'); assert.equal(work.rulesVersion, 4); assert.equal(work.maxExtraHoursPerDay, 2);
});

test('limites diários, semanais e de hora extra podem bloquear ou apenas avisar', () => {
  const week = generate([]).map(row => ({ ...row, maxDailyHours: 7, maxWeeklyHours: 35, maxExtraHoursPerDay: 1, limitSeverity: 'blocking' }));
  const firstWork = week.find(row => row.status === 'Presencial'); firstWork.extraHours = 2;
  const blocking = scheduleRuleIssues(week);
  assert.ok(blocking.some(issue => issue.blocking && /limite diário/.test(issue.message)));
  assert.ok(blocking.some(issue => issue.blocking && /hora extra/.test(issue.message)));
  assert.ok(blocking.some(issue => issue.blocking && /limite de 35/.test(issue.message)));
  const warnings = scheduleRuleIssues(week.map(row => ({ ...row, limitSeverity: 'warning' })));
  assert.ok(warnings.some(issue => !issue.blocking && /limite diário/.test(issue.message)));
});

test('descanso mínimo entre jornadas considera o histórico anterior e o dia seguinte', () => {
  const rows = generate([], { dates: ['2026-10-27'] }).map(row => ({ ...row, shiftStart: '06:00', shiftEnd: '14:00', minRestHours: 11, limitSeverity: 'blocking' }));
  const history = [{ userId: '1', startDate: '2026-10-26', endDate: '2026-10-26', status: 'Presencial', shiftStart: '14:00', shiftEnd: '23:00' }];
  assert.ok(scheduleRuleIssues(rows, history).some(issue => issue.blocking && /descanso de 7,00h/.test(issue.message)));
  assert.ok(validateRuleGroups([{ ...group([]), policy: { workDaysPerWeek: 6, restEveryDays: 6 } }]).some(issue => /descanso/.test(issue)));
});

