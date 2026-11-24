import { useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { buildIntegraNavigation, buildManagementNavigation } from './managementNavigation.js';
import { allowsCompanyTab } from './companyTabAccess.js';
import { useCompanyTabAccess } from './useCompanyTabAccess.js';

const sections = [...buildManagementNavigation({isAdmin:true, canUsePersonnel:true, canAccessProductivity:true, canManageCareers:true, canManageWhistleblowing:true}), ...buildIntegraNavigation(true)];
export default function CompanyTabsControl({db, appId, company, uid}) {
  const access = useCompanyTabAccess(db, appId, company.id, uid);
  const [point, setPoint] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'companies', company.id, 'timePilot', 'config'),
    snap => setPoint(snap.data()?.enabled === true), () => setPoint(null)), [db,appId,company.id]);

  async function change(item, before) {
    const enabled = !before;
    if (busy || !window.confirm((enabled ? 'Liberar ' : 'Suspender ') + item.label + ' para ' + company.name + '?')) return;
    setBusy(true);
    setMessage('');
    const path = ['artifacts',appId,'public','data','companies',company.id];
    const isPoint = item.id === 'time-pilot';
    const ref = doc(db,...path,...(isPoint ? ['timePilot','config'] : ['platformAccess','tabs']));
    try {
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const data = snapshot.data();
        const current = isPoint ? data?.enabled === true : allowsCompanyTab(data || {defaultEnabled:true}, item.id);
        if (current !== before) throw Error('stale');
        const audit = {updatedAt:serverTimestamp(), updatedBy:uid};
        tx.set(ref, isPoint ? {enabled,...audit} : {defaultEnabled:data?.defaultEnabled ?? true, tabs:{...data?.tabs,[item.id]:enabled}, ...audit});
      });
      setMessage(item.label + (enabled ? ' liberada.' : ' suspensa.'));
    } catch (error) {
      setMessage(error.message === 'stale' ? 'A liberação mudou. Confira o estado atual.' : 'Falha ao alterar a liberação.');
    } finally { setBusy(false); }
  }
  return <div className="mt-5 border-t pt-4"><h4 className="font-bold">Abas da empresa</h4>
    <p className="text-xs text-slate-600">A empresa distribui entre seus colaboradores as abas que o suporte libera. As abas do Integra também dependem da liberação do produto.</p>
    {access?.error && <p role="alert">Falha ao consultar as liberações.</p>}
    {sections.map(section => <fieldset key={section.label} className="mt-4"><legend className="text-sm font-bold">{section.label}</legend><div className="grid gap-2 sm:grid-cols-2">
      {section.items.filter(item => item.id !== 'platform-support').map(item => {
        const isPoint = item.id === 'time-pilot';
        const ready = isPoint ? point !== null : Boolean(access?.policy);
        const enabled = isPoint ? point : allowsCompanyTab(access?.policy,item.id);
        return <button key={item.id} type="button" aria-pressed={Boolean(enabled)} disabled={!ready || busy} onClick={() => change(item,enabled)}
          className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm">
          <span>{item.label}</span><strong className={enabled ? 'text-emerald-800' : 'text-slate-600'}>{!ready ? 'Consultando…' : enabled ? 'Liberada' : 'Suspensa'}</strong>
        </button>;
      })}
    </div></fieldset>)}
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </div>;
}
