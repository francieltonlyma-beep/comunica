import { buildRuleSchedule } from './scheduleDayRules.js';

const result = row => [row.status, row.shiftStart, row.shiftEnd, row.breakStart, row.breakEnd, ...(row.ruleConflicts || [])].join('|');

export function compareScheduleRules({ savedRules, draftRules, dates, users, holidays = [], history = [], getDepartment = () => '' }) {
  if (!dates.length || !users.length) return { changes: [], people: 0, days: 0 };
  const input = { dates, users, holidays, history, getDepartment };
  const before = new Map(buildRuleSchedule({ ...input, rules: savedRules }).map(row => [row.key, row]));
  const changes = buildRuleSchedule({ ...input, rules: draftRules }).flatMap(row => {
    const old = before.get(row.key);
    return old && result(old) !== result(row) ? [{ date: row.date, userId: row.userId, userName: row.userName, before: old, after: row }] : [];
  });
  return { changes, people: new Set(changes.map(change => change.userId)).size, days: new Set(changes.map(change => change.date)).size };
}
