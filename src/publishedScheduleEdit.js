import { coverageChangeError, coverageChangesForDates } from './scheduleCoverageChange.js';
import { isWorking, scheduleRuleIssues, shiftDate } from './scheduleDayRules.js';
import { coverageForDay, coverageRequirementsForDate } from './scheduleCoverage.js';
import { findScheduleAbsence, isFullDayAbsence } from './scheduleAbsences.js';

const statuses = ['Presencial', 'Home Office', 'Folga', 'Feriado'];
const minutes = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const clock = value => `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const active = (record, date) => (record.startDate || record.date) <= date && (record.endDate || record.date || record.startDate) >= date;
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
export const canEditPublishedSchedule = source => Boolean(source?.id && source.userId != null && statuses.includes(source.status));

export function publishedScheduleDraft(source) {
  return { status: source.status, shiftStart: source.shiftStart || '', shiftEnd: source.baseShiftEnd || source.shiftEnd || '',
    breakStart: source.breakStart || '', breakEnd: source.breakEnd || '',
    extraHours: source.baseShiftEnd ? Number(source.extraHours) || 0 : 0, reason: '' };
}

export function publishedDayHours(draft) {
  if (!isWorking(draft)) return { regular: 0, extra: 0, total: 0, actualEnd: '', breakMinutes: 0 };
  const start = minutes(draft.shiftStart), end = minutes(draft.shiftEnd);
  const duration = (end - start + 1440) % 1440;
  const breakMinutes = draft.breakStart && draft.breakEnd ? (minutes(draft.breakEnd) - minutes(draft.breakStart) + 1440) % 1440 : 0;
  const regular = (duration - breakMinutes) / 60, extra = Number(draft.extraHours) || 0;
  return { regular, extra, total: regular + extra, breakMinutes, actualEnd: Number.isFinite(end) ? clock(start + duration + Math.round(extra * 60)) : '' };
}

export function publishedEditIssues(source, draft, date, { history = [], absences = [], rules = {}, events = [] } = {}) {
  if (!canEditPublishedSchedule(source) || !validDate(date) || !validDate(source.startDate || source.date) || !validDate(source.endDate || source.date || source.startDate) || !active(source, date)) return ['Selecione um dia válido dentro desta escala.'];
  if (!statuses.includes(draft.status)) return ['Escolha uma situação válida.'];
  if (history.some(item => item.id !== source.id && String(item.userId) === String(source.userId) && active(item, date))) return ['Há mais de uma escala desta pessoa neste dia. Revise as marcações sobrepostas antes de editar.'];
  if (isWorking(draft)) {
    const operation = coverageRequirementsForDate(date, rules.coverageRequirements || [], source.dept, { events });
    if (operation.some(rule => rule.closed || rule.configurationMissing)) return ['Este setor está fechado ou não tem funcionamento definido para este dia. Revise a necessidade de pessoas antes de marcar trabalho.'];
    if (![draft.shiftStart, draft.shiftEnd].every(value => Number.isFinite(minutes(value))) || draft.shiftStart === draft.shiftEnd) return ['Informe entrada e saída base válidas e diferentes.'];
    const hours = publishedDayHours(draft);
    if (!Number.isFinite(Number(draft.extraHours)) || Number(draft.extraHours) < 0 || Number(draft.extraHours) > 12) return ['A hora extra deve ficar entre 00:00 e 12:00.'];
    if (hours.total <= 0 || (hours.regular * 60 + hours.breakMinutes + hours.extra * 60) >= 1440) return ['A jornada com hora extra deve ser menor que 24 horas.'];
    if (!draft.breakStart && !draft.breakEnd && Number(source.breakMinutes) > 0) return ['Informe o início e o fim do intervalo registrado.'];
    const absence = findScheduleAbsence(absences, source.userId, date, draft.shiftStart, draft.shiftEnd);
    if (absence) return [isFullDayAbsence(absence, date) ? 'Esta pessoa tem uma ausência de dia inteiro. Ajuste a ausência no calendário antes de marcar trabalho.' : 'A jornada informada coincide com uma ausência parcial desta pessoa. Ajuste a ausência ou os horários antes de marcar trabalho.'];
  }
  return scheduleRuleIssues([{ ...draft, key: 'published-edit', userId: String(source.userId), userName: source.userName, date,
    restEveryDays: Number(source.restEveryDays || rules.restEveryDays) || 7, minRestHours: Number(source.minRestHours ?? rules.minRestHours) || 0,
    maxDailyHours: Number(source.maxDailyHours || rules.maxDailyHours) || 24, maxWeeklyHours: Number(source.maxWeeklyHours || rules.maxWeeklyHours) || 84,
    maxExtraHoursPerDay: Number(source.maxExtraHoursPerDay ?? rules.maxExtraHoursPerDay ?? 12), limitSeverity: source.limitSeverity || rules.limitSeverity || 'blocking' }], history).filter(issue => issue.blocking).map(issue => issue.message);
}

export function planPublishedDayEdit(source, draft, date, { publicationId, actor, now, history = [], absences = [], rules = {}, events = [], employees = [], getDepartments, skipCoverageCheck = false }) {
  const issues = publishedEditIssues(source, draft, date, { history, absences, rules, events });
  if (issues.length) throw new Error(issues[0]);
  if (!publicationId || !actor?.id || !Number.isFinite(now)) throw new Error('Identificação da alteração indisponível.');
  const start = source.startDate || source.date, end = source.endDate || source.date || start;
  const { id: sourceId, ...original } = source;
  const schedules = [], records = [];
  const single = start === date && end === date;
  if (!single) {
    records.push({ collection: 'schedules', id: sourceId, operation: 'delete' });
    if (start < date) schedules.push({ ...source, id: `schedule-edit-${publicationId}-left`, startDate: start, endDate: shiftDate(date, -1) });
    if (end > date) schedules.push({ ...source, id: `schedule-edit-${publicationId}-right`, startDate: shiftDate(date, 1), endDate: end });
  }
  const hours = publishedDayHours(draft), working = isWorking(draft);
  schedules.push({ ...original, id: single ? sourceId : `schedule-edit-${publicationId}-day`, startDate: date, endDate: date, status: draft.status,
    shift: working ? `${draft.shiftStart}–${hours.actualEnd}` : draft.status,
    shiftStart: working ? draft.shiftStart : '', baseShiftEnd: working ? draft.shiftEnd : '', shiftEnd: working ? hours.actualEnd : '',
    breakStart: working ? draft.breakStart : '', breakEnd: working ? draft.breakEnd : '', breakMinutes: hours.breakMinutes,
    regularHours: hours.regular, extraHours: hours.extra, plannedHours: hours.total,
    autoGenerated: false, manuallyAdjusted: true, locked: true, ruleReason: 'Ajuste manual da escala publicada somente neste dia',
    sourceScheduleId: sourceId, adjustmentReason: String(draft.reason || '').trim().slice(0, 240), updatedAt: now, updatedBy: actor.name || 'Usuário autenticado', updatedById: actor.id,
  });
  for (const item of schedules) { const { id, ...data } = item; records.push({ collection: 'schedules', id, operation: single && id === sourceId ? 'update' : 'set', data }); }
  if (!skipCoverageCheck && rules.coverageRequirements?.length) {
    const after = [...history.filter(item => item.id !== source.id), ...schedules];
    const problem = coverageChangeError(coverageChangesForDates([date, shiftDate(date, 1)], history, after, rules.coverageRequirements, { absences, events, employees, getDepartments }, source.dept));
    if (problem) throw new Error(problem);
  }
  return { schedules, records, replaced: [source], removedIds: [sourceId] };
}

export function publishedEditCoverage(source, draft, date, requirements, context) {
  const plan = planPublishedDayEdit(source, draft, date, { ...context, publicationId: 'preview', skipCoverageCheck: true, actor: { id: 'preview', name: '' }, now: 0 });
  const schedules = [...context.history.filter(item => item.id !== source.id), ...plan.schedules];
  return [date, shiftDate(date, 1)].map(day => ({ date: day,
    before: coverageForDay(day, requirements, { ...context, schedules: context.history }),
    after: coverageForDay(day, requirements, { ...context, schedules }),
  }));
}

export function coverageMissingMinutes(coverage) {
  const minute = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return coverage.rules.reduce((sum, rule) => sum + rule.segments.reduce((total, segment) => total + (minute(segment.end) - minute(segment.start)) * segment.missing, 0), 0);
}

