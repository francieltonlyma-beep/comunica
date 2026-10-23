const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const calendarDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const asDate = date => new Date(`${date}T12:00:00`);

export function shiftCalendarDate(date, days) {
  const result = asDate(date);
  result.setDate(result.getDate() + days);
  return calendarDate(result);
}

export function scheduleCalendarDates(anchor, view = 'month') {
  const date = asDate(anchor);
  if (view === 'week') {
    const start = shiftCalendarDate(anchor, -date.getDay());
    return Array.from({ length: 7 }, (_, index) => shiftCalendarDate(start, index));
  }
  const first = calendarDate(new Date(date.getFullYear(), date.getMonth(), 1));
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const start = shiftCalendarDate(first, -asDate(first).getDay());
  const length = Math.ceil((asDate(first).getDay() + count) / 7) * 7;
  return Array.from({ length }, (_, index) => shiftCalendarDate(start, index));
}

export function shiftCalendarPeriod(anchor, direction, view) {
  if (view === 'week') return shiftCalendarDate(anchor, direction * 7);
  const date = asDate(anchor);
  // Start at day 1 to avoid skipping February when navigating from day 31.
  return calendarDate(new Date(date.getFullYear(), date.getMonth() + direction, 1));
}

export function scheduleTone(status) {
  const text = normalized(status);
  if (text.includes('folga')) return 'off';
  if (text.includes('ferias')) return 'vacation';
  if (text.includes('home') || text.includes('remot')) return 'remote';
  if (text.includes('ausen') || text.includes('afast') || text.includes('atestado')) return 'absence';
  return 'work';
}

export function calendarRecordsForDay(date, { schedules = [], absences = [], events = [], employees = [], getDepartments = user => user?.depts || [] }, filters = {}) {
  const { department = 'all', employee = 'all', status = 'all', search = '' } = filters;
  const query = normalized(search).trim();
  const matchesPerson = record => {
    const user = employees.find(item => String(item.id) === String(record.userId));
    const departments = user ? getDepartments(user) : [record.dept];
    return (department === 'all' || departments.includes(department) || record.dept === department)
      && (employee === 'all' || String(record.userId) === String(employee))
      && (!query || normalized(`${record.userName || user?.name || ''} ${user?.role || ''}`).includes(query));
  };
  const inRange = record => {
    const start = record.startDate || record.date;
    const end = record.endDate || record.date || start;
    return Boolean(start && date >= start && date <= end);
  };
  const seenAbsences = new Set();
  return {
    date,
    schedules: schedules.filter(record => inRange(record) && matchesPerson(record) && (status === 'all' || record.status === status))
      .sort((a, b) => String(a.shiftStart || '').localeCompare(String(b.shiftStart || '')) || String(a.userName).localeCompare(String(b.userName), 'pt-BR')),
    absences: absences.filter(record => {
      if (!inRange(record) || !matchesPerson(record)) return false;
      const key = `${record.userId || record.userName}|${record.startDate || record.date}|${record.endDate || record.date}|${normalized(record.reason)}`;
      if (seenAbsences.has(key)) return false;
      seenAbsences.add(key);
      return true;
    }),
    events: events.filter(record => record.date === date),
  };
}
