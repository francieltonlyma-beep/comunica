export const CHECK_ITEMS = [
  ['tires', 'Pneus e estepe'],
  ['lights', 'Faróis, lanternas e setas'],
  ['brakes', 'Freios'],
  ['fluids', 'Óleo, água e vazamentos'],
  ['equipment', 'Equipamentos obrigatórios'],
];

const fleetCalendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });

export const fleetDate = (date = new Date()) => {
  const parts = fleetCalendar.formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};

export function fleetFuelMetrics(entries) {
  let previousFull;
  let liters = 0;
  let cost = 0;
  let result = null;
  for (const entry of [...entries].sort((a, b) => a.km - b.km || (a.createdAt?.toMillis?.() ?? a.createdAt ?? 0) - (b.createdAt?.toMillis?.() ?? b.createdAt ?? 0))) {
    if (previousFull) {
      liters += entry.liters;
      cost += entry.cost;
    }
    if (!entry.fullTank) continue;
    const distance = entry.km - (previousFull?.km ?? entry.km);
    if (previousFull && distance > 0 && liters > 0) result = { consumption: distance / liters, costPerKm: cost / distance };
    previousFull = entry;
    liters = 0;
    cost = 0;
  }
  return result;
}

export function fleetMaintenanceState(record, currentKm, today = fleetDate()) {
  if (record.status === 'done') return 'Concluída';
  if ((record.dueDate && today >= record.dueDate) || (record.dueKm > 0 && currentKm >= record.dueKm)) return 'Vencida';
  return 'Programada';
}

export const fleetChecklistId = (uid, vehicleId, date) => `${uid}_${vehicleId}_${date}`;

export function fleetDirectionsUrl(origin, destination) {
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', origin, destination })}`;
}

export function fleetPointUrl(point) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: `${point.lat},${point.lng}` })}`;
}
