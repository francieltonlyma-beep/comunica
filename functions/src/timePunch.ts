type PunchType = 'entry' | 'breakStart' | 'breakEnd' | 'exit';
type Mark = {at: Date; type?: string};
type Schedule = {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  updatedAt?: number;
  createdAt?: number;
};

const zone = 'America/Sao_Paulo';
const calendar = new Intl.DateTimeFormat('sv-SE', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'});
const clock = new Intl.DateTimeFormat('pt-BR', {timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit'});

export function punchDays(now: Date) {
  const today = calendar.format(now);
  const start = new Date(today + 'T00:00:00-03:00');
  const previousStart = new Date(start.getTime() - 86_400_000);
  return {today, start, previous: calendar.format(previousStart), previousStart};
}

function scheduleFor(schedules: Schedule[], date: string) {
  return schedules.filter(schedule => {
    const start = schedule.startDate || schedule.date;
    const end = schedule.endDate || schedule.date || start;
    return start && end && start <= date && date <= end &&
      (schedule.status === 'Presencial' || schedule.status === 'Home Office') &&
      schedule.shiftStart && schedule.shiftEnd;
  }).sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))[0];
}

function nextType(last: string | undefined, schedule: Schedule | undefined): PunchType {
  switch (last) {
    case 'entry': return !schedule || (schedule.breakStart && schedule.breakEnd) ? 'breakStart' : 'exit';
    case 'breakStart': return 'breakEnd';
    case 'breakEnd': return 'exit';
    default: return 'entry';
  }
}

function lastType(marks: Mark[], schedule: Schedule | undefined): string | undefined {
  // Approved adjustments have a timestamp but no stored type.
  return marks.reduce<string | undefined>((last, mark) => mark.type || nextType(last, schedule), undefined);
}

export function automaticPunchType(now: Date, marks: Mark[], schedules: Schedule[]): PunchType {
  const {today, start, previous} = punchDays(now);
  const todaySchedule = scheduleFor(schedules, today);
  const previousSchedule = scheduleFor(schedules, previous);
  const overnightEnd = previousSchedule?.shiftStart && previousSchedule.shiftEnd &&
    previousSchedule.shiftEnd < previousSchedule.shiftStart ? previousSchedule.shiftEnd : '';
  const time = clock.format(now);
  if (overnightEnd && (time <= overnightEnd || (todaySchedule?.shiftStart && time < todaySchedule.shiftStart))) {
    const lastYesterday = lastType(marks.filter(mark => mark.at < start), previousSchedule);
    if (lastYesterday && lastYesterday !== 'exit') return nextType(lastType(marks, previousSchedule), previousSchedule);
  }
  return nextType(lastType(marks.filter(mark => mark.at >= start), todaySchedule), todaySchedule);
}
