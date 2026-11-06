import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

export function useIntegraAccess(db, appId, companyId, signedIn) {
  const [access, setAccess] = useState({ companyId: '', enabled: false });
  useEffect(() => {
    if (!signedIn || !companyId) return undefined;
    const accessRef = doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'settings', 'integra-access');
    return onSnapshot(accessRef,
      snapshot => setAccess({ companyId, enabled: snapshot.exists() && snapshot.data().enabled === true }),
      () => setAccess({ companyId, enabled: false }));
  }, [db, appId, companyId, signedIn]);
  return signedIn && access.companyId === companyId && access.enabled;
}
