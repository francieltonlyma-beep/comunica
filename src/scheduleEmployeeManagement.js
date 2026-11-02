import { scheduleTone } from './scheduleCalendarModel.js';
const clock = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
export function employeeMonthSummary(cells) {
  const result = { hours: 0, extra: 0, work: 0, off: 0, vacation: 0, absence: 0, holiday: 0, empty: 0, days: [] };
  for (const cell of cells) {
    const working = cell.schedules.filter(item => item.status !== 'Feriado' && ['work', 'remote'].includes(scheduleTone(item.status)));
    const tones = cell.schedules.map(item => scheduleTone(item.status));
    const day = { ...cell, hours: 0, extra: 0, review: cell.schedules.length > 1 };
    if (working.length) result.work++;
    if (tones.includes('off')) result.off++;
    if (tones.includes('vacation')) result.vacation++;
    if (cell.absences.length || tones.includes('absence')) result.absence++;
    if (!working.length && cell.schedules.some(item => item.status === 'Feriado')) result.holiday++;
    if (!cell.schedules.length && !cell.absences.length) result.empty++;
    for (const item of working) {
      const start = clock(item.shiftStart), end = clock(item.shiftEnd);
      const pause = item.breakStart && item.breakEnd ? (clock(item.breakEnd) - clock(item.breakStart) + 1440) % 1440 : Number(item.breakMinutes || 0);
      // shiftEnd already includes extra time: do not add extraHours again.
      const hours = ((end - start + 1440) % 1440 - pause) / 60;
      const extra = Number(item.extraHours || 0);
      if (![hours, pause, extra].every(Number.isFinite) || hours <= 0 || pause < 0 || extra < 0 || extra > hours) day.review = true;
      else { day.hours += hours; day.extra += extra; }
    }
    if (day.review) { day.hours = 0; day.extra = 0; }
    result.hours += day.hours; result.extra += day.extra; result.days.push(day);
  }
  return result;
}
