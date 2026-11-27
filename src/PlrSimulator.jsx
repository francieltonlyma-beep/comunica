import { useState } from 'react';
import PurchaseSelect from './PurchaseSelect.jsx';
import { roleNameKey } from './roleCatalog.js';
import { calculatePlr } from './plrSimulation.js';

const labels = ['Empresa', 'Setor', 'Colaborador'];
const field = 'block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const blank = () => ({ id: '', name: '', start: '', end: '', weights: ['50', '30', '20'], plans: {} });

function readCycles(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function PlrSimulator({ company, uid, roles, employees, rows }) {
  const storageKey = 'comunica-plr-v1:' + JSON.stringify([company, uid]);
  const [cycles, setCycles] = useState(() => readCycles(storageKey));
  const [draft, setDraft] = useState(blank);
  const [roleId, setRoleId] = useState('');
  const [personId, setPersonId] = useState('');
  const [companyScore, setCompanyScore] = useState('');
  const [sectorScore, setSectorScore] = useState('');
  const [status, setStatus] = useState('');
  const existingRoles = roles.filter(role => !role.mergedIntoRoleId);
  const plan = draft.plans[roleId];
  const selectedRoleName = roleNameKey(existingRoles.find(role => role.id === roleId)?.name);
  const matchingRoles = existingRoles.filter(role => roleNameKey(role.name) === selectedRoleName);
  const eligible = roleId ? employees.filter(person => person.roleId
    ? person.roleId === roleId
    : matchingRoles.length === 1 && roleNameKey(person.role) === selectedRoleName) : [];
  const person = eligible.find(item => item.id === personId);
  const validPeriod = draft.start && draft.end && draft.start <= draft.end;
  const evaluated = person && validPeriod ? rows.filter(({ record, status, day }) =>
    ['ontime', 'late'].includes(status) && day >= draft.start && day <= draft.end && record.assigneeIds?.includes(person.id)) : [];
  const onTime = evaluated.filter(row => row.status === 'ontime').length;
  const result = person && validPeriod ? calculatePlr({
    weights: draft.weights, companyScore, sectorScore, target: plan?.target, amount: plan?.amount, onTime, evaluated: evaluated.length,
  }) : null;

  function update(values) {
    setDraft(previous => ({ ...previous, ...values }));
    setStatus('');
  }

  function changePlan(key, value) {
    update({ plans: { ...draft.plans, [roleId]: { ...plan, [key]: value } } });
  }

  function selectCycle(id) {
    setDraft(cycles.find(cycle => cycle.id === id) || blank());
    setRoleId('');
    setPersonId('');
    setCompanyScore('');
    setSectorScore('');
    setStatus('');
  }

  function saveCycle(event) {
    event.preventDefault();
    if (!draft.name.trim() || !validPeriod) return;
    const saved = { ...draft, name: draft.name.trim(), id: draft.id || crypto.randomUUID() };
    const next = [...readCycles(storageKey).filter(cycle => cycle.id !== saved.id), saved];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setCycles(next);
      setDraft(saved);
      setStatus('Ciclo salvo neste navegador.');
    } catch {
      setStatus('Não foi possível salvar o ciclo neste navegador.');
    }
  }

  return <details className="rounded-2xl border border-slate-200 bg-white p-5">
    <summary className="cursor-pointer text-base font-bold">Participação nos resultados (PLR)</summary>
    <div className="mt-4 space-y-4">
      <p className="text-slate-600">Simule o valor bruto por colaborador. Os parâmetros salvos ficam neste navegador, vinculados à empresa e à sua conta.</p>
      <form onSubmit={saveCycle} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label>Ciclo salvo<select className={field} value={draft.id} onChange={event => selectCycle(event.target.value)}><option value="">Novo ciclo</option>{cycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select></label>
          <label>Nome do ciclo<input className={field} required maxLength={100} value={draft.name} onChange={event => update({ name: event.target.value })} /></label>
          <label>Início da apuração<input className={field} type="date" required max={draft.end || undefined} value={draft.start} onChange={event => update({ start: event.target.value })} /></label>
          <label>Fim da apuração<input className={field} type="date" required min={draft.start || undefined} value={draft.end} onChange={event => update({ end: event.target.value })} /></label>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-3"><legend className="mb-2 font-semibold">Pesos do ciclo (total de 100%)</legend>
          {labels.map((label, index) => <label key={label}>{label} (%)<input className={field} type="number" min="0" max="100" step="0.01" required value={draft.weights[index]} onChange={event => update({ weights: draft.weights.map((value, i) => i === index ? event.target.value : value) })} /></label>)}
        </fieldset>
        <div className="grid gap-3 md:grid-cols-3">
          <label>Cargo<select className={field} value={roleId} onChange={event => { setRoleId(event.target.value); setPersonId(''); setStatus(''); }}><option value="">Selecione um cargo</option>{existingRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <label>Valor-alvo bruto (R$)<input className={field} type="number" min="0.01" max="10000000" step="0.01" disabled={!roleId} value={plan?.amount ?? ''} onChange={event => changePlan('amount', event.target.value)} /></label>
          <label>Meta de entregas no prazo (%)<input className={field} type="number" min="0.01" max="100" step="0.01" disabled={!roleId} value={plan?.target ?? ''} onChange={event => changePlan('target', event.target.value)} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="submit" className="rounded-xl bg-blue-800 px-4 py-2 font-semibold text-white">Salvar ciclo neste navegador</button><span role="status">{status}</span></div>
      </form>
      <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-bold">Prévia individual</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div><span className="block">Colaborador</span><PurchaseSelect label="Colaborador para simulação de PLR" searchPlaceholder="Buscar por nome" placeholder="Selecione" value={personId} onChange={id => { setPersonId(id); setSectorScore(''); }} options={eligible.map(item => [item.id, item.name])} /></div>
          <label>Atingimento da empresa (%)<input className={field} type="number" min="0" max="100" step="0.01" value={companyScore} onChange={event => setCompanyScore(event.target.value)} /></label>
          <label>Atingimento do setor (%)<input className={field} type="number" min="0" max="100" step="0.01" value={sectorScore} onChange={event => setSectorScore(event.target.value)} /></label>
        </div>
        <p className="text-sm text-slate-600">O cálculo individual considera as atividades atribuídas ao colaborador e concluídas com prazo definido no período. Cada componente tem atingimento máximo de 100%.</p>
        {!result ? <p>Selecione o cargo, o colaborador e o período de apuração.</p> : <>
          <p>{onTime} de {evaluated.length} conclusões no prazo{result.rate != null && Number(draft.weights[2]) > 0 && ` · ${percent.format(result.rate)}% observado contra meta de ${percent.format(plan.target)}%`}.</p>
          {result.error ? <p role="status">{result.error}</p> : <>
            <div className="overflow-x-auto"><table className="w-full text-left">
              <thead><tr><th>Componente</th><th>Peso</th><th>Atingimento</th><th>Contribuição</th></tr></thead>
              <tbody>{labels.map((label, index) => <tr key={label} className="border-t border-blue-200"><th scope="row" className="py-2">{label}</th><td>{percent.format(draft.weights[index])}%</td><td>{Number(draft.weights[index]) ? percent.format(result.attainment[index]) + '%' : '—'}</td><td>{percent.format(result.contributions[index])} p.p.</td></tr>)}</tbody>
            </table></div>
            <p className="font-semibold">Valor-alvo de {money.format(plan.amount)} × {percent.format(result.score)}% = <strong className="text-lg text-blue-950">{money.format(result.total)} brutos estimados</strong></p>
          </>}
        </>}
      </section>
    </div>
  </details>;
}
