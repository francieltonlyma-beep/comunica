import { coverageRequirementsForDate } from './scheduleCoverage.js';

// Missing configuration and an explicitly closed sector are distinct decisions.
// Keep the block, but return the exact date/sector so the user can resolve it.
export function scheduleOperationIssue(schedules, requirements, context = {}) {
  for (const row of schedules) {
    if (!['Presencial', 'Home Office'].includes(row.status)) continue;
    const date = row.date || row.startDate;
    const rule = coverageRequirementsForDate(date, requirements, row.dept, context)
      .find(item => item.closed || item.configurationMissing);
    if (rule) return { date, department: row.dept, closed: Boolean(rule.closed) };
  }
  return null;
}

// Opening a weekly closure here creates a date exception, never changes all
// Sundays. A date-specific closure is edited in place to avoid conflicting rules.
export function scheduleOperationDraft(issue, requirements) {
  const existing = requirements.find(rule => rule.department === issue.department && rule.date === issue.date && rule.closed);
  return { ...(existing || {}), id: existing?.id || '', department: issue.department,
    date: issue.date, scope: 'date', weekdays: [], closed: false,
    start: '', end: '', minimum: '', maximum: '', includeRemote: false };
}
