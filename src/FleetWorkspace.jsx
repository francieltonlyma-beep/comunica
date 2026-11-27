import PurchaseSelect from './PurchaseSelect.jsx';
import { useRef, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Gauge } from 'lucide-react';
import FleetOverview from './FleetOverview.jsx';
import { CHECK_ITEMS, fleetChecklistId, fleetDate, fleetDirectionsUrl, fleetFuelMetrics, fleetMaintenanceState, fleetPointUrl } from './fleetOperations.js';
import { useFleetLocation, useFleetRecords } from './useFleet.js';

const INPUT = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none';
const BUTTON = 'rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50';
const SECONDARY = 'rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const PANEL = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const dateLabel = value => value.split('-').reverse().join('/');
const dateAndTime = value => value?.toDate ? value.toDate().toLocaleString('pt-BR') : 'Sincronizando…';
const newest = (a, b) => ((b.createdAt || b.updatedAt)?.toMillis() ?? 0) - ((a.createdAt || a.updatedAt)?.toMillis() ?? 0);

function Field({ label, children, ...props }) {
  return <label className="block text-xs font-semibold text-slate-700">{label}
    {children ?? <input className={INPUT} {...props} />}
  </label>;
}

function SelectField({ label, children, ...props }) {
  return <Field label={label}><select className={INPUT} {...props}>{children}</select></Field>;
}

function Section({ title, children }) {
  return <section className={PANEL}><h3 className="mb-4 font-bold text-slate-900">{title}</h3>{children}</section>;
}

function Form({ onSubmit, saving, label, children }) {
  return <form onSubmit={async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onSubmit(new FormData(form))) form.reset();
  }} className="grid gap-3 sm:grid-cols-2">
    <fieldset disabled={saving} className="contents">{children}</fieldset>
    <div className="sm:col-span-2"><button disabled={saving} className={BUTTON}>{label}</button></div>
  </form>;
}

function RecordList({ rows, render, empty, sort = newest }) {
  const [visibleCount, setVisibleCount] = useState(15);
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return <>
    <ul className="divide-y divide-slate-100">{[...rows].sort(sort).slice(0, visibleCount).map(row =>
      <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">{render(row)}</li>
    )}</ul>
    {visibleCount < rows.length && <button type="button" className={`mt-3 ${SECONDARY}`} onClick={() => setVisibleCount(count => count + 15)}>
      Mostrar mais ({Math.min(visibleCount, rows.length)} de {rows.length})
    </button>}
  </>;
}

function TripHistory({ db, root, trip }) {
  const source = useFleetRecords(db, root, 'points', 'all');
  const points = [...source.rows].sort((a, b) => (b.recordedAt?.toMillis() ?? 0) - (a.recordedAt?.toMillis() ?? 0));
  const latest = points[0];
  return <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
    <a href={fleetDirectionsUrl(trip.origin, trip.destination)} className="font-semibold text-teal-800 underline" target="_blank" rel="noreferrer">Abrir rota planejada no mapa</a>
    {source.error && <p role="alert">{source.error}</p>}
    {latest ? <>
      <p>Última posição registrada em {dateAndTime(latest.recordedAt)} · precisão aproximada de {Math.round(latest.accuracy)} m</p>
      <a href={fleetPointUrl(latest)} className="font-semibold text-teal-800 underline" target="_blank" rel="noreferrer">Ver última posição no mapa</a>
      <details><summary className="cursor-pointer">Trajeto registrado ({points.length} posições)</summary>
        <ol className="mt-2 max-h-44 space-y-1 overflow-y-auto">{points.map(point => <li key={point.id}>
          <a href={fleetPointUrl(point)} className="text-teal-800 underline" target="_blank" rel="noreferrer">{dateAndTime(point.recordedAt)}</a>
        </li>)}</ol>
      </details>
    </> : <p>{source.loading ? 'Consultando localização…' : 'Nenhuma posição compartilhada nesta viagem.'}</p>}
  </div>;
}

export default function FleetWorkspace({ db, appId, companyId, user, users = [], activeTab, onNavigate }) {
  const root = ['artifacts', appId, 'public', 'data', 'companies', companyId];
  const manager = Boolean(user?.isAdmin || user?.isDeveloper);
  const uid = user?.id;
  const tab = activeTab === 'fleet' ? 'overview' : activeTab.slice(6);
  const [historyMonth, setHistoryMonth] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [expandedTrip, setExpandedTrip] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState('');
  const [editingDriverId, setEditingDriverId] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const savingRef = useRef(false);

  const drivers = useFleetRecords(db, root, 'fleetDrivers', !uid ? 'off' : manager ? 'all' : 'one', uid);
  const driver = drivers.rows.find(row => row.id === uid && row.active);
  const editingDriver = drivers.rows.find(row => row.id === editingDriverId);
  const vehicles = useFleetRecords(db, root, 'fleetVehicles', manager ? 'all' : driver?.vehicleId ? 'one' : 'off', driver?.vehicleId);
  const scope = manager ? 'all' : driver ? 'driver' : 'off';
  const editingVehicle = vehicles.rows.find(row => row.id === editingVehicleId);
  const fuel = useFleetRecords(db, root, 'fleetFuel', scope, uid);
  const checks = useFleetRecords(db, root, 'fleetChecks', scope, uid);
  const trips = useFleetRecords(db, root, 'fleetTrips', scope, uid);
  const maintenance = useFleetRecords(db, root, 'fleetMaintenance', manager ? 'all' : 'off');
  const vehicle = vehicles.rows.find(item => item.id === (manager ? selectedVehicle : driver?.vehicleId)) || vehicles.rows[0];
  const fuelRows = fuel.rows.filter(row => row.vehicleId === vehicle?.id);
  const tripRows = trips.rows.filter(row => row.vehicleId === vehicle?.id);
  const checkRows = checks.rows.filter(row => row.vehicleId === vehicle?.id);
  const matchesMonth = row => !historyMonth || (row.date || (row.createdAt?.toDate && fleetDate(row.createdAt.toDate())))?.startsWith(historyMonth);
  const visibleFuel = fuelRows.filter(matchesMonth);
  const visibleTrips = tripRows.filter(row => row.status === 'active' || matchesMonth(row));
  const visibleChecks = checkRows.filter(matchesMonth);
  const maintenanceRows = maintenance.rows.filter(row => row.vehicleId === vehicle?.id);
  const km = vehicle?.currentKm ?? 0;
  const today = fleetDate();
  const check = checkRows.find(row => row.date === today && row.driverId === uid);
  const ownTrip = tripRows.find(row => row.driverId === uid && row.status === 'active');
  const vehicleTrip = tripRows.find(row => row.status === 'active');
  const canDrive = driver?.vehicleId === vehicle?.id && vehicle?.status === 'available'
    && Boolean(driver?.licenseExpiry && driver.licenseExpiry >= today);
  const location = useFleetLocation(db, root, ownTrip?.id, uid);
  const metrics = manager ? fleetFuelMetrics(fuelRows) : null;
  const overdueCount = maintenanceRows.filter(record => fleetMaintenanceState(record, km, today) === 'Vencida').length;
  const vehiclePlaceholder = vehicles.loading ? 'Carregando veículo…' : vehicles.error ? 'Veículo indisponível' : '';
  const issues = [drivers, vehicles, fuel, checks, trips, maintenance].find(item => item.error)?.error;
  const ref = (name, id) => doc(db, ...root, name, id);
  const records = name => collection(db, ...root, name);

  async function act(operation, message) {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      await operation();
      setFeedback({ message, tab });
      return true;
    } catch (error) {
      setFeedback({ message: error.code === 'permission-denied'
        ? 'Operação recusada. Confira sua permissão, a disponibilidade do veículo e os dados informados.'
        : error.code ? 'Não foi possível salvar. Verifique a conexão e tente novamente.' : error.message, error: true, tab });
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const text = (form, name) => String(form.get(name) || '').trim();
  const reading = (form, name, minimum) => {
    const value = Number(form.get(name));
    if (!Number.isFinite(value) || value < minimum) throw Error(`Informe um hodômetro de pelo menos ${number.format(minimum)} km.`);
    return value;
  };

  const saveVehicle = async form => {
    const plate = text(form, 'plate').replace(/[ -]/g, '').toUpperCase();
    if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plate)) throw Error('Informe uma placa válida no formato ABC1234 ou ABC1D23.');
    const existing = vehicles.rows.find(row => row.id === plate);
    const data = {
      plate, model: text(form, 'model'), status: text(form, 'status'),
      initialKm: reading(form, 'initialKm', 0), updatedAt: serverTimestamp(),
    };
    if (existing && existing.initialKm !== data.initialKm) throw Error('Use a leitura inicial já cadastrada. Novas leituras entram no checklist, na viagem ou no abastecimento.');
    await setDoc(ref('fleetVehicles', plate), existing ? data : { ...data, currentKm: data.initialKm }, { merge: true });
    setSelectedVehicle(plate);
    setEditingVehicleId('');
  };

  const saveDriver = async form => {
    const driverId = editingDriver?.id || text(form, 'uid');
    await setDoc(ref('fleetDrivers', driverId), {
      vehicleId: text(form, 'vehicleId'), licenseExpiry: text(form, 'licenseExpiry'),
      active: text(form, 'active') === 'yes', updatedAt: serverTimestamp(),
    });
    setEditingDriverId('');
  };

  const updateMeter = (batch, value, source) => batch.update(ref('fleetVehicles', vehicle.id), {
    currentKm: value, updatedAt: serverTimestamp(),
    meterEvent: { collection: source.parent.id, id: source.id },
  });

  const saveFuel = form => {
    const value = reading(form, 'km', km);
    const batch = writeBatch(db);
    const entry = doc(records('fleetFuel'));
    batch.set(entry, {
      vehicleId: vehicle.id, driverId: uid, km: value, liters: Number(form.get('liters')),
      cost: Number(form.get('cost')), fuelType: text(form, 'fuelType'), supplier: text(form, 'supplier'),
      fullTank: form.get('fullTank') === 'on', createdAt: serverTimestamp(),
    });
    updateMeter(batch, value, entry);
    return batch.commit();
  };

  const saveCheck = form => {
    const items = Object.fromEntries(CHECK_ITEMS.map(([id]) => [id, text(form, id)]));
    const notes = text(form, 'notes');
    if (Object.values(items).includes('issue') && !notes) throw Error('Descreva as irregularidades encontradas.');
    const value = reading(form, 'km', km);
    const batch = writeBatch(db);
    const entry = ref('fleetChecks', fleetChecklistId(uid, vehicle.id, today));
    batch.set(entry, {
      vehicleId: vehicle.id, driverId: uid, date: today, km: value, items, notes, createdAt: serverTimestamp(),
    });
    updateMeter(batch, value, entry);
    return batch.commit();
  };

  const startTrip = async form => {
    if (!check || Object.values(check.items).includes('issue')) throw Error('Registre o checklist diário sem irregularidades antes de iniciar.');
    const trip = doc(records('fleetTrips'));
    const value = reading(form, 'startKm', km);
    const batch = writeBatch(db);
    batch.set(trip, {
      vehicleId: vehicle.id, driverId: uid, origin: text(form, 'origin'), destination: text(form, 'destination'),
      startKm: value, status: 'active', date: today, createdAt: serverTimestamp(),
    });
    batch.set(ref('fleetTripLocks', vehicle.id), { tripId: trip.id, driverId: uid });
    updateMeter(batch, value, trip);
    await batch.commit();
    setExpandedTrip(trip.id);
  };

  const finishTrip = async (form, trip) => {
    const batch = writeBatch(db);
    const value = reading(form, 'endKm', km);
    const entry = ref('fleetTrips', trip.id);
    batch.update(entry, { status: 'finished', endKm: value, finishedAt: serverTimestamp() });
    updateMeter(batch, value, entry);
    batch.delete(ref('fleetTripLocks', vehicle.id));
    await batch.commit();
    if (trip.driverId === uid) location.stop();
  };

  const saveMaintenance = form => {
    const dueDate = text(form, 'dueDate');
    const dueKm = Number(form.get('dueKm') || 0);
    if (!dueDate && !dueKm) throw Error('Informe a data ou a quilometragem prevista.');
    return addDoc(records('fleetMaintenance'), {
      vehicleId: vehicle.id, kind: text(form, 'kind'), title: text(form, 'title'), dueDate, dueKm,
      status: 'planned', createdAt: serverTimestamp(),
    });
  };

  if (!db || !companyId || (drivers.loading && (!manager || tab !== 'overview'))) return <p className={PANEL}>Carregando acesso à frota…</p>;
  if (drivers.error) return <p role="alert" className={PANEL}>{drivers.error}</p>;
  if (!manager && !driver) return <p className={PANEL}>Peça ao administrador da empresa para vincular seu login a um cadastro de motorista ativo.</p>;

  return <div className="space-y-4">
    <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
      <h2 className="text-xl font-bold">Controle de frota</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {manager ? <label className="text-xs font-semibold text-teal-100">Veículo
          <select className={INPUT} value={vehicle?.id || ''} onChange={event => setSelectedVehicle(event.target.value)}>
            {!vehicles.rows.length && <option value="">{vehiclePlaceholder || 'Nenhum veículo cadastrado'}</option>}
            {vehicles.rows.map(row => <option key={row.id} value={row.id}>{row.plate} · {row.model}</option>)}
          </select>
        </label> : <p className="my-auto text-sm">{vehicle ? `${vehicle.plate} · ${vehicle.model}` : vehiclePlaceholder || 'Nenhum veículo vinculado'}</p>}
        {vehicle && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
          <Gauge className="h-4 w-4" /> <strong>{number.format(km)} km</strong>
          {overdueCount > 0 && <span className="rounded-md bg-amber-300 px-2 py-1 font-semibold text-amber-950">{overdueCount} manutenção(ões) vencida(s)</span>}
          <span>{vehicle.status === 'available' ? 'Disponível' : vehicle.status === 'maintenance' ? 'Em manutenção' : 'Inativo'}</span>
        </div>}
      </div>
    </header>

    {location.tracking && tab !== 'trips' && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
      <p role="status">Compartilhamento de localização ativo.</p>
      <button type="button" className={SECONDARY} onClick={() => onNavigate('fleet-trips')}>Abrir viagem</button>
    </div>}
    {vehicle && ['fuel', 'checks', 'trips'].includes(tab) && <div className={`flex flex-wrap items-end gap-3 ${PANEL}`}>
      <Field label="Mês do histórico" type="month" value={historyMonth} onChange={event => setHistoryMonth(event.target.value)} />
      {historyMonth && <button type="button" className={SECONDARY} onClick={() => setHistoryMonth('')}>Ver todos os meses</button>}
    </div>}
    {!manager && driver?.licenseExpiry < today && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">CNH vencida. Solicite ao gestor a atualização da validade para registrar novas operações.</p>}
    {issues && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{issues}</p>}
    {feedback?.tab === tab && <p role={feedback.error ? 'alert' : 'status'} className={`rounded-xl p-3 text-sm ${feedback.error ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}>{feedback.message}</p>}

    {tab === 'overview' && (vehiclePlaceholder ? <p className={PANEL}>{vehiclePlaceholder}</p> :
      <FleetOverview vehicle={vehicle} manager={manager} canDrive={canDrive} ownTrip={ownTrip} vehicleTrip={vehicleTrip}
        check={check} checkRows={checkRows} today={today} overdueCount={overdueCount} metrics={metrics}
        sources={{ checks, trips, fuel, maintenance }} fuelRows={fuelRows} tripRows={tripRows} onNavigate={onNavigate} />)}

    {tab === 'vehicles' && manager && <Section title="Cadastro de veículos">
      <Form key={editingVehicleId || 'new'} onSubmit={form => act(() => saveVehicle(form), 'Veículo salvo.')} saving={saving} label={editingVehicle ? 'Salvar alterações' : 'Cadastrar veículo'}>
        <Field label="Placa" name="plate" required maxLength={8} placeholder="ABC1D23" defaultValue={editingVehicle?.plate} readOnly={Boolean(editingVehicle)} />
        <Field label="Modelo" name="model" required maxLength={100} defaultValue={editingVehicle?.model} />
        <Field label="Hodômetro inicial em km" name="initialKm" type="number" min="0" max="9999999" required defaultValue={editingVehicle?.initialKm} readOnly={Boolean(editingVehicle)} />
        <SelectField label="Situação" name="status" defaultValue={editingVehicle?.status || 'available'}><option value="available">Disponível</option><option value="maintenance">Em manutenção</option><option value="inactive">Inativo</option></SelectField>
        {editingVehicle && <button type="button" className={SECONDARY} onClick={() => setEditingVehicleId('')}>Cancelar edição</button>}
      </Form>
      <div className="mt-4"><RecordList rows={vehicles.rows} empty="Nenhum veículo cadastrado."
        render={row => <><span className="text-sm"><strong>{row.plate}</strong> · {row.model}</span>
          <button type="button" className={SECONDARY} onClick={() => setEditingVehicleId(row.id)}>Editar {row.plate}</button></>} /></div>
    </Section>}

    {tab === 'drivers' && manager && <Section title="Motoristas e acesso">
      <p className="mb-3 text-sm text-slate-600">O motorista entra com o próprio login do Comunica. Libere também o Integra na central de permissões.</p>
      <Form key={editingDriverId || 'new'} onSubmit={form => act(() => saveDriver(form), 'Cadastro do motorista salvo.')} saving={saving} label={editingDriver ? 'Salvar alterações' : 'Cadastrar motorista'}>
        {editingDriver
          ? <Field label="Colaborador" readOnly value={users.find(item => item.id === editingDriver.id)?.name || editingDriver.id} />
          : <Field label="Colaborador"><PurchaseSelect label="Colaborador" name="uid" required
            placeholder="Selecione o colaborador" searchPlaceholder="Buscar por nome"
            options={users.filter(person => !drivers.rows.some(existing => existing.id === person.id)).map(person => [person.id, person.name])} /></Field>}
        <SelectField label="Veículo vinculado" name="vehicleId" required defaultValue={editingDriver?.vehicleId || ''}><option value="" disabled>Selecione o veículo</option>{vehicles.rows.map(row => <option key={row.id} value={row.id}>{row.plate} · {row.model}</option>)}</SelectField>
        <Field label="Validade da CNH" name="licenseExpiry" type="date" required defaultValue={editingDriver?.licenseExpiry} />
        <SelectField label="Situação" name="active" defaultValue={editingDriver?.active === false ? 'no' : 'yes'}><option value="yes">Ativo</option><option value="no">Inativo</option></SelectField>
        {editingDriver && <button type="button" className={SECONDARY} onClick={() => setEditingDriverId('')}>Cancelar edição</button>}
      </Form>
      <div className="mt-4"><RecordList rows={drivers.rows} empty="Nenhum motorista cadastrado." render={row => <>
        <span className="text-sm"><strong>{users.find(item => item.id === row.id)?.name || row.id}</strong> · {row.vehicleId} · {row.licenseExpiry < today ? 'CNH vencida' : `CNH até ${dateLabel(row.licenseExpiry)}`} · {row.active ? 'Ativo' : 'Inativo'}</span>
        <button type="button" className={SECONDARY} onClick={() => setEditingDriverId(row.id)}>Editar cadastro</button>
      </>} /></div>
    </Section>}

    {!vehicle && !['drivers', 'vehicles', 'overview'].includes(tab) && <p className={PANEL}>Cadastre ou vincule um veículo para iniciar os registros.</p>}
    {vehicle && tab === 'fuel' && <>
      {canDrive && <Section title="Registrar abastecimento">
        <Form key={vehicle.id} onSubmit={form => act(() => saveFuel(form), 'Abastecimento registrado.')} saving={saving} label="Registrar abastecimento">
          <Field label="Hodômetro em km" name="km" type="number" min={km} max="9999999" required />
          <Field label="Litros" name="liters" type="number" min="0.01" max="10000" step="0.01" required />
          <Field label="Valor total em R$" name="cost" type="number" min="0.01" max="100000" step="0.01" required />
          <SelectField label="Combustível" name="fuelType">{['Diesel', 'Gasolina', 'Etanol', 'Outro'].map(value => <option key={value}>{value}</option>)}</SelectField>
          <Field label="Posto" name="supplier" required maxLength={120} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fullTank" /> Tanque completo</label>
        </Form>
      </Section>}
      <Section title="Histórico de abastecimentos">
        {metrics && <p className="mb-3 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">Último ciclo completo · {number.format(metrics.consumption)} km/L · {currency.format(metrics.costPerKm)}/km</p>}
        <RecordList key={vehicle.id + historyMonth} rows={visibleFuel} empty="Nenhum abastecimento para o período." render={row => <>
          <span className="text-sm"><strong>{row.supplier}</strong> · {row.fuelType}<small className="block text-slate-500">{dateAndTime(row.createdAt)} · {number.format(row.km)} km</small></span>
          <span className="text-sm">{number.format(row.liters)} L · {currency.format(row.cost)}</span>
        </>} />
      </Section>
    </>}

    {vehicle && tab === 'checks' && <>
      {canDrive && <Section title="Inspeção diária do veículo">
        <Form key={vehicle.id} onSubmit={form => act(() => saveCheck(form), 'Checklist salvo.')} saving={saving} label={check ? 'Atualizar checklist de hoje' : 'Enviar checklist'}>
          <Field label="Hodômetro em km" name="km" type="number" min={km} max="9999999" required />
          {CHECK_ITEMS.map(([id, label]) => <SelectField key={id} name={id} label={label} required defaultValue=""><option value="" disabled>Selecione</option><option value="ok">Em ordem</option><option value="issue">Irregularidade</option></SelectField>)}
          <Field label="Observações" name="notes" maxLength={500} placeholder="Descreva as irregularidades" />
        </Form>
      </Section>}
      <Section title="Histórico de checklists">
        <RecordList key={vehicle.id + historyMonth} rows={visibleChecks} empty="Nenhum checklist para o período." render={row => <span className="text-sm">
          <strong>{dateLabel(row.date)}</strong> · {number.format(row.km)} km · {Object.values(row.items).includes('issue') ? 'Irregularidade' : 'Em ordem'}
          {row.notes && <small className="block text-slate-500">{row.notes}</small>}
        </span>} />
      </Section>
    </>}

    {vehicle && tab === 'trips' && <>
      {ownTrip && <Section title="Localização da viagem em andamento">
        <p className="mb-3 text-sm text-slate-600">Compartilhe a posição do celular durante a viagem. O registro depende da permissão e funciona com esta tela aberta.</p>
        <button type="button" onClick={location.tracking ? location.stop : location.start} className={location.tracking ? SECONDARY : BUTTON}>
          {location.tracking ? 'Parar compartilhamento' : 'Compartilhar localização'}
        </button>
        {location.message && <p className="mt-2 text-sm text-slate-600" role="status">{location.message}</p>}
      </Section>}
      {canDrive && !vehicleTrip && <Section title="Iniciar viagem">
        {!check || Object.values(check.items).includes('issue') ? <div><p className="mb-3 text-sm text-slate-600">Para começar, envie o checklist de hoje com todos os itens em ordem.</p><button type="button" className={SECONDARY} onClick={() => onNavigate('fleet-checks')}>Abrir checklist diário</button></div>
          : <Form key={vehicle.id} onSubmit={form => act(() => startTrip(form), 'Viagem iniciada.')} saving={saving} label="Iniciar viagem">
            <Field label="Origem" name="origin" required maxLength={180} />
            <Field label="Destino" name="destination" required maxLength={180} />
            <Field label="Hodômetro de saída em km" name="startKm" type="number" min={km} max="9999999" required />
          </Form>}
      </Section>}
      <Section title="Viagens do veículo">
        <RecordList key={vehicle.id + historyMonth} rows={visibleTrips} sort={(a, b) => Number(b.status === 'active') - Number(a.status === 'active') || newest(a, b)} empty="Nenhuma viagem para o período." render={row => <article className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span><strong>{row.origin} → {row.destination}</strong>
            <small className="block text-slate-500">{dateLabel(row.date)} · {row.status === 'active' ? 'Em andamento' : `${number.format(row.endKm - row.startKm)} km percorridos`}</small>
          </span><button type="button" className={SECONDARY} aria-expanded={expandedTrip === row.id} onClick={() => setExpandedTrip(previous => previous === row.id ? '' : row.id)}>Rota e posições</button></div>
          {expandedTrip === row.id && <TripHistory db={db} root={[...root, 'fleetTrips', row.id]} trip={row} />}
          {row.status === 'active' && (row.driverId === uid || manager) && <div className="mt-3">
            <Form onSubmit={form => act(() => finishTrip(form, row), 'Viagem finalizada.')} saving={saving} label="Finalizar viagem">
              <Field label="Hodômetro de chegada em km" name="endKm" type="number" min={Math.max(km, row.startKm)} max="9999999" required />
            </Form>
          </div>}
        </article>} />
      </Section>
    </>}

    {manager && vehicle && tab === 'maintenance' && <>
      <Section title="Programar manutenção">
        <Form key={vehicle.id} onSubmit={form => act(() => saveMaintenance(form), 'Manutenção programada.')} saving={saving} label="Programar">
          <Field label="Serviço" name="title" required maxLength={160} />
          <SelectField label="Tipo" name="kind"><option value="preventive">Preventiva</option><option value="corrective">Corretiva</option></SelectField>
          <Field label="Data prevista" name="dueDate" type="date" />
          <Field label="Hodômetro previsto em km" name="dueKm" type="number" min="1" max="9999999" />
        </Form>
      </Section>
      <Section title="Manutenções do veículo">
        <RecordList rows={maintenanceRows} empty="Nenhuma manutenção programada." render={row => <>
          <span className="text-sm"><strong>{row.title}</strong> · {fleetMaintenanceState(row, km)}
            <small className="block text-slate-500">{row.kind === 'preventive' ? 'Preventiva' : 'Corretiva'}{row.dueDate && ` · ${dateLabel(row.dueDate)}`}{row.dueKm > 0 && ` · ${number.format(row.dueKm)} km`}</small>
          </span>
          {row.status === 'planned' && <Form onSubmit={form => act(() => updateDoc(ref('fleetMaintenance', row.id), {
            status: 'done', cost: Number(form.get('cost')), finishedAt: serverTimestamp(),
          }), 'Manutenção concluída.')} saving={saving} label="Concluir serviço">
            <Field label="Custo em R$" name="cost" type="number" min="0" max="1000000" step="0.01" required />
          </Form>}
        </>} />
      </Section>
    </>}
  </div>;
}
