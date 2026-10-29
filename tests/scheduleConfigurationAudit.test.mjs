import test from 'node:test';
import assert from 'node:assert/strict';
import { auditScheduleConfiguration, suggestCompatibleScheduleRules } from '../src/scheduleConfigurationAudit.js';

const base = {
  workDaysPerWeek: 5, hoursPerWeek: 40, restEveryDays: 7,
  minRestHours: 11, maxDailyHours: 12, maxWeeklyHours: 44,
  shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00',
  allowedWeekdays: [0, 1, 2, 3, 4, 5, 6], shifts: [], ruleGroups: [],
};

test('auditoria confirma uma base coerente e rejeita relógios inválidos', () => {
  assert.deepEqual(auditScheduleConfiguration(base), { issues: [], errors: [], warnings: [] });
  const audit = auditScheduleConfiguration({ ...base, shiftStart: '99:00' });
  assert.ok(audit.errors.some(issue => issue.code === 'invalid-shift'));
});

test('auditoria antecipa a incompatibilidade que bloquearia a publicação semanal', () => {
  const audit = auditScheduleConfiguration({ ...base, shiftEnd: '21:00' });
  assert.ok(audit.errors.some(issue => issue.code === 'weekly-limit' && /60,00h/.test(issue.message)));
  assert.ok(audit.warnings.some(issue => issue.code === 'weekly-target-mismatch'));
});

test('ajuste automático compatibiliza jornada, meta, descanso e dias disponíveis', () => {
  const broken = { ...base, shiftEnd: '21:00', restEveryDays: 5, maxWeeklyHours: 30, allowedWeekdays: [1, 2] };
  const repaired = suggestCompatibleScheduleRules(broken);
  assert.equal(repaired.shiftEnd, '17:00');
  assert.equal(repaired.restEveryDays, 6);
  assert.equal(repaired.maxWeeklyHours, 40);
  assert.equal(repaired.allowedWeekdays.length, 5);
  assert.equal(auditScheduleConfiguration(repaired).errors.length, 0);
});

test('auditoria também verifica o perfil efetivo de cada turma', () => {
  const rules = { ...base, shifts: [{ id: 'long', name: 'Longo', shiftStart: '08:00', shiftEnd: '21:00', breakStart: '12:00', breakEnd: '13:00' }],
    ruleGroups: [{ id: 'g', name: 'Operação', userIds: ['u'], shiftId: 'long', weekdays: [1, 2, 3, 4, 5], policy: {}, dayRules: [] }] };
  const audit = auditScheduleConfiguration(rules);
  assert.ok(audit.errors.some(issue => issue.scope === 'Turma Operação' && issue.code === 'weekly-limit'));
});

test('dias não consecutivos não geram falso conflito de descanso entre jornadas', () => {
  const rules = { ...base, shiftEnd: '23:00', minRestHours: 11, maxDailyHours: 16, maxWeeklyHours: 44, hoursPerWeek: 28, workDaysPerWeek: 2, allowedWeekdays: [1, 3] };
  assert.equal(auditScheduleConfiguration(rules).errors.some(issue => issue.code === 'between-shifts'), false);
});

