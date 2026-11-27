export const bandNames = ['I · A', 'I · B', 'I · C', 'II · A', 'II · B', 'II · C', 'III · A', 'III · B', 'III · C'];

function salaryFactor(draft, index) {
  return (1 + Number(draft.levelRate) / 100) ** Math.floor(index / 3) * (1 + Number(draft.bandRate) / 100) ** (index % 3);
}

export function salaryBands(draft) {
  const floor = Math.max(Number(draft.cct), Number(draft.minimum), Number(draft.base));
  return bandNames.map((label, index) => {
    const calculated = Math.round(floor * salaryFactor(draft, index) * 100) / 100;
    return { label, calculated, value: (draft.overrides?.[index] ?? '') === '' ? calculated : Number(draft.overrides[index]) };
  });
}

export function adjustSalaryBand(draft, index, amount, mode) {
  if (!Number.isInteger(index) || index < 0 || index >= bandNames.length
    || !['single', 'progression'].includes(mode) || !Number.isFinite(amount) || amount <= 0 || amount > 10000000) return null;
  amount = Math.round(amount * 100) / 100;
  if (!amount) return null;
  const overrides = bandNames.map((_, position) => String(draft.overrides?.[position] ?? ''));
  if (mode === 'single') {
    if (amount < salaryBands(draft)[0].calculated) return null;
    overrides[index] = salaryBands(draft)[index].calculated === amount ? '' : String(amount);
    return { ...draft, overrides };
  }
  const base = Math.round(amount / salaryFactor(draft, index) * 100) / 100;
  if (!(base > 0 && base >= Math.max(Number(draft.cct), Number(draft.minimum)))) return null;
  const next = { ...draft, base: String(base), overrides: bandNames.map(() => '') };
  if (salaryBands(next)[index].calculated !== amount) next.overrides[index] = String(amount);
  return next;
}

const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

export function completeMonths(start, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '') || start > today) return null;
  const [year, month, day] = start.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
  const lastDay = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  return (currentYear - year) * 12 + currentMonth - month - Number(currentDay < Math.min(day, lastDay));
}

export function timelyDeliveries(activities, employee, today) {
  if (!activities) return null;
  const start = new Date(Date.parse(today + 'T12:00:00Z') - 89 * 86400000).toISOString().slice(0, 10);
  let total = 0;
  let onTime = 0;
  for (const activity of activities) {
    if (activity.status !== 'resolved' || !activity.dueDate || !activity.assigneeIds?.includes(employee) || !activity.resolvedAt) continue;
    const date = new Date(activity.resolvedAt);
    if (!Number.isFinite(date.getTime())) continue;
    const day = dateFormat.format(date);
    if (day < start || day > today) continue;
    total++;
    if (day <= activity.dueDate) onTime++;
  }
  return total ? { total, onTime } : null;
}

export function salaryPosition(pay, plan) {
  if (!pay || !plan || plan.hierarchyOnly) return 'Sem referência';
  const cents = amount => Math.round(amount * 100);
  const bands = salaryBands(plan);
  const current = cents(pay.amount);
  const exact = bands.filter(band => cents(band.value) === current);
  if (exact.length === 1) return exact[0].label;
  if (exact.length > 1) return 'Valor compartilhado por várias faixas';
  const values = bands.map(band => cents(band.value));
  if (current < Math.min(...values)) return 'Abaixo da matriz';
  if (current > Math.max(...values)) return 'Acima da matriz';
  return 'Entre faixas';
}
