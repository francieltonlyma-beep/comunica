import { ArrowRight, ClipboardCheck, Fuel, MapPin, Truck, Wrench } from 'lucide-react';
import { fleetDate } from './fleetOperations.js';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export default function FleetOverview({
  vehicle, manager, canDrive, ownTrip, vehicleTrip, check, checkRows, today, overdueCount, metrics, fuelRows, tripRows, sources, onNavigate,
}) {
  if (!vehicle) return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="font-bold text-slate-900">Nenhum veículo disponível</h3>
    <p className="mt-1 text-sm text-slate-600">{manager ? 'Cadastre o primeiro veículo para acompanhar a operação.' : 'O gestor precisa vincular um veículo ao seu cadastro.'}</p>
    {manager && <button type="button" className="mt-3 rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white" onClick={() => onNavigate('fleet-vehicles')}>Cadastrar veículo</button>}
  </section>;

  const month = today.slice(0, 7);
  const monthFuel = fuelRows.filter(row => row.createdAt?.toDate && fleetDate(row.createdAt.toDate()).startsWith(month));
  const spent = monthFuel.reduce((total, row) => total + row.cost, 0);
  const distance = tripRows.filter(row => row.status === 'finished' && row.date.startsWith(month))
    .reduce((total, row) => total + row.endKm - row.startKm, 0);
  const todayChecks = manager ? checkRows.filter(row => row.date === today) : check ? [check] : [];
  const hasIssue = todayChecks.some(row => Object.values(row.items).includes('issue'));
  const checklistStatus = hasIssue ? 'Com irregularidade' : todayChecks.length ? 'Em ordem' : 'Pendente';
  const cards = [
    { title: 'Checklist de hoje', source: sources.checks, value: checklistStatus, icon: ClipboardCheck, destination: 'fleet-checks',
      action: canDrive ? 'Abrir checklist' : 'Ver inspeções' },
    { title: 'Viagens no mês', source: sources.trips, value: `${number.format(distance)} km`, icon: MapPin, destination: 'fleet-trips',
      action: ownTrip || vehicleTrip ? 'Abrir viagem em andamento' : 'Ver viagens e rotas' },
    { title: 'Combustível no mês', source: sources.fuel, value: currency.format(spent), icon: Fuel, destination: 'fleet-fuel',
      action: 'Ver abastecimentos', detail: metrics && `Último ciclo completo · ${number.format(metrics.consumption)} km/L` },
    ...(manager ? [{ title: 'Manutenções vencidas', source: sources.maintenance, value: number.format(overdueCount), icon: Wrench,
      destination: 'fleet-maintenance', action: 'Ver manutenções' }] : []),
  ];

  return <section aria-labelledby="fleet-overview-title">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Truck className="h-5 w-5 text-teal-800" aria-hidden="true" />
      <h3 id="fleet-overview-title" className="font-bold text-slate-900">Visão geral · {vehicle.plate}</h3>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map(({ title, source, value, icon: Icon, destination, action, detail }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon className="h-4 w-4 text-teal-800" aria-hidden="true" />{title}</div>
        <p className="mt-2 text-lg font-bold text-slate-900" aria-busy={Boolean(source.loading)}>{source.loading ? 'Carregando…' : source.error ? 'Indisponível' : value}</p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        <button type="button" className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-teal-800 underline-offset-2 hover:underline" onClick={() => onNavigate(destination)}>
          {action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </article>)}
    </div>
  </section>;
}
