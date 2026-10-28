import { useEffect, useRef, useState } from 'react';
import { startScheduleDraftAutosave, createScheduleDraftStore } from './scheduleDrafts.js';

const button = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40';

export default function ScheduleDraftBar({ api, appId, companyId, ownerId, snapshot, departmentIds, onRestore, disabled }) {
  const latest = useRef(null), active = useRef({ id: null, revision: null, fingerprint: null }), saving = useRef(false);
  const [drafts, setDrafts] = useState([]), [selected, setSelected] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const persist = async automatic => {
    if (saving.current || !latest.current || latest.current.disabled) return;
    const current = latest.current, fingerprint = JSON.stringify(current.snapshot);
    if (automatic && fingerprint === active.current.fingerprint) return;
    saving.current = true; setBusy(true);
    try {
      const store = createScheduleDraftStore(current.api, current);
      const id = active.current.id || globalThis.crypto.randomUUID();
      const metadata = await store.save(id, active.current.revision, current.snapshot, current.departmentIds);
      active.current = { id, revision: metadata.revision, fingerprint };
      setSelected(id); setDrafts(previous => [{ id, ...metadata }, ...previous.filter(item => item.id !== id)]);
      setMessage(`${automatic ? 'Salvamento automático' : 'Rascunho salvo'} às ${new Date(metadata.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`);
    } catch (error) { setMessage(`Não foi possível salvar o rascunho. ${error.message || 'Confira a conexão e tente novamente.'}`); }
    finally { saving.current = false; setBusy(false); }
  };
  useEffect(() => { latest.current = { snapshot, departmentIds, disabled, api, appId, companyId, ownerId, onRestore }; });
  useEffect(() => {
    let cancelled = false;
    const store = createScheduleDraftStore(api, { appId, companyId, ownerId });
    store.list().then(items => { if (!cancelled) setDrafts(items); }).catch(() => { if (!cancelled) setMessage('Não foi possível carregar os rascunhos. Confira a conexão.'); });
    const stopAutosave = startScheduleDraftAutosave(() => {
      const current = latest.current;
      return { enabled: Boolean(current && !current.disabled && current.snapshot.bulk.userIds.length), busy: saving.current, dirty: Boolean(current && active.current.fingerprint !== JSON.stringify(current.snapshot)) };
    }, () => persist(true));
    return () => { cancelled = true; stopAutosave(); };
    // API/context are fixed for this mounted company/user. Latest edits use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, companyId, ownerId]);

  const restore = async () => {
    if (!selected || saving.current) return;
    saving.current = true; setBusy(true);
    try {
      const current = latest.current;
      const { metadata, snapshot: saved } = await createScheduleDraftStore(current.api, current).load(selected);
      await current.onRestore(saved);
      active.current = { id: selected, revision: metadata.revision, fingerprint: null };
      setMessage('Rascunho reaberto. Revise a prévia antes de publicar.');
    } catch (error) { setMessage(error.message || 'Não foi possível reabrir o rascunho.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4" aria-label="Rascunhos da escala"><div><h4 className="text-sm font-bold text-blue-950">Rascunho da escala</h4><p className="mt-1 text-xs leading-5 text-slate-600">Salve para continuar depois. Enquanto esta tela estiver aberta, alterações são salvas automaticamente a cada 5 minutos. O rascunho fica disponível para você nesta empresa e não publica no calendário.</p></div><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={disabled || busy || !snapshot.bulk.userIds.length} onClick={() => void persist(false)}>{busy ? 'Aguarde...' : 'Salvar rascunho'}</button><button type="button" className={button} disabled={disabled || busy || !snapshot.bulk.userIds.length} onClick={() => { active.current = { id: null, revision: null, fingerprint: null }; void persist(false); }}>Salvar nova cópia</button><label className="min-w-0 flex-1 text-xs text-slate-600">Rascunhos salvos<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" disabled={disabled || busy} value={selected} onChange={event => setSelected(event.target.value)}><option value="">Selecione para reabrir</option>{drafts.map(item => <option key={item.id} value={item.id}>{item.startDate.split('-').reverse().join('/')} a {item.endDate.split('-').reverse().join('/')} · {new Date(item.updatedAt).toLocaleString('pt-BR')}</option>)}</select></label><button type="button" className={button} disabled={disabled || busy || !selected} onClick={() => void restore()}>Reabrir rascunho</button></div>{message && <p role="status" className="text-xs leading-5 text-blue-950">{message}</p>}</section>;
}
