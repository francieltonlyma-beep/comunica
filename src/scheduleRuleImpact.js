import { analyzeProposalCoverage, balancePreparedScheduleProposal, buildCoverageFirstProposal, prepareScheduleProposal } from './scheduleOptimizer.js';
import { buildRuleSchedule, rebalanceConsecutiveRest } from './scheduleDayRules.js';

const result = row => [row.status, row.shiftStart, row.shiftEnd, row.breakStart, row.breakEnd, row.extraHours || 0, ...(row.ruleConflicts || [])].join('|');

export function compareScheduleRules({ savedRules, draftRules, dates, users, holidays = [], history = [], getDepartment = () => '', coverageContext }) {
  if (!dates.length || !users.length) return { changes: [], people: 0, days: 0 };
  const input = { dates, users, holidays, history, getDepartment };
  const simulate = rules => {
    const baseline = buildRuleSchedule({ ...input, rules });
    if (!coverageContext) return { rows: baseline, days: [] };
    const context = { ...coverageContext, history, holidays };
    const requirements = rules.coverageRequirements || [];
    const preserved = prepareScheduleProposal(baseline, { ...context, rules });
    const balanced = balancePreparedScheduleProposal(preserved, baseline, requirements, context);
    const prepared = rebalanceConsecutiveRest(balanced, history);
    const { rows, limited } = buildCoverageFirstProposal(prepared, requirements, context);
    return { rows, days: analyzeProposalCoverage(rows, requirements, context).days, limited };
  };
  const saved = simulate(savedRules);
  const draft = simulate(draftRules);
  const before = new Map(saved.rows.map(row => [row.key, row]));
  const changes = draft.rows.flatMap(row => {
    const old = before.get(row.key);
    return old && result(old) !== result(row) ? [{ date: row.date, userId: row.userId, userName: row.userName, before: old, after: row }] : [];
  });
  const priorCoverage = new Map(saved.days.map(day => [day.date, day]));
  const rowsByDay = new Map();
  for (const row of draft.rows) {
    if (!rowsByDay.has(row.date)) rowsByDay.set(row.date, []);
    rowsByDay.get(row.date).push({ before: before.get(row.key), after: row });
  }
  const coverageDays = draft.days.map(after => ({
    date: after.date, before: priorCoverage.get(after.date), after, team: rowsByDay.get(after.date) || [],
  }));
  return { changes, coverageDays, limited: saved.limited || draft.limited, people: new Set(changes.map(change => change.userId)).size, days: new Set(changes.map(change => change.date)).size };
}
