export const ACTIVITY_KANBAN_COLUMNS = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'in_progress', label: 'Em andamento' },
  { id: 'overdue', label: 'Em atraso' },
  { id: 'resolved', label: 'Resolvidas' },
];

export const groupActivityRowsByStatus = (rows = []) => Object.fromEntries(
  ACTIVITY_KANBAN_COLUMNS.map(column => [column.id, rows.filter(row => row.status === column.id)]),
);

export const activityCalendarMonth = (month, rows = []) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return [];
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) return [];
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const rowsByDate = rows.reduce((grouped, row) => {
    const dueDate = String(row?.activity?.dueDate || '');
    if (dueDate.startsWith(`${month}-`)) {
      if (!grouped[dueDate]) grouped[dueDate] = [];
      grouped[dueDate].push(row);
    }
    return grouped;
  }, {});
  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    cells.push({ date, day, activities: rowsByDate[date] || [] });
  }
  while (cells.length % 7) cells.push(null);
  return cells;
};

export const shiftActivityCalendarMonth = (month, offset) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return month;
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + Number(offset || 0), 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const currentActivityCalendarMonth = (date = new Date()) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
);
