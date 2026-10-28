import { holidayWorkTemplate, isWorking, normalizeRuleGroups, resolveDayRules } from './scheduleDayRules.js';

export function scheduleStatusChange(row, status, rules, history = [], firstDate = row.date) {
  if (!['Presencial', 'Home Office', 'Folga', 'Feriado'].includes(status)) throw new Error('Escolha uma situação válida.');
  if (!isWorking({ status })) return { status, workTemplate: isWorking(row) ? { shiftStart: row.shiftStart, shiftEnd: row.shiftEnd, breakStart: row.breakStart || '', breakEnd: row.breakEnd || '', breakMinutes: Number(row.breakMinutes) || 0 } : row.workTemplate || null, shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0, extraHours: 0 };
  let template = isWorking(row) ? row : row.workTemplate;
  if (!template) {
    const base = holidayWorkTemplate(row.userId, row.date, rules, history, firstDate);
    const group = normalizeRuleGroups(rules.ruleGroups).find(item => item.userIds.includes(String(row.userId)));
    // An explicit manual change to work uses the working hours of that day's
    // rules, including the working side of an alternating Sunday.
    const workingGroup = group && { ...group, dayRules: group.dayRules.filter(rule => rule.action !== 'rest').map(rule => rule.kind === 'alternating' ? { ...rule, kind: 'weekday' } : rule) };
    const resolved = resolveDayRules(workingGroup, row.date, Boolean(row.holiday), row.userId, { ...base, holidayCountsAsRest: false });
    template = resolved.ruleConflicts?.length ? { shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0 } : resolved;
  }
  return { status, shiftStart: template.shiftStart || '', shiftEnd: template.shiftEnd || '', breakStart: template.breakStart || '', breakEnd: template.breakEnd || '', breakMinutes: Number(template.breakMinutes) || 0, extraHours: isWorking(row) ? Number(row.extraHours) || 0 : 0 };
}
