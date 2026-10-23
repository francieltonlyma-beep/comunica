const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = value => timePattern.test(String(value || '')) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
const clock = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const previousDate = date => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const active = (record, date) => date >= (record.startDate || record.date || '') && date <= (record.endDate || record.date || record.startDate || '');
const working = record => ['Presencial', 'Home Office'].includes(record.status);

export function normalizeCoverageRequirements(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map(rule => ({
    id: String(rule?.id || '').slice(0, 100),
    department: String(rule?.department || '').slice(0, 100),
    start: String(rule?.start || ''), end: String(rule?.end || ''),
    minimum: Number(rule?.minimum),
    weekdays: [...new Set((Array.isArray(rule?.weekdays) ? rule.weekdays : []).map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort(),
    includeRemote: rule?.includeRemote === true,
  }));
}

export function validateCoverageRequirements(rules, departments) {
  if (!Array.isArray(rules) || rules.length > 100) return 'Cadastre no máximo 100 faixas de necessidade.';
  const ids = new Set();
  for (const rule of rules) {
    if (!rule.id || ids.has(rule.id)) return 'Cada faixa precisa de uma identificação única.';
    ids.add(rule.id);
    if (!departments.some(item => item.id === rule.department)) return 'Selecione um setor válido.';
    if (minutes(rule.start) == null || minutes(rule.end) == null || minutes(rule.start) >= minutes(rule.end)) return 'O fim da faixa deve ser posterior ao início. Para a madrugada, cadastre faixas separadas por dia.';
    if (!Number.isInteger(rule.minimum) || rule.minimum < 1 || rule.minimum > 500) return 'Informe um mínimo inteiro de 1 a 500 pessoas.';
    if (!rule.weekdays?.length || rule.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) return 'Selecione ao menos um dia da semana.';
  }
  return '';
}

// Coverage uses full sector data, independently of visual employee/status filters.
export function coverageForDay(date, requirements, { schedules = [], absences = [], employees = [], getDepartments = user => user?.depts || [] }, department = 'all') {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const yesterday = previousDate(date);
  const employeeById = new Map(employees.map(person => [String(person.id), person]));
  const results = [];
  for (const rule of requirements) {
    if (!rule.weekdays.includes(weekday) || (department !== 'all' && rule.department !== department)) continue;
    const from = minutes(rule.start), to = minutes(rule.end);
    if (from == null || to == null || from >= to || !Number.isInteger(rule.minimum) || rule.minimum < 1) continue;
    const intervals = [], unknown = new Set();
    const points = new Set([from, to]);
    const blocks = new Map();
    const addBlock = (id, start, end) => {
      if (end <= from || start >= to) return;
      const list = blocks.get(id) || [];
      list.push([start, end]); blocks.set(id, list);
      points.add(Math.max(from, start)); points.add(Math.min(to, end));
    };
    for (const absence of absences) {
      const a = minutes(absence.startTime), b = minutes(absence.endTime);
      const id = String(absence.userId || absence.userName);
      if (a == null || b == null || a === b) { if (active(absence, date)) addBlock(id, 0, 1440); continue; }
      if (active(absence, date)) addBlock(id, a, b < a ? 1440 : b);
      if (b < a && active(absence, yesterday)) addBlock(id, 0, b);
    }
    // A leave or day off must not be overridden by a stale overlapping working entry.
    for (const item of schedules.filter(item => active(item, date) && !working(item))) addBlock(String(item.userId || item.userName), 0, 1440);
    for (const item of schedules) {
      if (!working(item) || (item.status === 'Home Office' && !rule.includeRemote) || (!active(item, date) && !active(item, yesterday))) continue;
      const user = employeeById.get(String(item.userId));
      // A saved shift assignment takes precedence; fallback to the primary sector only.
      const assignedDepartment = item.dept || (user ? getDepartments(user)[0] : '');
      if (assignedDepartment !== rule.department) continue;
      const id = String(item.userId || item.userName);
      const start = minutes(item.shiftStart), end = minutes(item.shiftEnd);
      if (start == null || end == null || start === end) {
        if (active(item, date)) unknown.add(id);
        continue;
      }
      for (const [shiftDate, offset] of [[date, 0], [yesterday, -1440]]) {
        if (!active(item, shiftDate) || (offset < 0 && end > start)) continue;
        const a = start + offset, b = end + offset + (end < start ? 1440 : 0);
        if (b <= from || a >= to) continue;
        const rests = [];
        const breakStart = minutes(item.breakStart), breakEnd = minutes(item.breakEnd);
        if (breakStart != null && breakEnd != null && breakStart !== breakEnd) {
          const restStart = breakStart + offset + (end < start && breakStart < start ? 1440 : 0);
          let restEnd = breakEnd + offset + (end < start && breakEnd < start ? 1440 : 0);
          if (restEnd <= restStart) restEnd += 1440;
          if (restStart < a || restEnd > b) { unknown.add(id); continue; }
          addBlock(id, restStart, restEnd);
          rests.push([restStart, restEnd]); points.add(Math.max(from, Math.min(to, restStart))); points.add(Math.max(from, Math.min(to, restEnd)));
        } else if (Number(item.breakMinutes) > 0 || item.breakStart || item.breakEnd) {
          unknown.add(id);
          continue; // A duration alone cannot locate the break in the requested interval.
        }
        intervals.push({ id, start: a, end: b, rests });
        points.add(Math.max(from, a)); points.add(Math.min(to, b));
      }
    }
    const sorted = [...points].sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (b <= a) continue;
      const available = new Set(intervals.filter(item => item.start <= a && item.end >= b
        && !item.rests.some(([x, y]) => x < b && y > a)
        && !(blocks.get(item.id) || []).some(([x, y]) => x < b && y > a)).map(item => item.id)).size;
      const last = segments.at(-1);
      if (last && last.available === available && last.end === clock(a)) last.end = clock(b);
      else segments.push({ start: clock(a), end: clock(b), available, missing: Math.max(0, rule.minimum - available) });
    }
    const shortage = segments.some(item => item.missing > 0);
    results.push({ ...rule, segments, unknown: unknown.size, status: shortage ? (unknown.size ? 'unknown' : 'shortage') : 'sufficient' });
  }
  return {
    rules: results,
    status: results.some(item => item.status === 'shortage') ? 'shortage' : results.some(item => item.status === 'unknown') ? 'unknown' : results.length ? 'sufficient' : 'none',
    missingMax: Math.max(0, ...results.flatMap(item => item.segments.map(segment => segment.missing))),
  };
}
