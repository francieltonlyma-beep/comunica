import { scheduleTone } from './scheduleCalendarModel.js';

const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const personKey = record => record.userId != null ? String(record.userId) : `legacy:${normalized(record.userName) || record.id}`;
export const teamScheduleCode = status => status === 'Feriado' ? 'FE' : ({ work: 'P', remote: 'HO', off: 'F', vacation: 'V', absence: 'A' }[scheduleTone(status)] || 'P');

// Days already contain the calendar's filtered records. Seed registered people too,
// so an empty cell means no published assignment, rather than an assumed day off.
export function teamMonthRows(days, employees, { filters = {}, getDepartments = user => user.depts || [], showAbsences = true } = {}) {
  const { department = 'all', employee = 'all', status = 'all', search = '' } = filters;
  const people = new Map(employees.map(user => [String(user.id), user]));
  const rows = new Map();
  const ensure = (key, user, record) => {
    if (!rows.has(key)) rows.set(key, { key, userId: user?.id != null ? String(user.id) : record?.userId != null ? String(record.userId) : '',
      name: user?.name || record?.userName || 'Sem identificação', role: user?.role || '',
      departments: user ? getDepartments(user) : [record?.dept].filter(Boolean),
      cells: days.map(day => ({ date: day.date, schedules: [], absences: [] })) });
    return rows.get(key);
  };
  for (const user of employees) if ((department === 'all' || getDepartments(user).includes(department))
    && (employee === 'all' || String(user.id) === String(employee))
    && normalized(`${user.name} ${user.role || ''}`).includes(normalized(search).trim())) ensure(String(user.id), user);
  days.forEach((day, index) => {
    for (const kind of showAbsences ? ['schedules', 'absences'] : ['schedules']) for (const record of day[kind] || []) {
      const key = personKey(record);
      ensure(key, people.get(key), record).cells[index][kind].push(record);
    }
  });
  return [...rows.values()].filter(row => status === 'all' || row.cells.some(cell => cell.schedules.length || cell.absences.length))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function teamDaySummary(cell) {
  const absence = cell.absences.find(item => !item.startTime || !item.endTime || item.startTime === item.endTime);
  const primary = absence || cell.schedules[0] || cell.absences[0];
  const tone = absence ? (/f[eé]rias/i.test(absence.reason || '') ? 'vacation' : 'absence') : cell.schedules[0]?.status === 'Feriado' ? 'holiday' : !cell.schedules.length && cell.absences.length ? (/f[eé]rias/i.test(primary.reason || '') ? 'vacation' : 'absence') : primary ? scheduleTone(primary.status || 'Ausência') : 'empty';
  const code = absence ? (tone === 'vacation' ? 'V' : 'A') : cell.schedules.length > 1 ? `${cell.schedules.length} reg.` : cell.schedules.length ? teamScheduleCode(primary.status) : primary ? 'A' : '—';
  const description = [...cell.schedules.map(item => `${item.status}${item.shiftStart && item.shiftEnd ? ` ${item.shiftStart}–${item.shiftEnd}` : ''}`), ...cell.absences.map(item => `${item.reason || 'Ausência'}${item.startTime && item.endTime && item.startTime !== item.endTime ? ` ${item.startTime}–${item.endTime}` : ' (dia inteiro)'}`)].join('; ') || 'Sem registro publicado';
  return { code, tone, description, partial: Boolean(!absence && cell.absences.length && cell.schedules.length),
    hours: !absence && cell.schedules.length === 1 && ['Presencial', 'Home Office'].includes(cell.schedules[0].status) && cell.schedules[0].shiftStart && cell.schedules[0].shiftEnd ? `${cell.schedules[0].shiftStart}–${cell.schedules[0].shiftEnd}` : '',
    fixed: cell.schedules.some(item => item.locked || item.manuallyAdjusted) };
}
