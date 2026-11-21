import { lazy, Suspense, useState } from 'react';
import { Package, Truck } from 'lucide-react';
import PurchaseManagement from './PurchaseManagement.jsx';

const FleetWorkspace = lazy(() => import('./FleetWorkspace.jsx'));

export default function IntegraWorkspace({ initialPurchaseId, ...props }) {
  const [module, setModule] = useState('purchases');
  const [openedPurchase, setOpenedPurchase] = useState(null);
  if (initialPurchaseId && initialPurchaseId !== openedPurchase) {
    setOpenedPurchase(initialPurchaseId);
    setModule('purchases');
  }

  return (
    <>
      <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Módulos do Comunica Integra">
        {[['purchases', 'Compras', Package], ['fleet', 'Frota', Truck]].map(([id, label, Icon]) => (
          <button key={id} type="button" aria-pressed={module === id} onClick={() => setModule(id)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${module === id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>
      <div hidden={module !== 'purchases'}><PurchaseManagement {...props} initialPurchaseId={initialPurchaseId} /></div>
      {module === 'fleet' && (
        <Suspense fallback={<p className="p-4 text-sm text-slate-600">Carregando controle de frota…</p>}>
          <FleetWorkspace db={props.db} appId={props.appId} companyId={props.companyId} user={props.user} users={props.users} />
        </Suspense>
      )}
    </>
  );
}
