import { scheduleTone } from './scheduleCalendarModel.js';

export function filterEmployeeDays(days, { status = 'all', start = '', end = '', sort = 'date' } = {}) {
  const matches = day => {
    if (status === 'all') return true;
    if (status === 'review') return day.review === true;
    const working = day.schedules.some(item => item.status !== 'Feriado' && ['work', 'remote'].includes(scheduleTone(item.status)));
    if (status === 'work') return working;
    if (status === 'off') return day.schedules.some(item => scheduleTone(item.status) === 'off');
    if (status === 'vacation') return day.schedules.some(item => scheduleTone(item.status) === 'vacation') || day.absences.some(item => /f[eé]rias/i.test(item.reason || ''));
    if (status === 'absence') return day.absences.length > 0 || day.schedules.some(item => scheduleTone(item.status) === 'absence');
    if (status === 'holiday') return !working && day.schedules.some(item => item.status === 'Feriado');
    if (status === 'empty') return !day.schedules.length && !day.absences.length;
    return true;
  };
  return days.filter(day => (!start || day.date >= start) && (!end || day.date <= end) && matches(day))
    .sort((a, b) => sort === 'recent' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
}
