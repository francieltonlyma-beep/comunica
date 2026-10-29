import { validateRuleGroups } from './scheduleDayRules.js';
import { validateScheduleShifts } from './scheduleShifts.js';

const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = value => clockPattern.test(String(value || '')) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const duration = (start, end) => (minutes(end) - minutes(start) + 1440) % 1440;
const clock = value => `${String(Math.floor((((value % 1440) + 1440) % 1440) / 60)).padStart(2, '0')}:${String(((value % 1440) + 1440) % 1440 % 60).padStart(2, '0')}`;
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function profileAudit(label, profile, weekdays, limitSeverity = 'error') {
  const issues = [];
  const add = (code, severity, message) => issues.push({ code, severity, scope: label, message: `${label}: ${message}` });
  const workDays = number(profile.workDaysPerWeek, 5);
  const hours = number(profile.hoursPerWeek, 40);
  const restEvery = number(profile.restEveryDays, 7);
  const maxDaily = number(profile.maxDailyHours, 12);
  const maxWeekly = number(profile.maxWeeklyHours, 44);
  const start = minutes(profile.shiftStart), end = minutes(profile.shiftEnd);
  const hasBreakStart = Boolean(profile.breakStart), hasBreakEnd = Boolean(profile.breakEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) add('invalid-shift', 'error', 'informe entrada e saída válidas e diferentes.');
  if (hasBreakStart !== hasBreakEnd) add('incomplete-break', 'error', 'informe início e fim do intervalo, ou deixe os dois vazios.');
  if (Number.isFinite(start) && Number.isFinite(end) && start !== end && hasBreakStart === hasBreakEnd) {
    const span = duration(profile.shiftStart, profile.shiftEnd);
    let rest = 0;
    if (hasBreakStart) {
      rest = duration(profile.breakStart, profile.breakEnd);
      const offset = duration(profile.shiftStart, profile.breakStart);
      if (!Number.isFinite(minutes(profile.breakStart)) || !Number.isFinite(minutes(profile.breakEnd)) || !rest || rest > 360 || offset + rest > span || rest >= span) add('invalid-break', 'error', 'o intervalo precisa ficar dentro da jornada e ter até 6 horas.');
    }
    const dailyHours = (span - rest) / 60;
    if (dailyHours > maxDaily + 0.001) add('daily-limit', limitSeverity, `a jornada base tem ${dailyHours.toFixed(2).replace('.', ',')}h e supera o limite diário de ${maxDaily.toFixed(2).replace('.', ',')}h.`);
    const scheduled = dailyHours * workDays;
    if (scheduled > maxWeekly + 0.02) add('weekly-limit', limitSeverity, `a jornada base soma ${scheduled.toFixed(2).replace('.', ',')}h em ${workDays} dias e supera o limite semanal de ${maxWeekly.toFixed(2).replace('.', ',')}h.`);
    if (Math.abs(scheduled - hours) > 0.02) add('weekly-target-mismatch', 'warning', `a jornada base soma ${scheduled.toFixed(2).replace('.', ',')}h, mas a meta semanal é ${hours.toFixed(2).replace('.', ',')}h.`);
    const restHours = (1440 - span) / 60;
    const minRest = number(profile.minRestHours, 0);
    const available = new Set(Array.isArray(weekdays) ? weekdays : []);
    const hasConsecutiveDays = [...available].some(day => available.has((day + 1) % 7));
    if (hasConsecutiveDays && restHours + 0.001 < minRest) add('between-shifts', limitSeverity, `jornadas iguais em dias consecutivos deixam ${restHours.toFixed(2).replace('.', ',')}h de descanso; o mínimo configurado é ${minRest.toFixed(2).replace('.', ',')}h.`);
  }
  if (workDays >= restEvery) add('rest-cycle', 'error', 'o descanso deve ocorrer depois dos dias previstos de trabalho.');
  if (!Array.isArray(weekdays) || new Set(weekdays).size < workDays) add('available-days', 'error', `libere pelo menos ${workDays} dia(s) da semana.`);
  if (hours > maxWeekly + 0.001) add('target-over-weekly-limit', 'error', `a meta de ${hours.toFixed(2).replace('.', ',')}h supera o limite semanal.`);
  if (hours > maxDaily * workDays + 0.001) add('target-over-capacity', 'error', 'a meta semanal não cabe nos dias de trabalho sem superar o limite diário.');
  return issues;
}

export function auditScheduleConfiguration(rules = {}) {
  const issues = [];
  const shiftError = validateScheduleShifts(rules.shifts || [], rules.ruleGroups || []);
  if (shiftError) issues.push({ code: 'shift-catalog', severity: 'error', scope: 'Turnos', message: shiftError });
  for (const message of validateRuleGroups(rules.ruleGroups || [])) issues.push({ code: 'rule-groups', severity: 'error', scope: 'Turmas', message });
  issues.push(...profileAudit('Base da empresa', rules, rules.allowedWeekdays));
  const shifts = new Map((rules.shifts || []).map(shift => [String(shift.id), shift]));
  for (const group of rules.ruleGroups || []) {
    const shift = shifts.get(String(group.shiftId)) || {};
    const overrides = Object.fromEntries(Object.entries(group.policy || {}).filter(([, value]) => value !== '' && value != null));
    const profile = { ...rules, ...shift, ...overrides };
    const hasDayOverrides = (group.dayRules || []).some(rule => rule.enabled !== false);
    issues.push(...profileAudit(`Turma ${group.name || 'sem nome'}`, profile, Array.isArray(group.weekdays) ? group.weekdays : rules.allowedWeekdays, hasDayOverrides ? 'warning' : 'error'));
  }
  return { issues, errors: issues.filter(issue => issue.severity === 'error'), warnings: issues.filter(issue => issue.severity === 'warning') };
}

export function suggestCompatibleScheduleRules(rules = {}) {
  const workDays = Math.max(1, Math.min(7, number(rules.workDaysPerWeek, 5)));
  const weeklyHours = Math.max(1, Math.min(84, number(rules.hoursPerWeek, 40)));
  const start = Number.isFinite(minutes(rules.shiftStart)) ? minutes(rules.shiftStart) : 8 * 60;
  const dailyMinutes = Math.round(weeklyHours * 60 / workDays);
  const currentBreak = Number.isFinite(minutes(rules.breakStart)) && Number.isFinite(minutes(rules.breakEnd)) ? duration(rules.breakStart, rules.breakEnd) : 60;
  const breakMinutes = Math.min(360, Math.max(0, currentBreak));
  const span = dailyMinutes + breakMinutes;
  const existingBreakOffset = Number.isFinite(minutes(rules.breakStart)) ? duration(clock(start), rules.breakStart) : NaN;
  const breakOffset = Number.isFinite(existingBreakOffset) && existingBreakOffset > 0 && existingBreakOffset + breakMinutes < span
    ? existingBreakOffset : Math.max(1, Math.floor(dailyMinutes / 2));
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const allowed = [...new Set((rules.allowedWeekdays || []).filter(day => Number.isInteger(day) && day >= 0 && day <= 6))];
  for (const day of orderedDays) if (allowed.length < workDays && !allowed.includes(day)) allowed.push(day);
  return {
    ...rules,
    workDaysPerWeek: workDays,
    restEveryDays: Math.max(workDays + 1, Math.min(14, number(rules.restEveryDays, 7))),
    hoursPerWeek: weeklyHours,
    maxDailyHours: Math.max(number(rules.maxDailyHours, 12), Math.ceil(dailyMinutes / 30) / 2),
    maxWeeklyHours: Math.max(number(rules.maxWeeklyHours, 44), weeklyHours),
    shiftStart: clock(start), shiftEnd: span < 1440 ? clock(start + span) : rules.shiftEnd,
    breakStart: breakMinutes && span < 1440 ? clock(start + breakOffset) : '',
    breakEnd: breakMinutes && span < 1440 ? clock(start + breakOffset + breakMinutes) : '',
    allowedWeekdays: allowed.sort(),
  };
}

