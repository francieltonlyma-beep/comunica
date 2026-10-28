import { scheduleRowFieldIssues } from './scheduleValidation.js';
const DAY = 86400000;
export const isWorking = row => ['Presencial', 'Home Office'].includes(row?.status);
const stamp = date => Date.parse(`${date}T00:00:00Z`);
export const shiftDate = (date, days) => new Date(stamp(date) + days * DAY).toISOString().slice(0, 10);
const weekday = date => new Date(stamp(date)).getUTCDay();
const monday = date => shiftDate(date, -((weekday(date) + 6) % 7));
const timeMinutes = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const duration = (start, end) => (timeMinutes(end) - timeMinutes(start) + 1440) % 1440;
const dateValid = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(stamp(value)) && new Date(stamp(value)).toISOString().slice(0, 10) === value;
const validClock = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
const optionalNumber = (value, min, max) => value === '' || value == null ? '' : Math.max(min, Math.min(max, Number(value) || min));
const normalizeGroupPolicy = policy => ({
  workDaysPerWeek: optionalNumber(policy?.workDaysPerWeek, 1, 7), hoursPerWeek: optionalNumber(policy?.hoursPerWeek, 1, 84), restEveryDays: optionalNumber(policy?.restEveryDays, 2, 14),
  shiftStart: validClock(policy?.shiftStart) ? policy.shiftStart : '', shiftEnd: validClock(policy?.shiftEnd) ? policy.shiftEnd : '',
  breakStart: validClock(policy?.breakStart) ? policy.breakStart : '', breakEnd: validClock(policy?.breakEnd) ? policy.breakEnd : '',
  minRestHours: optionalNumber(policy?.minRestHours, 0, 24), maxDailyHours: optionalNumber(policy?.maxDailyHours, 1, 24),
  maxWeeklyHours: optionalNumber(policy?.maxWeeklyHours, 1, 84), maxExtraHoursPerDay: optionalNumber(policy?.maxExtraHoursPerDay, 0, 12),
  limitSeverity: policy?.limitSeverity === 'warning' ? 'warning' : policy?.limitSeverity === 'blocking' ? 'blocking' : '',
});
export const newDayRule = () => ({ id: `day-${globalThis.crypto.randomUUID()}`, name: '', kind: 'weekday', weekdays: [6], occurrences: [1, 3], referenceDate: '', referenceWorks: false, action: 'work', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '', status: 'Presencial', startDate: '', endDate: '', userIds: [], holidayMayActivate: false, priority: 0, enabled: true });
export const normalizeRuleGroups = groups => Array.isArray(groups) ? groups.map(group => ({
  id: String(group.id || ''), name: String(group.name || 'Conjunto de regras').slice(0, 80),
  userIds: [...new Set((group.userIds || []).map(String))],
  shiftId: String(group.shiftId || ''),
  weekdays: Array.isArray(group.weekdays) ? [...new Set(group.weekdays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))] : null,
  policy: normalizeGroupPolicy(group.policy),
  dayRules: Array.isArray(group.dayRules) ? group.dayRules.map(rule => ({ ...rule, userIds: (rule.userIds || []).map(String), enabled: rule.enabled !== false })) : [],
})) : [];

export function validateRuleGroups(groups) {
  const errors = [];
  const owners = new Map();
  const groupIds = new Set();
  for (const group of groups) {
    if (!group.id || groupIds.has(group.id)) errors.push('Cada conjunto precisa ter uma identificação única.');
    groupIds.add(group.id);
    if (Array.isArray(group.weekdays) && !group.weekdays.length) errors.push(`${group.name}: selecione ao menos um dia disponível para a turma.`);
    for (const userId of group.userIds) {
      if (owners.has(userId)) errors.push(`Um colaborador está em dois conjuntos: ${owners.get(userId)} e ${group.name}.`);
      owners.set(userId, group.name);
    }
    const policy = group.policy || {};
    if (policy.workDaysPerWeek !== '' && policy.restEveryDays !== '' && Number(policy.workDaysPerWeek) >= Number(policy.restEveryDays)) errors.push(`${group.name}: o descanso deve ocorrer depois dos dias previstos de trabalho.`);
    if (policy.hoursPerWeek !== '' && policy.maxWeeklyHours !== '' && Number(policy.hoursPerWeek) > Number(policy.maxWeeklyHours)) errors.push(`${group.name}: a carga semanal supera o limite do perfil.`);
    if (Boolean(policy.breakStart) !== Boolean(policy.breakEnd)) errors.push(`${group.name}: informe início e fim do intervalo do perfil.`);
    for (const rule of group.dayRules.filter(rule => rule.enabled !== false)) {
      const label = `${group.name}: ${rule.name || 'regra sem nome'}`;
      if (!rule.name?.trim()) errors.push(`${label} — informe um nome.`);
      if (!['weekday', 'alternating', 'monthly', 'holiday', 'date'].includes(rule.kind)) errors.push(`${label} — tipo inválido.`);
      if (rule.kind !== 'holiday' && rule.kind !== 'date' && (!rule.weekdays?.length || rule.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6))) errors.push(`${label} — escolha os dias da semana.`);
      if (rule.kind === 'alternating' && !dateValid(rule.referenceDate)) errors.push(`${label} — informe uma data de referência válida.`);
      if (rule.kind === 'monthly' && (!rule.occurrences?.length || rule.occurrences.some(n => ![1, 2, 3, 4, 5, -1].includes(n)))) errors.push(`${label} — escolha as ocorrências do mês.`);
      if (rule.kind === 'date' && !dateValid(rule.startDate)) errors.push(`${label} — informe a data inicial.`);
      if ((rule.startDate && !dateValid(rule.startDate)) || (rule.endDate && (!dateValid(rule.endDate) || (rule.startDate && rule.endDate < rule.startDate)))) errors.push(`${label} — período inválido.`);
      if (!['work', 'rest', 'hours'].includes(rule.action)) errors.push(`${label} — ação inválida.`);
      if (rule.kind === 'alternating' && rule.action === 'hours') errors.push(`${label} — alternância deve definir trabalho e folga.`);
      if (rule.action !== 'rest' || rule.kind === 'alternating') {
        const total = duration(rule.shiftStart, rule.shiftEnd);
        const interval = rule.breakStart || rule.breakEnd ? duration(rule.breakStart, rule.breakEnd) : 0;
        const offset = duration(rule.shiftStart, rule.breakStart);
        if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(interval) || (Boolean(rule.breakStart) !== Boolean(rule.breakEnd)) || (rule.breakStart && (interval <= 0 || interval > 360 || offset + interval > total)) || interval >= total) errors.push(`${label} — revise entrada, saída e intervalo.`);
      }
    }
  }
  return [...new Set(errors)];
}

export function matchesDayRule(rule, date, holiday, userId) {
  if (rule.enabled === false || (rule.userIds?.length && !rule.userIds.includes(String(userId)))) return false;
  if (rule.startDate && date < rule.startDate) return false;
  if (rule.endDate && date > rule.endDate) return false;
  if (rule.kind === 'holiday') return holiday;
  if (rule.kind === 'date') return date >= rule.startDate && date <= (rule.endDate || rule.startDate);
  if (!rule.weekdays?.includes(weekday(date))) return false;
  if (rule.kind === 'monthly') {
    const occurrence = Math.ceil(Number(date.slice(8)) / 7);
    return rule.occurrences.includes(occurrence) || (rule.occurrences.includes(-1) && shiftDate(date, 7).slice(0, 7) !== date.slice(0, 7));
  }
  return true;
}

function ruleResult(rule, date, base) {
  let action = rule.action;
  if (rule.kind === 'alternating') {
    const weeks = Math.round((stamp(monday(date)) - stamp(monday(rule.referenceDate))) / (7 * DAY));
    action = (Math.abs(weeks) % 2 === 0) === Boolean(rule.referenceWorks) ? 'work' : 'rest';
  }
  if (action === 'hours' && !isWorking(base)) return null;
  if (rule.kind === 'holiday' && action === 'work' && !isWorking(base) && !rule.holidayMayActivate) return null;
  if (action === 'rest') return { status: 'Folga', shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0 };
  return { status: rule.status || 'Presencial', shiftStart: rule.shiftStart, shiftEnd: rule.shiftEnd, breakStart: rule.breakStart || '', breakEnd: rule.breakEnd || '', breakMinutes: rule.breakStart && rule.breakEnd ? duration(rule.breakStart, rule.breakEnd) : 0 };
}

export function resolveDayRules(group, date, holiday, userId, base) {
  // Explicit dates > individual rules > holidays > recurring group rules.
  const candidates = (group?.dayRules || []).filter(rule => matchesDayRule(rule, date, holiday, userId)).map(rule => ({
    rule, rank: (rule.kind === 'date' ? 400 : rule.userIds?.length ? 300 : rule.kind === 'holiday' ? 200 : 100) + Math.max(0, Math.min(9, Number(rule.priority) || 0)),
  })).sort((a, b) => b.rank - a.rank);
  // Resolve lower priorities first so holiday hours preserve recurring rest days.
  let result = base;
  let reason = base.ruleReason || 'Jornada padrão e distribuição de folgas';
  let conflicts = [];
  const ranks = [...new Set([...candidates.map(item => item.rank), ...(holiday ? [199] : [])])].sort((a, b) => a - b);
  for (const rank of ranks) {
    if (rank === 199 && base.holidayCountsAsRest !== false && !candidates.some(item => item.rule.kind === 'holiday')) {
      result = { ...result, status: 'Folga', shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0 };
      reason = 'Feriado conforme a regra padrão';
      conflicts = [];
    }
    const choices = candidates.filter(item => item.rank === rank).map(({ rule }) => ({ rule, value: ruleResult(rule, date, result) })).filter(item => item.value);
    if (!choices.length) continue;
    conflicts = new Set(choices.map(item => JSON.stringify(item.value))).size > 1 ? choices.map(item => item.rule.name) : [];
    result = { ...result, ...choices[0].value };
    reason = choices.map(item => item.rule.name).join(' + ');
  }
  return { ...result, groupId: group?.id || '', groupName: group?.name || 'Padrão da empresa', ruleReason: reason, ruleConflicts: conflicts, ruleApplied: candidates.length > 0 };
}

export function previousScheduleForDate(userId, date, history = [], firstDate = date) {
  if (!dateValid(date) || !dateValid(firstDate)) return null;
  const cutoff = shiftDate(firstDate, -1);
  return history.filter(row => String(row.userId) === String(userId) && isWorking(row) && !row.ruleApplied && !row.manuallyAdjusted && !row.locked && !row.pinned && dateValid(row.startDate) && (!row.endDate || dateValid(row.endDate)) && row.startDate < firstDate && row.shiftStart && (row.baseShiftEnd || row.shiftEnd)).map(row => {
    const last = (row.endDate || row.startDate) < cutoff ? (row.endDate || row.startDate) : cutoff;
    const matchingDate = shiftDate(last, (weekday(date) - weekday(last) - 7) % 7);
    return { row, matchingDate };
  }).filter(item => item.matchingDate >= item.row.startDate).sort((a, b) => b.matchingDate.localeCompare(a.matchingDate) || Number(b.row.updatedAt || b.row.createdAt || 0) - Number(a.row.updatedAt || a.row.createdAt || 0))[0]?.row || null;
}

function employeeScheduleBase(userId, rules, history, firstDate, group, date = firstDate) {
  const shift = (rules.shifts || []).find(item => item.id === group?.shiftId);
  const shiftPolicy = shift ? Object.fromEntries(['shiftStart', 'shiftEnd', 'breakStart', 'breakEnd'].map(key => [key, shift[key] || ''])) : {};
  const groupPolicy = { ...shiftPolicy, ...Object.fromEntries(Object.entries(group?.policy || {}).filter(([, value]) => value !== '' && value != null)) };
  const policy = { workDaysPerWeek: rules.workDaysPerWeek, hoursPerWeek: rules.hoursPerWeek, restEveryDays: rules.restEveryDays,
    shiftStart: rules.shiftStart, shiftEnd: rules.shiftEnd, breakStart: rules.breakStart, breakEnd: rules.breakEnd,
    minRestHours: rules.minRestHours, maxDailyHours: rules.maxDailyHours, maxWeeklyHours: rules.maxWeeklyHours,
    maxExtraHoursPerDay: rules.maxExtraHoursPerDay, limitSeverity: rules.limitSeverity, ...groupPolicy };
  const override = rules.employeeOverrides?.[userId] || {};
  const previous = rules.reuseLastSchedule ? previousScheduleForDate(userId, date, history, firstDate) : null;
  const base = { status: 'Presencial', shiftStart: override.shiftStart || groupPolicy.shiftStart || previous?.shiftStart || policy.shiftStart, shiftEnd: override.shiftEnd || groupPolicy.shiftEnd || previous?.baseShiftEnd || previous?.shiftEnd || policy.shiftEnd, breakStart: groupPolicy.breakStart ?? previous?.breakStart ?? policy.breakStart, breakEnd: groupPolicy.breakEnd ?? previous?.breakEnd ?? policy.breakEnd };
  return { base, policy, override, previous };
}

function workRowForDate(base, override, date) {
  const shiftEnd = weekday(date) === 6 && override.saturdayEnd ? override.saturdayEnd : base.shiftEnd;
  const intervalFits = base.breakStart && base.breakEnd && duration(base.shiftStart, base.breakStart) + duration(base.breakStart, base.breakEnd) <= duration(base.shiftStart, shiftEnd);
  return { ...base, shiftEnd, breakStart: intervalFits ? base.breakStart : '', breakEnd: intervalFits ? base.breakEnd : '', breakMinutes: intervalFits ? duration(base.breakStart, base.breakEnd) : 0 };
}

export function holidayWorkTemplate(userId, date, rules, history = [], firstDate = date) {
  const group = normalizeRuleGroups(rules.ruleGroups).find(item => item.userIds.includes(String(userId)));
  const { base, override } = employeeScheduleBase(userId, rules, history, firstDate, group, date);
  return workRowForDate(base, override, date);
}

export function validateHolidayAssignments(assignments, holidays, userIds) {
  for (const date of holidays) for (const userId of userIds) {
    const item = assignments?.[date]?.[userId];
    if (!item) continue;
    if (!['Presencial', 'Home Office', 'Folga'].includes(item.status)) return `Feriado de ${date}: escolha trabalho ou folga.`;
    if (!isWorking(item)) continue;
    const total = duration(item.shiftStart, item.shiftEnd);
    const interval = item.breakStart || item.breakEnd ? duration(item.breakStart, item.breakEnd) : 0;
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(interval) || Boolean(item.breakStart) !== Boolean(item.breakEnd) || interval >= total || (item.breakStart && (interval <= 0 || interval > 360 || duration(item.shiftStart, item.breakStart) + interval > total))) return `Feriado de ${date}: revise entrada, saída e intervalo da escala individual.`;
  }
  return '';
}

export function buildRuleSchedule({ dates, users, rules, holidays, history = [], getDepartment = () => '' }) {
  const holidaySet = new Set(holidays);
  const groups = normalizeRuleGroups(rules.ruleGroups);
  const proposals = [];
  for (const [userIndex, user] of users.entries()) {
    const group = groups.find(item => item.userIds.includes(String(user.id)));
    const { policy } = employeeScheduleBase(user.id, rules, history, dates[0], group);
    const workDays = Number(policy.workDaysPerWeek);
    const restEvery = Number(policy.restEveryDays);
    const weeks = [...new Set(dates.map(monday))];
    for (const weekKey of weeks) {
      const weekDates = Array.from({ length: 7 }, (_, i) => shiftDate(weekKey, i));
      const rows = weekDates.map(date => {
        const { base, override, previous } = employeeScheduleBase(user.id, rules, history, dates[0], group, date);
        const holiday = holidaySet.has(date);
        const allowed = (group?.weekdays || rules.allowedWeekdays).includes(weekday(date));
        const defaultRow = { ...workRowForDate(base, override, date), status: allowed ? 'Presencial' : 'Folga', holidayCountsAsRest: rules.holidaysCountAsRest !== false };
        let resolved = resolveDayRules(group, date, holiday, user.id, defaultRow);
        // A fixed work/rest rule pins the day; an hours-only rule leaves room for a rotating rest day.
        let pinned = (group?.dayRules || []).some(rule => matchesDayRule(rule, date, holiday, user.id) && rule.action !== 'hours' && !(rule.kind === 'holiday' && rule.action === 'work' && !rule.holidayMayActivate));
        const assignment = holiday && rules.holidayAssignments?.[date]?.[user.id];
        if (assignment) {
          const working = isWorking(assignment);
          resolved = { ...resolved, status: assignment.status, shiftStart: working ? assignment.shiftStart : '', shiftEnd: working ? assignment.shiftEnd : '', breakStart: working ? assignment.breakStart || '' : '', breakEnd: working ? assignment.breakEnd || '' : '', breakMinutes: working && assignment.breakStart && assignment.breakEnd ? duration(assignment.breakStart, assignment.breakEnd) : 0, ruleReason: 'Feriado configurado individualmente', ruleConflicts: [], ruleApplied: true, holidayConfigured: true };
          pinned = true;
        }
        return { ...resolved, workTemplate: isWorking(resolved) && !resolved.ruleConflicts?.length ? Object.fromEntries(['status', 'shiftStart', 'shiftEnd', 'breakStart', 'breakEnd', 'breakMinutes'].map(key => [key, resolved[key]])) : null, date, holiday, holidayWorkingDay: holiday && rules.holidaysCountAsRest === false, pinned, allowed: allowed || Boolean(assignment && isWorking(assignment)), userId: String(user.id), userName: user.name, dept: getDepartment(user), key: `${user.id}-${date}`, weekKey, extraHours: 0, reusedPattern: Boolean(previous), sourceScheduleId: previous?.id || '' };
      });
      const pinnedWork = rows.filter(row => row.pinned && isWorking(row)).length;
      const flexible = rows.filter(row => !row.pinned && isWorking(row));
      const desired = Math.max(pinnedWork, workDays);
      const restCount = Math.max(0, flexible.length - Math.max(0, desired - pinnedWork));
      const weekNumber = Math.floor(stamp(weekKey) / (7 * DAY));
      const restSet = new Set();
      for (let i = 0; i < restCount; i++) restSet.add(flexible[((userIndex + weekNumber + i) % flexible.length + flexible.length) % flexible.length]?.date);
      rows.forEach(row => {
        const existing = history.find(item => String(item.userId) === String(user.id) && item.startDate <= row.date && item.endDate >= row.date);
        if (!dates.includes(row.date) && existing) Object.assign(row, existing, { date: row.date });
        else if (restSet.has(row.date)) Object.assign(row, { status: 'Folga', ruleReason: 'Folga distribuída para cumprir os dias de trabalho', ruleApplied: false });
      });
      // Preserve fixed rules. Prefer another flexible day when the rest limit is reached.
      let streak = 0;
      for (let i = 1; i < restEvery; i++) {
        const date = shiftDate(weekKey, -i);
        const row = proposals.find(row => row.userId === String(user.id) && row.date === date) || history.find(row => String(row.userId) === String(user.id) && row.startDate <= date && row.endDate >= date);
        if (!isWorking(row)) break;
        streak++;
      }
      rows.forEach(row => {
        if (isWorking(row) && streak >= restEvery - 1 && !row.pinned && dates.includes(row.date)) {
          Object.assign(row, { status: 'Folga', ruleReason: 'Descanso pelo limite de dias consecutivos' });
        }
        streak = isWorking(row) ? streak + 1 : 0;
        if (!isWorking(row)) Object.assign(row, { shiftStart: '', shiftEnd: '', breakStart: '', breakEnd: '', breakMinutes: 0 });
      });
      const visible = rows.filter(row => dates.includes(row.date));
      const target = Number(policy.hoursPerWeek) * Math.min(1, visible.length / 7);
      visible.forEach(row => proposals.push({ ...row, restEveryDays: restEvery, workDaysPerWeek: workDays, weekHoursTarget: Number(target.toFixed(2)), plannedWorkDays: rows.filter(isWorking).length, shift: isWorking(row) ? `${row.shiftStart}-${row.shiftEnd}` : row.status,
        minRestHours: Number(policy.minRestHours) || 0, maxDailyHours: Number(policy.maxDailyHours) || 24, maxWeeklyHours: Number(policy.maxWeeklyHours) || 84,
        maxExtraHoursPerDay: Number.isFinite(Number(policy.maxExtraHoursPerDay)) ? Number(policy.maxExtraHoursPerDay) : 12, limitSeverity: policy.limitSeverity || 'blocking',
        rulesVersion: Number(rules.version) || 1, rulesName: rules.name || 'Regra padrão da empresa', profileName: group?.name || 'Padrão da empresa' }));
    }
  }
  return proposals;
}

export function scheduleRuleIssues(rows, history = []) {
  const issues = [];
  for (const row of rows) {
    if (row.ruleConflicts?.length) issues.push({ key: row.key, rowKey: row.key, userId: String(row.userId), field: 'status', code: 'rule-conflict', hint: 'Revise as regras indicadas ou escolha manualmente a situação e os horários somente deste dia.', date: row.date, blocking: true, message: `${row.userName}: conflito entre ${row.ruleConflicts.join(' e ')}.` });
    if (row.preservedExisting || !isWorking(row)) continue;
    const total = duration(row.shiftStart, row.shiftEnd);
    const interval = row.breakStart || row.breakEnd ? duration(row.breakStart, row.breakEnd) : 0;
    issues.push(...scheduleRowFieldIssues(row));
    const dayHours = (total - interval) / 60 + Number(row.extraHours || 0);
    const blocking = row.limitSeverity !== 'warning';
    if (dayHours > Number(row.maxDailyHours || 24) + 0.001) issues.push({ key: row.key, rowKey: row.key, userId: String(row.userId), field: Number(row.extraHours) > 0 ? 'extraHours' : 'shiftEnd', code: 'daily-limit', hint: 'Reduza a hora extra ou corrija a saída base para respeitar o limite diário indicado.', date: row.date, blocking, message: `${row.userName}: jornada de ${dayHours.toFixed(2).replace('.', ',')}h supera o limite diário de ${Number(row.maxDailyHours).toFixed(2).replace('.', ',')}h.` });
    if (Number(row.extraHours || 0) > Number(row.maxExtraHoursPerDay ?? 12) + 0.001) issues.push({ key: row.key, rowKey: row.key, userId: String(row.userId), field: 'extraHours', code: 'overtime-limit', hint: 'Reduza a hora extra para o máximo diário permitido no perfil.', date: row.date, blocking, message: `${row.userName}: hora extra supera o limite diário do perfil.` });
  }
  for (const userId of new Set(rows.map(row => row.userId))) {
    const personRows = rows.filter(row => row.userId === userId).sort((a, b) => a.date.localeCompare(b.date));
    const limit = personRows[0]?.restEveryDays;
    if (!limit) continue;
    const first = shiftDate(personRows[0].date, -limit);
    const last = shiftDate(personRows.at(-1).date, limit);
    let streak = 0;
    for (let date = first; date <= last; date = shiftDate(date, 1)) {
      const planned = personRows.find(row => row.date === date);
      const existing = history.find(row => String(row.userId) === userId && row.startDate <= date && row.endDate >= date);
      const row = planned || existing;
      streak = isWorking(row) ? streak + 1 : 0;
      if (streak >= limit && (planned || (date > personRows.at(-1).date && shiftDate(date, -(streak - 1)) <= personRows.at(-1).date))) issues.push({ key: `${userId}-${date}`, rowKey: planned?.key || personRows.at(-1).key, userId, field: 'status', code: 'consecutive-days', hint: 'Defina uma folga na sequência indicada ou revise a regra de revezamento desta pessoa.', date, blocking: true, message: `${personRows[0].userName}: ${streak} dias consecutivos de trabalho (limite configurado: ${limit - 1}).` });
    }
    for (const weekKey of new Set(personRows.map(row => row.weekKey))) {
      const week = personRows.filter(row => row.weekKey === weekKey);
      if (week.length !== 7) continue;
      const count = week.filter(isWorking).length;
      const hours = week.filter(isWorking).reduce((sum, row) => sum + (duration(row.shiftStart, row.shiftEnd) - (row.breakStart && row.breakEnd ? duration(row.breakStart, row.breakEnd) : 0)) / 60 + Number(row.extraHours || 0), 0);
      const target = week[0].weekHoursTarget;
      const maxWeekly = Number(week[0].maxWeeklyHours || 84);
      if (hours > maxWeekly + 0.02) issues.push({ key: `${userId}-${weekKey}`, rowKey: (week.find(row => Number(row.extraHours) > 0) || week.filter(isWorking).at(-1) || week[0]).key, userId, field: week.some(row => Number(row.extraHours) > 0) ? 'extraHours' : 'shiftEnd', code: 'weekly-limit', hint: 'Revise as horas extras e as saídas desta pessoa ao longo da semana para respeitar o limite semanal.', date: weekKey, blocking: week[0].limitSeverity !== 'warning', message: `${personRows[0].userName}: semana com ${hours.toFixed(2).replace('.', ',')}h supera o limite de ${maxWeekly.toFixed(2).replace('.', ',')}h.` });
      if (count !== week[0].workDaysPerWeek || Math.abs(hours - target) > 0.02) issues.push({ key: `${userId}-${weekKey}`, rowKey: week[0].key, userId, field: 'status', code: 'weekly-target', hint: 'Confira os dias e horários previstos nesta semana. A meta é um aviso e não altera os horários automaticamente.', date: weekKey, blocking: false, message: `${week[0].userName}: semana de ${weekKey.split('-').reverse().join('/')} com ${count} dia(s) de trabalho e ${hours.toFixed(2).replace('.', ',')}h; confira a meta e as jornadas especiais.` });
    }
    const plannedByDate = new Map(personRows.map(row => [row.date, row]));
    const at = date => plannedByDate.get(date) || history.find(row => String(row.userId) === userId && (row.startDate || row.date) <= date && (row.endDate || row.date || row.startDate) >= date);
    for (let date = shiftDate(personRows[0].date, -1); date <= personRows.at(-1).date; date = shiftDate(date, 1)) {
      const nextDate = shiftDate(date, 1), previous = at(date), next = at(nextDate);
      if (!isWorking(previous) || !isWorking(next) || (!plannedByDate.has(date) && !plannedByDate.has(nextDate))) continue;
      const previousEnd = timeMinutes(previous.baseShiftEnd || previous.shiftEnd), previousStart = timeMinutes(previous.shiftStart), nextStart = timeMinutes(next.shiftStart);
      if (![previousEnd, previousStart, nextStart].every(Number.isFinite)) continue;
      const extra = (previous.baseShiftEnd || plannedByDate.has(date)) ? Number(previous.extraHours || 0) * 60 : 0;
      const end = previousEnd + (previousEnd <= previousStart ? 1440 : 0) + extra;
      const rest = (1440 + nextStart - end) / 60, minimum = Number(next.minRestHours || previous.minRestHours || 0);
      if (minimum > 0 && rest + 0.001 < minimum) issues.push({ key: `${userId}-${nextDate}`, rowKey: (plannedByDate.get(nextDate) || plannedByDate.get(date))?.key, userId, field: plannedByDate.has(nextDate) ? 'shiftStart' : 'shiftEnd', code: 'between-shifts', hint: 'Ajuste a entrada deste dia ou a saída do dia anterior para garantir o descanso mínimo indicado.', date: nextDate, blocking: next.limitSeverity !== 'warning', message: `${personRows[0].userName}: descanso de ${Math.max(0, rest).toFixed(2).replace('.', ',')}h entre jornadas; mínimo configurado: ${minimum.toFixed(2).replace('.', ',')}h.` });
    }
  }
  return issues;
}

