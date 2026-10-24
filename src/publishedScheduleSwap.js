import { coverageForDay } from './scheduleCoverage.js';
import { isWorking, shiftDate } from './scheduleDayRules.js';
import { canEditPublishedSchedule, planPublishedDayEdit, publishedEditIssues, publishedScheduleDraft } from './publishedScheduleEdit.js';

const active = (record, date) => (record.startDate || record.date) <= date && (record.endDate || record.date || record.startDate) >= date;

export function publishedScheduleOnDay(history, userId, date) {
  const matches = history.filter(item => String(item.userId) === String(userId) && active(item, date));
  return matches.length === 1 && canEditPublishedSchedule(matches[0]) ? matches[0] : null;
}

export function publishedSwapCandidates(source, date, history, employees) {
  return employees.filter(person => String(person.id) !== String(source.userId) && publishedScheduleOnDay(history, person.id, date))
    .slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

const incomingDraft = (source, reason) => ({ ...publishedScheduleDraft(source), reason });

export function publishedSwapIssues(source, sourceDate, target, targetDate, context = {}) {
  if (!source || !target || source.id === target.id || String(source.userId) === String(target.userId)) return ['Escolha outro colaborador com uma escala publicada.'];
  if (!active(source, sourceDate) || !active(target, targetDate)) return ['A escala escolhida não corresponde ao dia informado.'];
  const first = publishedEditIssues(source, incomingDraft(target, ''), sourceDate, context);
  const second = publishedEditIssues(target, incomingDraft(source, ''), targetDate, context);
  return [...new Set([...first, ...second])];
}

export function planPublishedScheduleSwap(source, sourceDate, target, targetDate, { publicationId, actor, now, reason = '', ...context }) {
  const issues = publishedSwapIssues(source, sourceDate, target, targetDate, context);
  if (issues.length) throw new Error(issues[0]);
  const note = String(reason || '').trim().slice(0, 240) || `Troca com ${target.userName || 'outro colaborador'}`;
  const reverseNote = String(reason || '').trim().slice(0, 240) || `Troca com ${source.userName || 'outro colaborador'}`;
  const first = planPublishedDayEdit(source, incomingDraft(target, note), sourceDate, { ...context, publicationId: `${publicationId}-a`, actor, now });
  const second = planPublishedDayEdit(target, incomingDraft(source, reverseNote), targetDate, { ...context, publicationId: `${publicationId}-b`, actor, now });
  return { records: [...first.records, ...second.records], schedules: [...first.schedules, ...second.schedules], replaced: [source, target] };
}

export function publishedSwapCoverage(source, sourceDate, target, targetDate, requirements, context) {
  const plan = planPublishedScheduleSwap(source, sourceDate, target, targetDate, { ...context, publicationId: 'preview', actor: { id: 'preview', name: '' }, now: 0 });
  const removed = new Set([source.id, target.id]);
  const schedules = [...context.history.filter(item => !removed.has(item.id)), ...plan.schedules];
  const dates = [...new Set([sourceDate, shiftDate(sourceDate, 1), targetDate, shiftDate(targetDate, 1)])].sort();
  return dates.map(date => ({ date,
    before: coverageForDay(date, requirements, { ...context, schedules: context.history }),
    after: coverageForDay(date, requirements, { ...context, schedules }),
  }));
}

export function publishedSwapSummary(source, target) {
  const label = item => isWorking(item) ? `${item.status} · ${item.shiftStart || '—'}–${item.baseShiftEnd || item.shiftEnd || '—'}` : item.status;
  return { source: label(source), target: label(target) };
}
