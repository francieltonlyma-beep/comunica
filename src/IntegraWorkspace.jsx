import { lazy, Suspense, useState } from 'react';

const FleetWorkspace = lazy(() => import('./FleetWorkspace.jsx'));
const PurchaseManagement = lazy(() => import('./PurchaseManagement.jsx'));

export default function IntegraWorkspace({ activeTab, onNavigate, ...props }) {
  const purchasesOpen = activeTab === 'integra';
  const [purchasesVisited, setPurchasesVisited] = useState(purchasesOpen);
  if (purchasesOpen && !purchasesVisited) setPurchasesVisited(true);

  return (
    <>
      {purchasesVisited && <div hidden={!purchasesOpen}>
        <Suspense fallback={<p className="p-4 text-sm text-slate-600">Carregando Compras…</p>}>
          <PurchaseManagement {...props} />
        </Suspense>
      </div>}
      {!purchasesOpen && <Suspense fallback={<p className="p-4 text-sm text-slate-600">Carregando Frota…</p>}>
        <FleetWorkspace db={props.db} appId={props.appId} companyId={props.companyId} user={props.user}
          users={props.users} activeTab={activeTab} onNavigate={onNavigate} />
      </Suspense>}
    </>
  );
}
