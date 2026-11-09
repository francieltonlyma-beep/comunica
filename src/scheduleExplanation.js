const clean = (value, limit = 240) => String(value ?? '').slice(0, limit);
const working = row => ['Presencial', 'Home Office'].includes(row?.status);
const decisions = new Set(['applied', 'superseded', 'ignored', 'conflict', 'constraint']);
export const SCHEDULE_TRACE_LIMIT = 64;

export function canReviewScheduleOrigin(row, scope, allowed = false) {
  return Boolean(allowed && row?.userId != null && scope?.employeeIds?.map(String).includes(String(row.userId))
    && (scope.allDepartments || (row.dept && scope.departmentIds?.map(String).includes(String(row.dept)))));
}

export function scheduleResultSnapshot(row) {
  return { status: clean(row?.status, 40), shiftStart: working(row) ? clean(row.shiftStart, 5) : '',
    shiftEnd: working(row) ? clean(row.baseShiftEnd || row.shiftEnd, 5) : '',
    breakStart: working(row) ? clean(row.breakStart, 5) : '', breakEnd: working(row) ? clean(row.breakEnd, 5) : '',
    extraHours: working(row) && Number.isFinite(Number(row.extraHours)) ? Number(row.extraHours) : 0 };
}

export function initialScheduleTrace(row, detail = '') {
  return { version: 1, complete: true, omitted: 0, entries: [{ source: 'base', label: 'Base da jornada', detail: clean(detail, 600), decision: 'applied', ruleId: '', ...scheduleResultSnapshot(row) }] };
}

export function appendScheduleTrace(row, event) {
  const previous = row?.ruleTrace?.version === 1 ? row.ruleTrace : { complete: false, entries: [], omitted: 0 };
  const decision = decisions.has(event.decision) ? event.decision : 'applied';
  let entries = (Array.isArray(previous.entries) ? previous.entries : []).map(item => ({ ...item,
    decision: decision === 'applied' && event.preserveApplied !== true && ['applied', 'conflict'].includes(item.decision) ? 'superseded' : item.decision }));
  entries.push({ source: clean(event.source, 40), label: clean(event.label || row.ruleReason, 160),
    detail: clean(event.detail, 600), ruleId: clean(event.ruleId, 160), actorName: clean(event.actorName, 120), at: Number.isFinite(event.at) ? event.at : 0, decision, ...scheduleResultSnapshot(row) });
  const removed = Math.max(0, entries.length - SCHEDULE_TRACE_LIMIT);
  if (removed) entries = [entries[0], ...entries.slice(-(SCHEDULE_TRACE_LIMIT - 1))];
  return { version: 1, complete: previous.complete === true, omitted: Number(previous.omitted || 0) + removed, entries };
}

export function explainScheduleRecord(row) {
  const trace = row?.ruleTrace;
  const recorded = trace?.version === 1 && Array.isArray(trace.entries);
  const entries = recorded ? trace.entries.slice(0, SCHEDULE_TRACE_LIMIT).map(item => ({ ...scheduleResultSnapshot(item),
    source: clean(item.source, 40), label: clean(item.label, 160), detail: clean(item.detail, 600), ruleId: clean(item.ruleId, 160), actorName: clean(item.actorName, 120), at: Number.isFinite(item.at) ? item.at : 0,
    decision: decisions.has(item.decision) ? item.decision : 'ignored' })) : [];
  const final = entries.findLast(item => item.decision === 'applied');
  const current = scheduleResultSnapshot(row);
  return { current, entries, missing: !recorded || trace.complete !== true,
    omitted: recorded ? Number(trace.omitted || 0) : 0,
    changed: Boolean(final && JSON.stringify(scheduleResultSnapshot(final)) !== JSON.stringify(current)),
    conflicts: Array.isArray(row?.ruleConflicts) ? row.ruleConflicts.map(value => clean(value, 160)) : [],
    rulesVersion: Number(row?.rulesVersion) || 0, reason: clean(row?.ruleReason, 600) };
}
