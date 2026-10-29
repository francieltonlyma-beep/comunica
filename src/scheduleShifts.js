const clock = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
export const normalizeScheduleShifts = shifts => Array.isArray(shifts) ? shifts.map(shift => ({
  id: String(shift.id || ''), name: String(shift.name || '').slice(0, 80),
  shiftStart: shift.shiftStart || '', shiftEnd: shift.shiftEnd || '',
  breakStart: shift.breakStart || '', breakEnd: shift.breakEnd || '',
})) : [];

export function validateScheduleShifts(shifts, groups = []) {
  if (shifts.length > 100) return 'Cadastre no máximo 100 turnos.';
  const ids = new Set();
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  for (const shift of shifts) {
    if (!shift.id || ids.has(shift.id) || !shift.name.trim()) return 'Cada turno precisa de nome e identificação únicos.';
    ids.add(shift.id);
    if (!clock(shift.shiftStart) || !clock(shift.shiftEnd) || shift.shiftStart === shift.shiftEnd) return `${shift.name}: informe entrada e saída válidas.`;
    if (Boolean(shift.breakStart) !== Boolean(shift.breakEnd)) return `${shift.name}: informe início e fim do intervalo.`;
    if (shift.breakStart) {
      if (!clock(shift.breakStart) || !clock(shift.breakEnd)) return `${shift.name}: intervalo inválido.`;
      const span = (minutes(shift.shiftEnd) - minutes(shift.shiftStart) + 1440) % 1440;
      const offset = (minutes(shift.breakStart) - minutes(shift.shiftStart) + 1440) % 1440;
      const rest = (minutes(shift.breakEnd) - minutes(shift.breakStart) + 1440) % 1440;
      if (!rest || rest > 360 || offset + rest > span || rest >= span) return `${shift.name}: o intervalo deve ficar dentro do turno.`;
    }
  }
  if (groups.some(group => group.shiftId && !ids.has(group.shiftId))) return 'Uma turma está vinculada a um turno inexistente.';
  return '';
}
