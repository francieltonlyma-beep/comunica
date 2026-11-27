import { useState } from 'react';
import { ChevronRight, GitBranch, Pencil } from 'lucide-react';
import { salaryBands } from './careerReview.js';
import { roleNameKey } from './roleCatalog.js';
import { buildSalaryHierarchy, directReportChanges } from './salaryHierarchy.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const issues = {
  missing: 'O cargo superior vinculado está indisponível. Revise o vínculo no plano.',
  cycle: 'A cadeia de supervisão contém uma referência circular. Revise os vínculos dos cargos.',
};

function range(plan) {
  if (!plan || plan.hierarchyOnly) return 'Sem plano salarial';
  const values = salaryBands(plan).map(band => band.value);
  if (values.some(value => !Number.isFinite(value) || value <= 0)) return 'Faixas a configurar';
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? money.format(minimum) : `${money.format(minimum)} a ${money.format(maximum)}`;
}

function SubordinateEditor({ selected, nodes, save, close }) {
  const [initial] = useState(() => [...nodes.values()]);
  const [chosen, setChosen] = useState(() => new Set(selected.reports.map(node => node.id)));
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const blocked = new Set([selected.id, ...selected.chain.map(node => node.id)]);
  const choices = initial.filter(node => node.id !== selected.id && roleNameKey(node.name).includes(roleNameKey(search)));
  const changes = directReportChanges(selected.id, initial, chosen);
  const transfers = changes.filter(change => change.previous && change.supervisor);

  function toggle(id) {
    setChosen(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || !changes.length) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await save(changes);
      if (result.error) {
        const reason = result.error === 'cycle' ? 'O vínculo criaria um ciclo.' :
          result.error === 'stale' ? 'Outro usuário alterou um dos vínculos. Reabra a seleção para revisar.' :
            result.error === 'busy' ? 'Aguarde o outro salvamento e tente novamente.' : 'Confira a conexão e tente novamente.';
        setMessage(`${result.applied} de ${changes.length} vínculos confirmados. ${reason}`);
      } else {
        close(`${changes.length} ${changes.length === 1 ? 'vínculo atualizado' : 'vínculos atualizados'}.`);
      }
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
    <fieldset disabled={busy} className="space-y-3">
      <legend className="font-semibold">Subordinados diretos de {selected.name}</legend>
      <label className="block text-xs font-semibold">Buscar cargo para vincular
        <input type="search" value={search} onChange={event => setSearch(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
      </label>
      <div className="max-h-64 space-y-0.5 overflow-auto rounded-lg border border-slate-200 bg-white p-1">
        {choices.map(node => <label key={node.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
          <input type="checkbox" className="mt-1" checked={chosen.has(node.id)} disabled={blocked.has(node.id) && !chosen.has(node.id)} onChange={() => toggle(node.id)} />
          <span className="min-w-0 break-words">{node.name}
            {node.plan?.active === false && <small className="ml-1 text-slate-500">· Inativo</small>}
            {blocked.has(node.id) ? <small className="block text-slate-600">Faz parte da cadeia de superiores</small>
              : node.parent && node.parent.id !== selected.id && <small className="block text-slate-600">Superior atual · {node.parent.name}</small>}
          </span>
        </label>)}
        {choices.length === 0 && <p className="p-2 text-sm text-slate-600">Nenhum cargo encontrado.</p>}
      </div>
      <p className="text-xs">{chosen.size} selecionados · {changes.filter(change => change.supervisor).length} a vincular · {changes.filter(change => !change.supervisor).length} a desvincular</p>
      {transfers.length > 0 && <p className="rounded-lg bg-amber-100 p-2 text-xs text-amber-950">Ao salvar, estes cargos trocarão de superior direto: {transfers.map(change => initial.find(node => node.id === change.id)?.name).join(', ')}.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!changes.length} className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar subordinados'}</button>
        <button type="button" onClick={() => close('')} className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold">Fechar</button>
      </div>
    </fieldset>
    {message && <p role="status" className="text-xs font-semibold text-amber-950">{message}</p>}
  </form>;
}

export default function SalaryHierarchy({ roles, records, initialRoleId, openEditor, saveReports }) {
  const [selectedId, setSelectedId] = useState(initialRoleId);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState('');
  const [status, setStatus] = useState('');
  const { nodes, rows } = buildSalaryHierarchy(roles, records);
  const query = roleNameKey(search);
  const matches = rows.filter(node => roleNameKey(node.name).includes(query));
  const selected = nodes.get(selectedId) || matches[0] || rows[0];

  function selectRole(id) {
    setSelectedId(id);
    setEditing('');
    setStatus('');
  }

  function roleLink(node) {
    return <button type="button" className="min-w-0 break-words text-left font-semibold text-blue-800 hover:underline"
      disabled={Boolean(editing)} onClick={() => selectRole(node.id)}>{node.name}</button>;
  }

  return <details open className="rounded-2xl border border-slate-200 bg-white p-5">
    <summary className="cursor-pointer text-lg font-bold">Hierarquia dos cargos</summary>
    <p className="mt-2 text-slate-600">Selecione um cargo para ver a cadeia de supervisão e comparar as faixas salariais.</p>
    {!rows.length ? <p className="mt-3 text-slate-600">Cadastre um cargo para começar a montar a hierarquia.</p> : (
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0 space-y-2">
          <label className="block text-xs font-semibold">Buscar na hierarquia
            <input type="search" value={search} onChange={event => setSearch(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {matches.length === 0 ? <p className="py-2 text-slate-600">Nenhum cargo encontrado.</p> : (
            <ul className="max-h-80 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2" aria-label="Cargos na hierarquia">
              {matches.map(node => <li key={node.id} style={{ paddingInlineStart: query ? 0 : Math.min(5, node.depth) * 12 }}>
                <button type="button" aria-pressed={selected.id === node.id} disabled={Boolean(editing)} onClick={() => selectRole(node.id)}
                  className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-50 aria-pressed:bg-blue-50 aria-pressed:text-blue-900">
                  <GitBranch className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words font-semibold">{node.name}</span>
                  {node.issue ? <span className="shrink-0 text-xs text-amber-800">Revisar</span>
                    : node.plan?.active === false ? <span className="shrink-0 text-xs text-slate-600">Inativo</span>
                      : (!node.plan || node.plan.hierarchyOnly) && <span className="shrink-0 text-xs text-slate-600">Sem plano</span>}
                </button>
              </li>)}
            </ul>
          )}
        </div>
        <div className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="min-w-0 break-words text-base font-bold">{selected.name}</h4>
            <button type="button" disabled={Boolean(editing)} onClick={() => openEditor(selected.id)} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> {selected.plan && !selected.plan.hierarchyOnly ? 'Editar plano' : 'Configurar plano'}
            </button>
          </div>
          {selected.issue && <p role="status" className="rounded-lg bg-amber-50 p-2 text-amber-900">{issues[selected.issue]}</p>}
          {!selected.issue && selected.chain.length > 0 && <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label="Cadeia de supervisão">
            {selected.chain.map(node => <li key={node.id} className="inline-flex items-center gap-1">{roleLink(node)}<ChevronRight className="h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" /></li>)}
            <li aria-current="true" className="font-semibold">{selected.name}</li>
          </ol>}
          <dl className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-600">Superior direto</dt><dd>{selected.parent ? roleLink(selected.parent) : selected.issue === 'missing' ? 'Vínculo indisponível' : 'Sem superior definido'}</dd></div>
            <div><dt className="text-xs text-slate-600">Intervalo da matriz</dt><dd className="font-semibold">{range(selected.plan)}</dd></div>
            {selected.plan && !selected.plan.hierarchyOnly && <>
              <div><dt className="text-xs text-slate-600">Progressão por faixa</dt><dd className="font-semibold">{percent.format(Number(selected.plan.bandRate || 0))}%</dd></div>
              <div><dt className="text-xs text-slate-600">Progressão por nível</dt><dd className="font-semibold">{percent.format(Number(selected.plan.levelRate || 0))}%</dd></div>
            </>}
          </dl>
          {selected.parent && <p className="text-xs text-slate-600">Matriz do superior · {range(selected.parent.plan)}{selected.parent.plan?.active === false ? ' · Inativo' : ''}</p>}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="font-semibold">Cargos supervisionados diretamente</h5>
              {editing !== selected.id && <button type="button" onClick={() => { setEditing(selected.id); setStatus(''); }}
                className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50">Editar subordinados</button>}
            </div>
            {editing === selected.id && <div className="mt-2"><SubordinateEditor key={selected.id} selected={selected} nodes={nodes}
              save={saveReports} close={feedback => { setEditing(''); setStatus(feedback); }} /></div>}
            {status && <p role="status" className="mt-2 text-xs font-semibold text-emerald-800">{status}</p>}
            {selected.reports.length ? <ul className="mt-1 divide-y divide-slate-100">
              {selected.reports.map(node => <li key={node.id} className="flex flex-wrap items-center justify-between gap-1 py-1.5">
                {roleLink(node)}<span className="text-xs text-slate-600">{range(node.plan)}{node.plan?.active === false ? ' · Inativo' : ''}</span>
              </li>)}
            </ul> : <p className="mt-1 text-slate-600">Nenhum cargo vinculado diretamente.</p>}
          </div>
        </div>
      </div>
    )}
  </details>;
}
