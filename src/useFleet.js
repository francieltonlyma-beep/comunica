import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';

export function useFleetRecords(db, root, source, scope, id) {
  const key = JSON.stringify([root, source, scope, id]);
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    if (!db || scope === 'off') return undefined;
    const [path, name, filter, value] = JSON.parse(key);
    const records = collection(db, ...path, name);
    const target = filter === 'one' ? doc(records, value) : filter === 'driver' ? query(records, where('driverId', '==', value)) : records;
    return onSnapshot(target, result => {
      const rows = (result.docs ?? (result.exists() ? [result] : [])).map(item => ({ ...item.data(), id: item.id }));
      setSnapshot({ key, rows, error: '' });
    }, () => setSnapshot({ key, rows: [], error: 'Não foi possível consultar os dados da frota. Confira seu acesso e a conexão.' }));
  }, [db, key, scope]);
  return snapshot?.key === key ? snapshot : { rows: [], error: '', loading: scope !== 'off' };
}

export function useFleetLocation(db, root, tripId, driverId) {
  const [trackedTrip, setTrackedTrip] = useState(null);
  const [message, setMessage] = useState('');
  const watching = useRef(null);
  const tripKey = JSON.stringify(root);

  const stop = () => {
    if (watching.current !== null) navigator.geolocation.clearWatch(watching.current);
    watching.current = null;
    setTrackedTrip(null);
    setMessage('Compartilhamento encerrado.');
  };

  useEffect(() => () => {
    if (watching.current !== null) navigator.geolocation.clearWatch(watching.current);
    watching.current = null;
  }, [db, tripId, tripKey]);

  const start = () => {
    if (!tripId || watching.current !== null) return;
    if (!navigator.geolocation) {
      setMessage('Este aparelho não disponibiliza localização no navegador.');
      return;
    }
    let lastSent = 0;
    let saving = false;
    setTrackedTrip(tripId);
    setMessage('Aguardando permissão e sinal de localização…');
    watching.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (document.visibilityState !== 'visible' || saving || Date.now() - lastSent < 30_000) return;
      saving = true;
      try {
        await addDoc(collection(db, ...root, 'fleetTrips', tripId, 'points'), {
          driverId, lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, recordedAt: serverTimestamp(),
        });
        lastSent = Date.now();
        if (watching.current !== null) setMessage('Localização compartilhada enquanto esta tela estiver aberta.');
      } catch {
        if (watching.current !== null) setMessage('Falha ao salvar a localização. Verifique a conexão.');
      } finally {
        saving = false;
      }
    }, error => {
      if (error.code === 1) {
        stop();
        setMessage('Permissão de localização recusada. Você pode liberá-la nas configurações do navegador.');
      } else setMessage('Sinal indisponível. Tentando obter sua localização.');
    }, { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 });
  };

  return { tracking: Boolean(tripId && tripId === trackedTrip), message, start, stop };
}
