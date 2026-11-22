import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { hrDay } from './personnelModel.js';

export function usePersonnelDay(active) {
  const [day, setDay] = useState(hrDay);
  useEffect(() => {
    if (!active) return;
    const refresh = () => setDay(hrDay());
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [active]);
  return day;
}

export function usePersonnelRows(db, company, source, mode = '', uid = '') {
  const key = JSON.stringify([company, source, mode, uid]);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!db || !company || !source) return;
    const rows = collection(
      db,
      'artifacts',
      'comunica-salvador',
      'public',
      'data',
      'companies',
      company,
      source,
    );
    const target =
      mode === 'employment'
        ? query(rows, where('kind', 'in', ['admission', 'termination']))
        : mode === 'assigned'
          ? query(rows, where('owner', '==', uid))
          : rows;
    return onSnapshot(
      target,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.fromCache || snap.metadata.hasPendingWrites) return;
        setResult({
          key,
          rows: snap.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            at: doc.data().updatedAt?.toMillis() || 0,
          })),
        });
      },
      () =>
        setResult({ key, rows: [], error: 'Falha ao consultar o RH. Confira a conexão e as permissões.' }),
    );
  }, [db, company, source, mode, uid, key]);
  return result?.key === key ? result : { rows: [], loading: Boolean(source) };
}
