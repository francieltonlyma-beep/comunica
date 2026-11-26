import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });
const bandNames = ['I · A', 'I · B', 'I · C', 'II · A', 'II · B', 'II · C', 'III · A', 'III · B', 'III · C'];
const defaults = { active: true, supervisor: '', effective: '', cct: '', minimum: '', base: '', bandRate: '', levelRate: '', score: '', months: '', overrides: Array(9).fill('') };
const fields = [
  ['cct', 'Piso da CCT'], ['minimum', 'Salário mínimo de referência'], ['base', 'Salário-base da empresa'],
  ['bandRate', 'Progressão por faixa (%)'], ['levelRate', 'Progressão por nível (%)'],
  ['score', 'Desempenho mínimo (%)'], ['months', 'Tempo mínimo de casa (meses)'],
];
const field = 'block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm';
const panel = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';

function SalaryPlan({ plans, role, roles, save }) {
  const saved = plans[role.id];
  const [draft, setDraft] = useState(() => ({ ...defaults, ...saved?.plan }));
  const [revision, setRevision] = useState(saved?.revision || 0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const floor = Math.max(Number(draft.cct), Number(draft.minimum), Number(draft.base));
  const bands = bandNames.map((label, index) => {
    const calculated = Math.round(floor * (1 + Number(draft.levelRate) / 100) ** Math.floor(index / 3) * (1 + Number(draft.bandRate) / 100) ** (index % 3) * 100) / 100;
    return { label, calculated, value: draft.overrides[index] === '' ? calculated : Number(draft.overrides[index]) };
  });
  const change = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (floor <= 0 || bands.some(band => !Number.isFinite(band.value) || band.value < floor)) {
      setStatus('Informe uma base positiva e revise valores abaixo da base ou dos pisos.');
      return;
    }
    const visited = new Set([role.id]);
    for (let id = draft.supervisor; id; id = plans[id]?.plan?.supervisor) {
      if (visited.has(id)) {
        setStatus('Revise a hierarquia. Um cargo não pode supervisionar a si mesmo direta ou indiretamente.');
        return;
      }
      visited.add(id);
    }
    setBusy(true);
    setStatus('');
    try {
      await save(role.id, revision, draft);
      setRevision(revision + 1);
      setStatus('Plano salarial salvo.');
    } catch {
      setStatus('Não foi possível salvar. Confira a conexão ou reabra o cargo se outro usuário alterou o plano.');
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className={panel}>
    <div className="grid gap-3 sm:grid-cols-3">
      <label>Situação<select className={field} value={String(draft.active)} onChange={event => change('active', event.target.value === 'true')}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
      <label>Cargo que supervisiona<select className={field} value={draft.supervisor} onChange={event => change('supervisor', event.target.value)}><option value="">Sem cargo superior</option>{roles.filter(item => item.id !== role.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Vigência<input required className={field} type="date" value={draft.effective} onChange={event => change('effective', event.target.value)} /></label>
      {fields.map(([key, label]) => <label key={key}>{label}<input className={field} type="number" min="0" max={key === 'score' ? 100 : 10000000} step={key === 'months' ? 1 : 0.01} value={draft[key]} onChange={event => change(key, event.target.value)} /></label>)}
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Faixa</th><th>Valor calculado</th><th>Valor manual em R$</th></tr></thead><tbody>
      {bands.map(({ label, calculated }, index) => <tr className="border-t border-slate-100" key={label}><th scope="row">{role.name} {label}</th><td>{money.format(calculated)}</td><td className="p-1"><input aria-label={`Valor manual da faixa ${label}`} placeholder="Usar valor calculado" className={field} type="number" min={floor} step="0.01" value={draft.overrides[index]} onChange={event => change('overrides', draft.overrides.map((value, position) => position === index ? event.target.value : value))} /></td></tr>)}
    </tbody></table></div>
    {bands.some((band, index) => index > 0 && band.value < bands[index - 1].value) && <p role="status" className="font-semibold text-amber-800">A matriz tem valores decrescentes entre faixas ou níveis. Confira antes de salvar.</p>}
    <button disabled={busy} className="rounded-xl bg-blue-800 px-4 py-3 font-semibold text-white disabled:opacity-50">Salvar plano</button>
    <p role="status">{status}</p>
  </form>;
}

export default function DpiWorkspace({ db, company, uid, roles, employees, activities, openActivity }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [metric, setMetric] = useState('all');
  const [employee, setEmployee] = useState('');
  const today = dateFormat.format(new Date());
  const active = employees.filter(person => !person.terminationDate || person.terminationDate > today);
  const currentRole = roles.find(role => role.id === roleId);
  useEffect(() => onSnapshot(collection(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'salaryPlans'),
    snapshot => setRecords(Object.fromEntries(snapshot.docs.map(record => [record.id, record.data()]))),
    () => setError(true)), [db, company]);

  function save(role, revision, plan) {
    const ref = doc(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'salaryPlans', role);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if ((snapshot.data()?.revision || 0) !== revision) throw new Error('stale');
      const history = doc(ref, 'history', String(revision + 1));
      const change = { plan, revision: revision + 1, updatedBy: uid, updatedAt: serverTimestamp() };
      transaction.set(ref, change);
      transaction.set(history, change);
    });
  }

  const rows = activities.filter(record => !employee || record.assigneeIds?.includes(employee)).map(record => {
    const completed = record.resolvedAt ? dateFormat.format(new Date(record.resolvedAt)) : '';
    let status = 'open';
    if (record.status === 'resolved') status = record.dueDate && completed ? (completed <= record.dueDate ? 'ontime' : 'late') : 'unrated';
    else if (record.dueDate && record.dueDate < today) status = 'overdue';
    return { record, status };
  });
  const metrics = [['all', 'Atividades'], ['ontime', 'No prazo'], ['late', 'Concluídas com atraso'], ['overdue', 'Abertas vencidas']];
  return <section className="space-y-5 text-sm text-slate-900">
    <header className="rounded-2xl bg-slate-950 p-6 text-white"><h2 className="text-2xl font-bold">Painel DPI</h2><p className="mt-1 text-slate-200">Desempenho da equipe e plano de cargos e salários</p></header>
    <section className={panel}>
      <div className="flex flex-wrap items-end justify-between gap-3"><h3 className="text-lg font-bold">Indicadores da equipe</h3>
        <label>Colaborador<select className={field} value={employee} onChange={event => setEmployee(event.target.value)}><option value="">Toda a equipe · {active.length} ativos</option>{active.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
      </div>
      {employee && <p>Admissão · {active.find(person => person.id === employee)?.hireDate?.split('-').reverse().join('/') || 'Data pendente no cadastro'}</p>}
      <div className="grid gap-2 sm:grid-cols-4">{metrics.map(([key, label]) => {
        const count = key === 'all' ? rows.length : rows.filter(row => row.status === key).length;
        return <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left aria-pressed:border-blue-600"><strong className="block text-xl">{count}</strong>{label}<span aria-hidden="true" className="mt-2 block h-1 bg-blue-700" style={{ width: `${rows.length ? count / rows.length * 100 : 0}%` }} /></button>;
      })}</div>
      <ul className="max-h-64 space-y-1 overflow-y-auto">{rows.filter(row => metric === 'all' || row.status === metric).map(({ record }) => <li key={record.id}><button type="button" onClick={() => openActivity(record.id)} className="w-full rounded-lg border p-2 text-left hover:bg-blue-50">{record.title} · {record.dueDate || 'Sem prazo'}</button></li>)}</ul>
    </section>
    <section className="space-y-3">
      <h3 className="text-lg font-bold">Plano de cargos e salários</h3>
      <label>Cargo<select className={field} value={roleId} onChange={event => setRoleId(event.target.value)}><option value="">Selecione um cargo</option>{[...roles].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(role => <option key={role.id} value={role.id}>{role.name}{records?.[role.id]?.plan?.active === false ? ' · Inativo' : ''}</option>)}</select></label>
      {error ? <p role="alert">Não foi possível carregar os planos salariais.</p> : records === null ? <p role="status">Consultando os planos…</p> : currentRole && <SalaryPlan key={roleId} role={currentRole} roles={roles} plans={records} save={save} />}
    </section>
  </section>;
}
