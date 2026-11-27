import { adjustSalaryBand, bandNames, salaryBands } from './careerReview.js';
import { roleNameKey } from './roleCatalog.js';
import PurchaseSelect from './PurchaseSelect.jsx';
import PlrSimulator from './PlrSimulator.jsx';
import SalaryHierarchy from './SalaryHierarchy.jsx';
import { useEffect, useRef, useState } from 'react';
import { Managers, TeamCharts } from './TeamInsights.jsx';
import { collection, doc, onSnapshot, runTransaction, setDoc, serverTimestamp } from 'firebase/firestore';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });
const defaults = { active: true, supervisor: '', effective: '', cct: '', minimum: '', base: '', bandRate: '', levelRate: '', score: '', months: '', overrides: Array(9).fill('') };
const fields = [
  ['cct', 'Piso da CCT'], ['minimum', 'Salário mínimo de referência'], ['base', 'Salário-base da empresa'],
  ['bandRate', 'Progressão por faixa (%)'], ['levelRate', 'Progressão por nível (%)'],
  ['score', 'Desempenho mínimo (%)'], ['months', 'Tempo mínimo de casa (meses)'],
];
const field = 'block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm';
const panel = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';

const standard = { id: 'pdi-company-standard-v1', name: 'Padrão da empresa' };
function parameters(plan) {
  return plan ? Object.fromEntries([...fields.map(([key]) => key), 'overrides'].map(key => [key, plan[key] ?? defaults[key]])) : {};
}

function SalaryPlan({ plans, role, roles, save, requestedBand, selectBand, markDirty }) {
  const saved = plans[role.id];
  const [draft, setDraft] = useState(() => ({ ...defaults, ...(saved?.plan || (role.id !== standard.id ? parameters(plans[standard.id]?.plan) : {})) }));
  const [revision, setRevision] = useState(saved?.revision || 0);
  const [status, setStatus] = useState('');
  const [sourceRole, setSourceRole] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('');
  const [original, setOriginal] = useState(saved?.plan);
  const index = requestedBand;
  const adjustment = mode && amount !== '' ? adjustSalaryBand(draft, index, Number(amount), mode) : null;
  const preview = adjustment ? salaryBands(adjustment) : null;

  function editBand(position) {
    setMode('');
    setAmount('');
    selectBand(position);
  }

  function applyAdjustment() {
    if (!adjustment) return;
    markDirty();
    setDraft(adjustment);
    editBand(null);
    setStatus('Ajuste incluído no rascunho. Revise e salve o plano.');
  }
  const [busy, setBusy] = useState(false);
  const floor = Math.max(Number(draft.cct), Number(draft.minimum), Number(draft.base));
  const bands = salaryBands(draft);
  const change = (key, value) => {
    markDirty();
    setDraft(previous => ({ ...previous, [key]: value }));
  };
  async function submit(event) {
    event.preventDefault();
    if (busy || index !== null) return;
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
    const previousBands = original ? salaryBands(original) : [];
    const differences = bands.flatMap(({label, value}, i) => value === previousBands[i]?.value ? [] :
      [`${label}: ${previousBands[i] ? money.format(previousBands[i].value) + ' → ' : ''}${money.format(value)}`]);
    const summary = [`Salvar plano de ${role.name}?`, ...differences, 'O quadro será atualizado. Salários individuais registrados continuam separados.'];
    if (!window.confirm(summary.join('\n'))) return;
    setBusy(true);
    setStatus('');
    try {
      await save(role.id, revision, draft);
      setRevision(revision + 1);
      setOriginal(draft);
      markDirty(false);
      setStatus('Plano salarial salvo.');
    } catch {
      setStatus('Não foi possível salvar. Confira a conexão ou reabra o cargo se outro usuário alterou o plano.');
    } finally {
      setBusy(false);
    }
  }
  const templates = roles.filter(item => item.id !== role.id && plans[item.id]?.plan);
  function copyParameters(full) {
    const source = plans[sourceRole]?.plan;
    if (!source) return;
    markDirty();
    const { cct, minimum, base, bandRate, levelRate, score, months } = source;
    setDraft(previous => ({ ...previous, cct, minimum, base, bandRate, levelRate, score, months, ...(full ? { overrides: [...(source.overrides || [])] } : {}) }));
    setStatus('Parâmetros copiados para este rascunho. Confira a matriz antes de salvar.');
  }

  return <form onSubmit={submit} className={panel}>
    <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-70">
    {templates.length > 0 && <div className="flex flex-wrap items-end gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <label className="min-w-48 flex-1 font-semibold">Usar parâmetros de outro cargo
        <select className={field} value={sourceRole} onChange={event => setSourceRole(event.target.value)}>
          <option value="">Escolha um plano já salvo</option>
          {templates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <button type="button" disabled={!sourceRole} onClick={() => copyParameters(false)} className="rounded-xl bg-blue-800 px-4 py-2.5 font-semibold text-white disabled:opacity-50">Copiar parâmetros</button><button type="button" disabled={!sourceRole} onClick={() => copyParameters(true)} className="rounded-xl border p-2 font-semibold">Copiar matriz completa</button>
    </div>}

    <div className="grid gap-3 sm:grid-cols-3">
      <label>Situação<select className={field} value={String(draft.active)} onChange={event => change('active', event.target.value === 'true')}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
      <label>Superior direto deste cargo<select className={field} value={draft.supervisor} onChange={event => change('supervisor', event.target.value)}><option value="">Sem cargo superior</option>{roles.filter(item => item.id !== role.id && item.id !== standard.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Vigência<input required className={field} type="date" value={draft.effective} onChange={event => change('effective', event.target.value)} /></label>
      {fields.map(([key, label]) => <label key={key}>{label}<input className={field} type="number" min="0" max={key === 'score' ? 100 : 10000000} step={key === 'months' ? 1 : 0.01} value={draft[key]} onChange={event => change(key, event.target.value)} /></label>)}
    </div>
    <div className="border-t border-slate-200 pt-4">
      <h4 className="text-base font-bold">Matriz salarial · {role.name}</h4>
      <p className="text-slate-600">Selecione um valor para ajustar a faixa ou recalcular a progressão.</p>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[360px] border-separate border-spacing-1 text-left text-sm">
      <thead><tr><th>Nível</th>{['A', 'B', 'C'].map(band => <th key={band} scope="col" className="p-2">Faixa {band}</th>)}</tr></thead>
      <tbody>{['I', 'II', 'III'].map((level, row) => <tr key={level}>
        <th scope="row" className="p-2">{level}</th>
        {bands.slice(row * 3, row * 3 + 3).map(({ label, value, calculated }, column) => {
          const position = row * 3 + column;
          const manual = (draft.overrides?.[position] ?? '') !== '';
          return <td key={label}><button type="button" onClick={() => editBand(position)} aria-pressed={index === position}
            aria-label={`Editar faixa ${label}, ${money.format(value)}`}
            className="block w-full rounded-lg border border-transparent bg-slate-50 p-2 text-left hover:border-blue-300 aria-pressed:border-blue-600 aria-pressed:bg-blue-50">
            <strong className="block tabular-nums">{money.format(value)}</strong>
            {manual && <small className="text-blue-700">Pela fórmula: {money.format(calculated)}</small>}
          </button></td>;
        })}
      </tr>)}</tbody>
    </table></div>
    {index !== null && <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label={`Ajustar faixa ${bandNames[index]}`}>
      <h5 className="font-bold">Ajustar faixa {bandNames[index]}</h5>
      <label>Novo valor (R$)<input className={field} type="number" min="0.01" max="10000000" step="0.01" placeholder={bands[index].value.toFixed(2)}
        value={amount} onChange={event => setAmount(event.target.value)} /></label>
      {(draft.overrides?.[index] ?? '') !== '' && <button type="button" className="text-blue-800 underline" onClick={() => {
        setAmount(bands[index].calculated.toFixed(2)); setMode('single');
      }}>Sugerir valor pela fórmula · {money.format(bands[index].calculated)}</button>}
      <fieldset className="space-y-2">
        <legend className="mb-1 font-semibold">Como aplicar o ajuste?</legend>
        <label className="flex items-start gap-2"><input type="radio" name="salary-adjustment" checked={mode === 'single'} onChange={() => setMode('single')} /> Alterar apenas esta faixa no quadro</label>
        <label className="flex items-start gap-2"><input type="radio" name="salary-adjustment" checked={mode === 'progression'} onChange={() => setMode('progression')} /> Recalcular todas as faixas com os percentuais do plano</label>
      </fieldset>
      {mode === 'progression' && <p className="text-amber-900">O salário-base será recalculado a partir da faixa escolhida. Os ajustes manuais anteriores serão substituídos pela progressão do plano.</p>}
      {mode && amount !== '' && !preview && <p role="status" className="text-rose-800">Revise o valor. O ajuste precisa manter a base e as faixas dentro dos limites do plano e dos pisos informados.</p>}
      {preview && <div className="space-y-1">
        {mode === 'progression' && <p>Salário-base · {money.format(Number(draft.base))} → {money.format(Number(adjustment.base))}</p>}
        <ul>{preview.map(({ label, value }, i) => value !== bands[i].value && <li key={label}>{label} · {money.format(bands[i].value)} → <strong>{money.format(value)}</strong></li>)}</ul>
      </div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!preview || busy} onClick={applyAdjustment} className="rounded-lg bg-blue-800 px-3 py-2 font-semibold text-white disabled:opacity-50">Aplicar ao rascunho</button>
        <button type="button" onClick={() => editBand(null)} className="rounded-lg border bg-white px-3 py-2">Cancelar ajuste</button>
      </div>
    </section>}
    {bands.some((band, index) => index > 0 && band.value < bands[index - 1].value) && <p role="status" className="font-semibold text-amber-800">A matriz tem valores decrescentes entre faixas ou níveis. Confira antes de salvar.</p>}
    <button disabled={busy || index !== null} className="rounded-xl bg-blue-800 px-4 py-3 font-semibold text-white disabled:opacity-50">Salvar plano</button>
    </fieldset>
    <p role="status">{status}</p>
  </form>;
}

function Compensation({ db, company, uid, employees, roles, records, today }) {
  const [entries,setEntries] = useState([]);
  const [person,setPerson] = useState('');
  const [amount,setAmount] = useState('');
  const [effective,setEffective] = useState(today);
  const [status,setStatus] = useState('');
  useEffect(() => onSnapshot(collection(db,'artifacts','comunica-salvador','public','data','companies',company,'salaryChanges'),
    snapshot => setEntries(snapshot.docs.map(item => item.data()).sort((a,b) => b.effective.localeCompare(a.effective))),
    () => setStatus('Falha ao consultar os salários individuais.')), [company,db]);
  const selectedEmployee = employees.find(employee => employee.id === person);
  const sameName = roles.filter(role => !role.mergedIntoRoleId && selectedEmployee?.role && roleNameKey(role.name) === roleNameKey(selectedEmployee.role));
  const selectedRole = roles.find(role => !role.mergedIntoRoleId && role.id === selectedEmployee?.roleId)
    || (sameName.length === 1 ? sameName[0] : undefined);
  const selectedPlan = records[selectedRole?.id]?.plan;
  const proposedBands = selectedPlan?.active !== false && selectedPlan?.effective <= effective ? salaryBands(selectedPlan) : [];
  const currentPay = entries.find(entry => entry.person === person && entry.effective <= today);
  const proposedAmount = Number(amount);
  const difference = currentPay && proposedAmount > 0 ? Math.round((proposedAmount - Number(currentPay.amount)) * 100) / 100 : null;
  const percent = difference === null || !currentPay.amount ? null : difference / currentPay.amount * 100;
  const matchingBands = proposedBands.filter(band => Math.round(band.value * 100) === Math.round(proposedAmount * 100));
  async function save(event) {
    event.preventDefault();
    if (!window.confirm(`Registrar ${money.format(Number(amount))} para ${employees.find(p => p.id === person)?.name} com vigência em ${effective.split('-').reverse().join('/')}?`)) return;
    try {
      await setDoc(doc(db,'artifacts','comunica-salvador','public','data','companies',company,'salaryChanges',person+'_'+effective),{person,amount:Number(amount),effective,updatedBy:uid,updatedAt:serverTimestamp()});
      setStatus('Salário registrado.'); setAmount('');
    } catch { setStatus('Falha ao registrar. Verifique a conexão, a permissão ou se já há registro nesta data.'); }
  }
  return <section className={panel}><h3 className="text-lg font-bold">Enquadramento e reajustes individuais</h3><div className="max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th>Colaborador</th><th>Cargo</th><th>Salário vigente</th><th>Enquadramento</th></tr></thead><tbody>{employees.map(p => {
    const role = roles.find(r => r.id === p.roleId || r.name === p.role);
    const plan = records[role?.id]?.plan;
    const pay = entries.find(e => e.person === p.id && e.effective <= today);
    const values = plan && salaryBands(plan).map(b => b.value);
    const label = !pay ? 'Salário pendente' : !values ? 'Plano pendente' : pay.amount < Math.min(...values) ? 'Abaixo da matriz' : pay.amount > Math.max(...values) ? 'Acima da matriz' : 'Dentro da matriz';
    return <tr key={p.id} className="border-t"><td className="py-2">{p.name}</td><td>{role?.name || p.role}</td><td>{pay ? money.format(pay.amount) : '—'}</td><td>{label}</td></tr>;
  })}</tbody></table></div><form onSubmit={save} className="space-y-3"><div className="grid items-end gap-2 sm:grid-cols-3"><label>Colaborador<PurchaseSelect searchPlaceholder="Buscar por nome" label="Colaborador para enquadramento" value={person} onChange={id => { setPerson(id); setAmount(''); }} required placeholder="Escolha" options={employees.map(p => [p.id, p.name])} /></label><label>Novo salário<input className={field} required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}/></label><label>Início da vigência<input required className={field} type="date" value={effective} onChange={e => setEffective(e.target.value)}/></label></div>
    {person && <section className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div><h4 className="font-bold">Simulação de reajuste</h4><p className="text-xs text-slate-600">Impacto mensal no salário bruto individual, com vigência em {effective ? effective.split('-').reverse().join('/') : 'data a definir'}.</p></div>
      {proposedBands.length > 0 && <label>Simular com uma faixa da matriz
        <select className={field} value="" onChange={event => { if (event.target.value) setAmount(event.target.value); }}>
          <option value="">Escolha uma faixa ou informe o valor manualmente</option>
          {proposedBands.map(band => <option key={band.label} value={band.value.toFixed(2)}>{band.label} · {money.format(band.value)}</option>)}
        </select>
      </label>}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Salário vigente', currentPay ? money.format(currentPay.amount) : 'Sem registro'],
          ['Valor proposto', proposedAmount > 0 ? money.format(proposedAmount) : 'A informar'],
          ['Faixa proposta', matchingBands.length ? matchingBands.map(band => band.label).join(', ') : '—'],
          ['Diferença mensal', difference === null ? '—' : money.format(difference) + (percent === null ? '' : ` · ${percent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`)],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-600">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
      </dl>
    </section>}
    <button type="submit" disabled={!person || !effective || !(proposedAmount > 0)} className="rounded-xl bg-blue-800 px-4 py-2 font-semibold text-white disabled:opacity-50">Confirmar reajuste</button>
    </form>
    {person && <ul>{entries.filter(e => e.person === person).map(e => <li key={e.effective}>{e.effective.split('-').reverse().join('/')} · {money.format(e.amount)}</li>)}</ul>}<p role="status">{status}</p></section>;
}

export default function DpiWorkspace({ db, company, uid, roles, employees, activities, departments, getDepartments, openActivity, fixedView = '', initialRoleId = '' }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(false);
  const [roleId, setRoleId] = useState(initialRoleId);
  const [requestedBand, setRequestedBand] = useState(null);
  const [salarySearch, setSalarySearch] = useState('');
  const [editRequest, setEditRequest] = useState(0);
  const salaryEditor = useRef(null);
  const salaryDirty = useRef(false);
  const salarySaving = useRef(false);

  function markSalaryDirty(value = true) {
    salaryDirty.current = value;
  }

  function openSalaryEditor(id, band = null, scroll = true) {
    if (salarySaving.current) return;
    if (salaryDirty.current && !window.confirm('Há alterações no rascunho. Descartar e abrir a edição selecionada?')) return;
    markSalaryDirty(false);
    setRoleId(id);
    setRequestedBand(band);
    setEditRequest(previous => previous + 1);
    if (scroll) {
      salaryEditor.current?.scrollIntoView({ block: 'start' });
      salaryEditor.current?.focus({ preventScroll: true });
    }
  }
  const [metric, setMetric] = useState('all');
  const [employee, setEmployee] = useState('');
  const [selectedView, setView] = useState('performance');
  const view = fixedView || selectedView;
  const today = dateFormat.format(new Date());
  const active = employees.filter(person => !person.terminationDate || person.terminationDate > today);
  const ordered = [...roles].sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
  const choices = [standard, ...ordered];
  const currentRole = choices.find(role => role.id === roleId);
  const [unit, setUnit] = useState('');
  const [filterRole,setFilterRole] = useState('');
  const [slice, setSlice] = useState(null);
  const [manager, setManager] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  useEffect(() => onSnapshot(collection(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'salaryPlans'),
    snapshot => setRecords(Object.fromEntries(snapshot.docs.map(record => [record.id, record.data()]))),
    () => setError(true)), [db, company]);

  function save(role, revision, plan) {
    salarySaving.current = true;
    const ref = doc(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'salaryPlans', role);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if ((snapshot.data()?.revision || 0) !== revision) throw new Error('stale');
      const history = doc(ref, 'history', String(revision + 1));
      const change = { plan, revision: revision + 1, updatedBy: uid, updatedAt: serverTimestamp() };
      transaction.set(ref, change);
      transaction.set(history, change);
    }).finally(() => { salarySaving.current = false; });
  }

  const roleName = roleNameKey(roles.find(role => role.id === filterRole)?.name);
  const matchingAssignees = new Set(employees.filter(person =>
    (!employee || person.id === employee)
    && (!filterRole || (person.roleId ? person.roleId === filterRole : Boolean(roleName && roleName === roleNameKey(person.role))))
  ).map(person => person.id));
  const inUnit = (record, id) => record.unit ? record.unit === id : employees.some(person =>
    matchingAssignees.has(person.id) && record.assigneeIds?.includes(person.id) && getDepartments(person).includes(id));
  const activityRows = activities.map(record => {
    const completed = record.resolvedAt ? dateFormat.format(new Date(record.resolvedAt)) : '';
    let status = 'open';
    if (record.status === 'resolved') status = record.dueDate && completed ? (completed <= record.dueDate ? 'ontime' : 'late') : 'unrated';
    else if (record.dueDate && record.dueDate < today) status = 'overdue';
    const day = completed || record.dueDate || (record.createdAt ? dateFormat.format(new Date(record.createdAt)) : '');
    return { record, status, day };
  });
  const rows = activityRows.filter(({record, day}) =>
    ((!employee && !filterRole) || record.assigneeIds?.some(id => matchingAssignees.has(id)))
    && (!unit || inUnit(record, unit))
    && (!manager || record.manager === manager)
    && (!from || day >= from)
    && (!to || (day && day <= to))
  );
  const metrics = [['all', 'Atividades'], ['ontime', 'No prazo'], ['late', 'Concluídas com atraso'], ['overdue', 'Abertas vencidas']];
  const chartRows = rows.filter(row => {
    if (!slice) return true;
    if (slice.kind === 'month') return row.day.startsWith(slice.id) && ['ontime', 'late'].includes(row.status);
    if (slice.kind === 'manager') return row.record.manager === slice.id;
    return inUnit(row.record, slice.id);
  });
  const selectedRows = chartRows.filter(row => metric === 'all' || row.status === metric);
  const evaluated = chartRows.filter(row => row.status === 'ontime' || row.status === 'late').length;
  const onTime = chartRows.filter(row => row.status === 'ontime').length;
  return <section className="space-y-4 text-sm text-slate-900">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white">
      <h2 className="text-2xl font-bold">{fixedView === 'salary' ? 'Matriz salarial e reajustes' : fixedView ? 'Indicadores e PDI' : 'Desempenho e carreira'}</h2>
      {!fixedView && <nav aria-label="Desempenho e carreira" className="flex flex-wrap gap-1 rounded-xl border border-white/20 p-1">
        {[['performance', 'Indicadores'], ['salary', 'Cargos e salários'], ['management', 'Gerentes']].map(([key, label]) => <button type="button" key={key} aria-pressed={view === key} onClick={() => setView(key)} className={`rounded-lg px-3 py-2 font-semibold ${view === key ? 'bg-blue-700 text-white' : 'text-white hover:bg-white/10'}`}>{label}</button>)}
      </nav>}
    </header>
    {view === 'performance' && <PlrSimulator {...{company, uid, employees}} roles={ordered} rows={activityRows} />}
    <section className={view === 'performance' ? panel : 'hidden'}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold">Atividades por situação</h3><p className="text-slate-600">Use os filtros e os gráficos para explorar as atividades.</p></div>
        <label>Colaborador<PurchaseSelect searchPlaceholder="Buscar por nome" label="Colaborador" value={employee} onChange={selectedId => { setEmployee(selectedId); setSlice(null); }} placeholder={"Toda a equipe · " + (active.length) + " ativos"} options={active.map(person => [person.id, person.name])} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-4" onChange={() => setSlice(null)}>
        <label>Loja ou setor<select className={field} value={unit} onChange={e => setUnit(e.target.value)}><option value="">Todos</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label>Cargo<select className={field} value={filterRole} onChange={e => setFilterRole(e.target.value)}><option value="">Todos</option>{ordered.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
        <label>Gerente designado<PurchaseSelect searchPlaceholder="Buscar por nome" label="Gerente designado" value={manager} onChange={selectedId => { setManager(selectedId); setSlice(null); }} placeholder="Todos" options={[...new Set(activities.map(a => a.manager).filter(Boolean))].map(id => [id, employees.find(p => p.id === id)?.name || id])} /></label>
        <label>De<input className={field} type="date" max={to} value={from} onChange={e => setFrom(e.target.value)} /></label><label>Até<input className={field} type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></label>
      </div>
      {slice && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 p-3 text-blue-950">
        <span>Recorte do gráfico · <strong>{slice.kind === 'month' ? slice.id.split('-').reverse().join('/') : slice.label}</strong></span>
        <button type="button" className="font-semibold underline" onClick={() => { setSlice(null); setMetric('all'); }}>Limpar recorte</button>
      </div>}
      {employee && <p>Admissão · {active.find(person => person.id === employee)?.hireDate?.split('-').reverse().join('/') || 'Data pendente no cadastro'}</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col justify-center rounded-2xl bg-blue-50 p-5">
          <p className="font-semibold text-blue-800">Entregas no prazo</p>
          <strong className="mt-2 text-4xl tabular-nums text-blue-950">{evaluated ? `${Math.round(onTime / evaluated * 100)}%` : '—'}</strong>
          <span className="mt-1 text-slate-700">{onTime} de {evaluated} conclusões com prazo e data de entrega</span>
        </div>
        <div className="space-y-2" role="group" aria-label="Gráfico de atividades por situação">{metrics.map(([key, label], index) => {
          const count = key === 'all' ? chartRows.length : chartRows.filter(row => row.status === key).length;
          const colors = ['bg-blue-700', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-600'];
          return <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)} className="block w-full rounded-xl border border-slate-200 p-2.5 text-left aria-pressed:border-blue-600 aria-pressed:bg-blue-50">
            <span className="flex justify-between gap-2"><span>{label}</span><strong className="tabular-nums">{count}</strong></span>
            <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-200"><span className={`block h-full rounded-full ${colors[index]}`} style={{ width: `${chartRows.length ? count / chartRows.length * 100 : 0}%` }} /></span>
          </button>;
        })}</div>
      </div>
      <TeamCharts employees={employees} rows={rows} departments={departments.filter(d => !unit || unit === d.id)} inUnit={inUnit} select={value => { setSlice(value); setMetric('all'); }} />
      <details open><summary className="cursor-pointer font-semibold">{metrics.find(([key]) => key === metric)?.[1]} · {selectedRows.length} registros</summary>
        {selectedRows.length ? <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">{selectedRows.map(({ record }) => <li key={record.id}><button type="button" onClick={() => openActivity(record.id)} className="w-full rounded-lg border p-2 text-left hover:bg-blue-50">{record.title} · {record.dueDate || 'Sem prazo'}</button></li>)}</ul> : <p className="mt-2 text-slate-600">Nenhuma atividade neste recorte.</p>}
      </details>
    </section>
    {view === 'management' && <Managers {...{db,company,departments,active,today}} />}
    <section className={view === 'salary' ? 'space-y-3' : 'hidden'}>
      {records && view === 'salary' && <SalaryHierarchy roles={ordered} records={records} initialRoleId={roleId} openEditor={openSalaryEditor} />}
      {records && <div className={panel}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="text-lg font-bold">Tabela geral de cargos e salários</h3><p className="text-slate-600">Clique no cargo para editar o plano, ou em um valor para ajustar a faixa.</p></div>
          <label>Buscar cargo<input className={field} type="search" value={salarySearch} onChange={event => setSalarySearch(event.target.value)} /></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-right">
          <thead><tr><th className="sticky left-0 bg-white p-2 text-left" scope="col">Cargo</th>{bandNames.map(band => <th className="p-2" key={band} scope="col">{band}</th>)}</tr></thead>
          <tbody>{ordered.filter(role => roleNameKey(role.name).includes(roleNameKey(salarySearch))).map(role => {
            const plan = records[role.id]?.plan;
            const values = plan ? salaryBands(plan) : null;
            return <tr key={role.id} className={`border-t ${roleId === role.id ? 'bg-blue-50' : ''}`}>
              <th className="sticky left-0 bg-white text-left" scope="row"><button type="button" className="p-2 text-blue-800 hover:underline" onClick={() => openSalaryEditor(role.id)}>{role.name}</button></th>
              {values ? values.map(({ label, value }, i) => <td key={label}><button type="button" className="rounded-md px-2 py-2 text-blue-900 hover:bg-blue-100 hover:underline"
                aria-label={`Editar ${role.name}, faixa ${label}: ${money.format(value)}`} onClick={() => openSalaryEditor(role.id, i)}>{money.format(value)}{(plan.overrides?.[i] ?? '') !== '' && <small className="block text-slate-600">Manual</small>}</button></td>)
                : <td colSpan={bandNames.length} className="text-left"><button type="button" className="p-2 text-blue-800 underline" onClick={() => openSalaryEditor(role.id)}>Configurar plano</button></td>}
            </tr>;
          })}</tbody>
        </table></div>
        {!ordered.some(role => roleNameKey(role.name).includes(roleNameKey(salarySearch))) && <p>Nenhum cargo encontrado.</p>}
      </div>}
      <section ref={salaryEditor} tabIndex={-1} aria-label="Editor do plano salarial" className="grid min-w-0 items-start gap-3 scroll-mt-28 xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div className={panel}><h3 className="text-lg font-bold">Editar plano salarial</h3>
          <PurchaseSelect searchPlaceholder="Buscar cargo" label="Cargo para editar" value={roleId} onChange={id => openSalaryEditor(id, null, false)}
            placeholder="Selecione um cargo" options={choices.map(role => [role.id, role.name + (records?.[role.id]?.plan?.active === false ? ' · Inativo' : '')])} />
        </div>
        {error ? <p role="alert">Não foi possível carregar os planos salariais.</p> : records === null ? <p role="status">Consultando os planos…</p> : currentRole &&
          <SalaryPlan key={`${roleId}:${editRequest}`} role={currentRole} roles={choices} plans={records} save={save} requestedBand={requestedBand} selectBand={setRequestedBand} markDirty={markSalaryDirty} />}
      </section>
      {records && view === 'salary' && <Compensation {...{db,company,uid,roles,records,today}} employees={active} />}
    </section>
  </section>;
}
