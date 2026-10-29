const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const clockMinutes = value => clockPattern.test(String(value || '')) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const dayStamp = value => Date.parse(`${value}T00:00:00Z`) / 60000;
const active = (record, date) => date >= (record.startDate || record.date || '') && date <= (record.endDate || record.date || record.startDate || '');
const shiftDate = (date, days) => new Date((dayStamp(date) + days * 1440) * 60000).toISOString().slice(0, 10);

function absenceInterval(absence, occurrenceDate) {
  if (!active(absence, occurrenceDate)) return null;
  const day = dayStamp(occurrenceDate), start = clockMinutes(absence.startTime), end = clockMinutes(absence.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return [day, day + 1440];
  return [day + start, day + end + (end < start ? 1440 : 0)];
}

export function absenceOverlapsShift(absence, date, shiftStart, shiftEnd) {
  const start = clockMinutes(shiftStart), end = clockMinutes(shiftEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;
  const day = dayStamp(date), shift = [day + start, day + end + (end < start ? 1440 : 0)];
  return [-1, 0, 1].some(offset => {
    const interval = absenceInterval(absence, shiftDate(date, offset));
    return interval && interval[0] < shift[1] && interval[1] > shift[0];
  });
}

export function findScheduleAbsence(absences, userId, date, shiftStart, shiftEnd) {
  return absences.find(absence => String(absence.userId) === String(userId) && absenceOverlapsShift(absence, date, shiftStart, shiftEnd));
}

export function isFullDayAbsence(absence, date) {
  if (!absence || !active(absence, date)) return false;
  const start = clockMinutes(absence.startTime), end = clockMinutes(absence.endTime);
  return !Number.isFinite(start) || !Number.isFinite(end) || start === end;
}
