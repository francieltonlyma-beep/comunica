const working = row => ['Presencial', 'Home Office'].includes(row?.status);
const minutes = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN;
const duration = (start, end) => (minutes(end) - minutes(start) + 1440) % 1440;

export function scheduleRowFieldIssues(row) {
  if (!working(row) || row.preservedExisting || row.preservedAbsence) return [];
  const issues = [];
  const add = (field, code, message, hint) => issues.push({ key: row.key, rowKey: row.key, userId: String(row.userId), date: row.date, field, code, blocking: true, message: `${row.userName || 'Colaborador'}: ${message}`, hint });
  for (const [field, label] of [['shiftStart', 'entrada'], ['shiftEnd', 'saída base']]) if (!Number.isFinite(minutes(row[field]))) add(field, 'missing-time', `horário de ${label} inválido.`, `Preencha a ${label} com o horário correto do turno deste dia.`);
  const total = duration(row.shiftStart, row.shiftEnd);
  if (total === 0) add('shiftEnd', 'zero-shift', 'entrada e saída estão iguais.', 'Informe a saída base diferente da entrada. Para folga, mude a situação do dia.');
  if (Boolean(row.breakStart) !== Boolean(row.breakEnd)) add(row.breakStart ? 'breakEnd' : 'breakStart', 'incomplete-break', 'intervalo incompleto.', 'Informe o início e o fim do intervalo, ou apague os dois para uma jornada sem intervalo.');
  else if (row.breakStart && row.breakEnd) {
    const interval = duration(row.breakStart, row.breakEnd);
    if (!Number.isFinite(minutes(row.breakStart))) add('breakStart', 'invalid-break', 'início de intervalo inválido.', 'Informe um horário válido dentro da jornada.');
    else if (!Number.isFinite(interval) || interval <= 0 || interval > 360 || interval >= total || duration(row.shiftStart, row.breakStart) + interval > total) add('breakEnd', 'invalid-break', 'intervalo fora da jornada ou com duração inválida.', 'Ajuste início e fim do intervalo para caberem entre a entrada e a saída base, com duração de até 6 horas.');
  } else if (Number(row.breakMinutes) > 0) add('breakStart', 'unlocated-break', 'intervalo com duração, mas sem horários.', 'Informe início e fim do intervalo para conferir a cobertura da equipe.');
  const extra = Number(row.extraHours ?? 0);
  if (!Number.isFinite(extra) || extra < 0) add('extraHours', 'invalid-overtime', 'hora extra inválida.', 'Informe uma duração positiva ou 00:00.');
  else if (Number.isFinite(total) && total + extra * 60 >= 1440) add('extraHours', 'long-shift', 'jornada com hora extra de 24 horas ou mais.', 'Reduza a hora extra ou corrija a saída base; a jornada precisa ser menor que 24 horas.');
  return issues;
}

export function scheduleIssueTarget(issue, rows) {
  const row = rows.find(item => item.key === (issue.rowKey || issue.key))
    || rows.find(item => String(item.userId) === String(issue.userId) && item.date === issue.date)
    || rows.find(item => String(item.userId) === String(issue.userId) && item.date >= issue.date)
    || rows.find(item => item.date === issue.date);
  if (!row) return null;
  const field = ['status', 'shiftStart', 'shiftEnd', 'breakStart', 'breakEnd', 'extraHours'].includes(issue.field) ? issue.field : 'status';
  return { ...issue, rowKey: row.key, date: row.date, field, hint: issue.hint || 'Confira a regra aplicada a esta pessoa neste dia e ajuste o campo destacado.' };
}
