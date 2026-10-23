import { isFixedProposalRow } from './scheduleOptimizer.js';
import { isWorking } from './scheduleDayRules.js';

// Person filters affect the proposed assignments; coverage always describes the whole sector.
export function proposalCalendarDays(rows, coverage = [], issues = [], employee = 'all') {
  const days = new Map();
  for (const row of rows) {
    if (!days.has(row.date)) days.set(row.date, { date: row.date, rows: [], working: 0, off: 0, absent: 0, fixed: 0, holiday: false });
    const day = days.get(row.date);
    day.holiday ||= Boolean(row.holiday);
    if (employee !== 'all' && String(row.userId) !== employee) continue;
    day.rows.push(row);
    if (isWorking(row)) day.working++;
    else if (row.status === 'Folga') day.off++;
    else day.absent++;
    if (isFixedProposalRow(row)) day.fixed++;
  }
  const coverageByDate = new Map(coverage.map(day => [day.date, day]));
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map(day => {
    const rules = coverageByDate.get(day.date)?.rules || [];
    return { ...day,
      coverage: rules.some(rule => rule.segments?.some(segment => segment.missing > 0)) ? 'gap'
        : rules.some(rule => rule.unknown > 0) ? 'unknown' : rules.length ? 'covered' : 'none',
      blocking: issues.filter(issue => issue.date === day.date && issue.blocking).length,
    };
  });
}
