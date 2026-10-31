import { coverageForDay } from './scheduleCoverage.js';

export function coverageChangesForDates(dates, before, after, requirements, context = {}, department = 'all') {
  return [...new Set(dates)].sort().map(date => ({ date, before: coverageForDay(date, requirements, { ...context, schedules: before }, department), after: coverageForDay(date, requirements, { ...context, schedules: after }, department) }));
}

// Manual edits may repair an existing deficit, but cannot create a new gap or
// increase an existing one. Automatic publication still requires full coverage
// or a separate, explicit administrator authorization.
export function coverageChangeError(changes) {
  for (const day of changes) for (const rule of day.after.rules) {
    const before = day.before.rules.find(item => item.id === rule.id);
    if (rule.unknown > (before?.unknown || 0)) return `${day.date.split('-').reverse().join('/')}: a alteração deixa horários ou funcionamento sem confirmação. Revise antes de salvar.`;
    for (const slot of rule.segments.filter(item => item.missing > 0)) {
      const prior = before?.segments.filter(item => item.start < slot.end && item.end > slot.start) || [];
      if (!prior.length || prior.some(item => item.missing < slot.missing)) return `${day.date.split('-').reverse().join('/')} · ${slot.start}–${slot.end}: a alteração aumenta a falta de cobertura. Reorganize a equipe ou use uma publicação com autorização administrativa.`;
    }
  }
  return '';
}
