const brazilDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function careerDateInBrazil(date = new Date()) {
  const parts = Object.fromEntries(brazilDateFormatter.formatToParts(date).map(({type, value}) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isCareerDeadlineAvailable(deadline, today = careerDateInBrazil()) {
  if (deadline == null || deadline === '') return true;
  if (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false;
  const date = new Date(`${deadline}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === deadline && deadline >= today;
}

export function isCareerVacancyOpen(vacancy, today = careerDateInBrazil()) {
  return vacancy?.status === 'published' && isCareerDeadlineAvailable(vacancy.closesAt, today);
}
