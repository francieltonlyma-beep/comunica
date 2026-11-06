import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function IntegraAccessControl({ db, appId, companies, supportUid }) {
  const [chosenId, setChosenId] = useState('');
  const companyId = companies.some(company => company.id === chosenId) ? chosenId : companies[0]?.id || '';
  const company = companies.find(item => item.id === companyId);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!db || !companyId) return undefined;
    const accessRef = doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'settings', 'integra-access');
    return onSnapshot(accessRef, snapshot => {
      setEnabled(snapshot.exists() && snapshot.data().enabled === true);
      setLoading(false);
      setError('');
    }, () => {
      setLoading(false);
      setError('Não foi possível consultar a liberação desta empresa.');
    });
  }, [appId, companyId, db]);

  async function changeAccess() {
    if (!db || !companyId || !supportUid || busy || loading) return;
    setBusy(true);
    setError('');
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'settings', 'integra-access'), {
        enabled: !enabled, updatedAt: Date.now(), updatedBy: supportUid,
      });
    } catch {
      setError('Não foi possível alterar a liberação. Confira sua sessão de suporte.');
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="Liberação do Comunica Integra" className="rounded-3xl border border-teal-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">Acesso por empresa</span>
        <h3 className="mt-1 text-lg font-extrabold text-slate-900">Comunica Integra</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">Você libera ou suspende este produto. A empresa alterna entre Gestão e Integra na mesma sessão.</p>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${enabled && !loading ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{loading ? 'Consultando...' : enabled ? 'Liberado' : 'Bloqueado'}</span>
    </div>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="min-w-48 flex-1 text-xs font-bold text-slate-700">Empresa
        <select className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900" value={companyId} onChange={event => { setChosenId(event.target.value); setLoading(true); setEnabled(false); setError(''); }}>
          {companies.map(item => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
        </select>
      </label>
      <button type="button" disabled={!companyId || loading || busy} onClick={changeAccess}
        className={`rounded-xl px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-rose-700 hover:bg-rose-800' : 'bg-teal-800 hover:bg-teal-900'}`}>
        {busy ? 'Salvando...' : enabled ? 'Suspender Integra' : 'Liberar Integra'}
      </button>
    </div>
    {company && <p className="mt-3 text-xs text-slate-500">Empresa selecionada: <strong>{company.name || company.id}</strong>. A liberação vale para esta empresa.</p>}
    {error && <p role="alert" className="mt-3 text-xs font-bold text-rose-700">{error}</p>}
  </section>;
}
