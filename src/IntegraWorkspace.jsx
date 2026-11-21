import { lazy, Suspense, useState } from 'react';
import PurchaseManagement from './PurchaseManagement.jsx';

const FleetWorkspace = lazy(() => import('./FleetWorkspace.jsx'));

export default function IntegraWorkspace({ active, activeTab, onNavigate, ...props }) {
  const purchasesOpen = active && activeTab === 'integra';
  const [purchasesVisited, setPurchasesVisited] = useState(purchasesOpen);
  if (purchasesOpen && !purchasesVisited) setPurchasesVisited(true);

  return (
    <>
      {purchasesVisited && <PurchaseManagement {...props} active={purchasesOpen} />}
      {active && !purchasesOpen && <Suspense fallback={<p className="p-4 text-sm text-slate-600">Carregando Frota…</p>}>
        <FleetWorkspace db={props.db} appId={props.appId} companyId={props.companyId} user={props.user}
          users={props.users} activeTab={activeTab} onNavigate={onNavigate} />
      </Suspense>}
    </>
  );
}
