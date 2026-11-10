export function employeeAccessMillis(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  if (value && typeof value.toMillis === 'function') return employeeAccessMillis(value.toMillis());
  if (value && typeof value.seconds === 'number') return employeeAccessMillis(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
  const parsed = typeof value === 'string' && value.trim() ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function employeeAccessLabel(value, locale = 'pt-BR', timeZone = 'America/Sao_Paulo') {
  const millis = employeeAccessMillis(value);
  if (!millis || millis > Date.now() + 5 * 60 * 1000) return null;
  const date = new Date(millis);
  return {
    date: date.toLocaleDateString(locale, {timeZone}),
    time: date.toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit', timeZone}),
  };
}
