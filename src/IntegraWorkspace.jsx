import { lazy, Suspense, useState } from 'react';

const PurchaseManagement = lazy(() => import('./PurchaseManagement.jsx'));
const FleetWorkspace = lazy(() => import('./FleetWorkspace.jsx'));

export default function IntegraWorkspace({ active, activeTab, onNavigate, ...props }) {
  const purchasesOpen = active && activeTab === 'integra';
  const [purchasesVisited, setPurchasesVisited] = useState(purchasesOpen);
  if (purchasesOpen && !purchasesVisited) setPurchasesVisited(true);

  return (
    <>
      {purchasesVisited && <Suspense fallback={purchasesOpen && <p className="p-4 text-sm text-slate-600">Carregando Compras…</p>}>
        <PurchaseManagement {...props} active={purchasesOpen} />
      </Suspense>}
      {active && !purchasesOpen && <Suspense fallback={<p className="p-4 text-sm text-slate-600">Carregando Frota…</p>}>
        <FleetWorkspace db={props.db} appId={props.appId} companyId={props.companyId} user={props.user}
          users={props.users} activeTab={activeTab} onNavigate={onNavigate} />
      </Suspense>}
    </>
  );
}
