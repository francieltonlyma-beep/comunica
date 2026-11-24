import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

export function useCompanyTabAccess(db, appId, company, uid) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!db || !company || !uid) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'companies', company, 'platformAccess', 'tabs');
    return onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
      if (!snapshot.metadata.fromCache) setState({company, uid, policy: snapshot.data() || {defaultEnabled: true}});
    }, () => setState({company, uid, error: true}));
  }, [db, appId, company, uid]);
  return state?.company === company && state?.uid === uid ? state : null;
}
