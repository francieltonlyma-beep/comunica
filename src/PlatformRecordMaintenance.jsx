import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

const recordTypes = {
  announcements: 'Avisos',
  posts: 'Publicações',
  departments: 'Setores',
  roles: 'Cargos',
  events: 'Eventos',
  activities: 'Atividades',
  activityTemplates: 'Modelos de atividades',
  purchaseProducts: 'Produtos de compras',
};
const labels = { create: 'Inclusão', update: 'Alteração', delete: 'Exclusão', restore: 'Restauração' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const buttonClass = 'rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50';

export default function PlatformRecordMaintenance({ companies, functionsClient }) {
  const [companyId, setCompanyId] = useState('');
  const [collection, setCollection] = useState('announcements');
  const [recordId, setRecordId] = useState('');
  const [records, setRecords] = useState(null);
  const [record, setRecord] = useState(null);
  const [fields, setFields] = useState('{}');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  function changeTarget(setValue, value) {
    setValue(value);
    setRecord(null);
    setFields('{}');
    setReason('');
    setAction('');
    setError('');
    setStatus('');
  }

  function changeCollection(setValue, value) {
    changeTarget(setValue, value);
    setRecordId('');
    setRecords(null);
  }

  async function submit(operation) {
    const target = { companyId, collection, recordId: recordId.trim() };
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const call = httpsCallable(functionsClient, 'platformRecordMaintenance');
      if (operation === 'list') {
        const response = await call({ ...target, recordId: 'list', action: 'list' });
        setRecords(response.data.records);
        return;
      }
      if (operation !== 'read') {
        await call({
          ...target, action: operation, fields, reason, version: record.version,
          revision: record.history[0]?.id || '',
        });
        setStatus(`${labels[operation]} registrada.`);
      }
      const response = await call({ ...target, action: 'read' });
      setRecord(response.data);
      setFields('{}');
      setReason('');
      setAction('');
    } catch (failure) {
      setError(failure.code === 'functions/internal' ? 'Não foi possível concluir. Consulte o registro novamente.' : failure.message);
      setRecord(null);
      setAction('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <summary className="cursor-pointer text-base font-extrabold">Manutenção de registros</summary>
      <p className="mt-2 text-sm text-slate-600">As ações afetam os dados reais da empresa. A última ação pode ser revertida em até 7 dias se o registro não tiver mudado.</p>
      <fieldset disabled={busy} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold">Empresa
            <select className={inputClass} value={companyId} onChange={event => changeCollection(setCompanyId, event.target.value)}>
              <option value="">Selecione</option>
              {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Tipo de registro
            <select className={inputClass} value={collection} onChange={event => changeCollection(setCollection, event.target.value)}>
              {Object.entries(recordTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">ID do registro
            <input className={inputClass} value={recordId} maxLength={250} onChange={event => changeTarget(setRecordId, event.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <button type="button" className={buttonClass} disabled={!functionsClient || !companyId} onClick={() => submit('list')}>Listar até 50 registros</button>
          {records?.length > 0 && <label className="text-xs font-bold">Registros encontrados
            <select className={inputClass} value={recordId} onChange={event => changeTarget(setRecordId, event.target.value)}>
              <option value="">Selecione</option>
              {records.map(item => <option key={item.id} value={item.id}>{item.title ? `${item.title} · ${item.id}` : item.id}</option>)}
            </select>
          </label>}
          {records?.length === 0 && <p>Nenhum registro encontrado.</p>}
        </div>
        <button type="button" className={buttonClass} disabled={!functionsClient || !companyId || !recordId.trim()} onClick={() => submit('read')}>Consultar registro</button>
        {record && <>
          {record.exists ? <pre className="max-h-60 overflow-auto rounded-lg bg-slate-100 p-3 text-xs">{record.data}</pre> : <p className="text-sm">Nenhum registro com esse ID.</p>}
          <div className="flex flex-wrap gap-2 text-sm">
            {record.exists ? <>
              <button type="button" className={buttonClass} onClick={() => setAction('update')}>Alterar</button>
              <button type="button" className={`${buttonClass} text-rose-700`} onClick={() => setAction('delete')}>Apagar</button>
            </> : <button type="button" className={buttonClass} onClick={() => setAction('create')}>Inserir</button>}
            {record.history[0]?.canRestore && <button type="button" className={buttonClass} onClick={() => setAction('restore')}>Reverter última ação</button>}
          </div>
          {action && (
            <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-bold">{labels[action]} de {recordTypes[collection]} · {recordId.trim()} · {companies.find(company => company.id === companyId)?.name}</p>
              {['create', 'update'].includes(action) && <label className="block text-xs font-bold">
                {action === 'create' ? 'Dados do registro em JSON' : 'Campos a substituir em JSON'}
                <textarea className={`${inputClass} font-mono`} rows={5} value={fields} onChange={event => setFields(event.target.value)} />
              </label>}
              <label className="block text-xs font-bold">Motivo
                <input className={inputClass} maxLength={300} value={reason} onChange={event => setReason(event.target.value)} />
              </label>
              <div className="flex gap-2 text-sm">
                <button type="button" className={`${buttonClass} bg-slate-900 text-white`} disabled={!reason.trim()} onClick={() => submit(action)}>Confirmar {labels[action].toLowerCase()}</button>
                <button type="button" className={buttonClass} onClick={() => setAction('')}>Cancelar</button>
              </div>
            </div>
          )}
          <h4 className="text-sm font-bold">Histórico recente</h4>
          {record.history.length === 0 ? <p className="text-sm text-slate-600">Nenhuma ação de manutenção registrada.</p> : (
            <ul className="space-y-2 text-sm">
              {record.history.map(entry => <li key={entry.id} className="rounded-lg border border-slate-200 p-2">
                <strong>{labels[entry.action]}</strong> · {new Date(entry.recordedAt).toLocaleString('pt-BR')} · {entry.actor}
                <p>{entry.reason}</p>
                {entry.canRestore && <p className="text-xs text-slate-600">Disponível para reversão até {new Date(entry.expiresAt).toLocaleString('pt-BR')}</p>}
              </li>)}
            </ul>
          )}
        </>}
      </fieldset>
      {busy && <p role="status" className="mt-3 text-sm">Processando…</p>}
      {status && <p role="status" className="mt-3 text-sm text-emerald-800">{status}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </details>
  );
}
