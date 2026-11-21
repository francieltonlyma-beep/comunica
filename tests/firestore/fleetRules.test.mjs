import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { fleetDate } from '../../src/fleetOperations.js';

const env = await initializeTestEnvironment({ projectId: 'demo-comunica', firestore: {
  host: '127.0.0.1', port: 8088, rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
} });
const company = 'tenant-fleet';
const base = `artifacts/comunica-salvador/public/data/companies/${company}`;
const ref = (db, path) => doc(db, `${base}/${path}`);
const tenant = (uid, companyId = company) => env.authenticatedContext(uid, { companyId }).firestore();
const manager = tenant('admin');
const driver = tenant('driver');
const coworker = tenant('other');
const plate = 'ABC1D23';
const today = fleetDate();

try {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, base), { name: 'Frota de testes' });
    await setDoc(ref(db, 'settings/integra-access'), { enabled: true });
    for (const uid of ['driver', 'admin', 'other', 'employee']) await setDoc(ref(db, `users/${uid}`), { isAdmin: uid === 'admin' });
  });

  const vehicle = { plate, model: 'Caminhão', initialKm: 1000, currentKm: 1000, status: 'available', updatedAt: serverTimestamp() };
  await assertFails(setDoc(ref(driver, `fleetVehicles/${plate}`), vehicle));
  await assertSucceeds(setDoc(ref(manager, `fleetVehicles/${plate}`), vehicle));
  for (const uid of ['driver', 'other']) await assertSucceeds(setDoc(ref(manager, `fleetDrivers/${uid}`), {
    vehicleId: plate, active: true, licenseExpiry: '2099-12-31', updatedAt: serverTimestamp(),
  }));
  await assertFails(getDoc(ref(driver, 'fleetDrivers/other')));
  await assertSucceeds(getDoc(ref(driver, `fleetVehicles/${plate}`)));
  await assertFails(getDoc(ref(tenant('driver', 'another-tenant'), `fleetVehicles/${plate}`)));
  await assertFails(getDoc(ref(tenant('employee'), `fleetVehicles/${plate}`)));
  await assertFails(updateDoc(ref(driver, `fleetVehicles/${plate}`), { status: 'inactive', updatedAt: serverTimestamp() }));

  await assertFails(updateDoc(ref(driver, `fleetVehicles/${plate}`), { currentKm: 1100, updatedAt: serverTimestamp() }));
  const meter = (db, batch, km, source) => batch.update(ref(db, `fleetVehicles/${plate}`), {
    currentKm: km, updatedAt: serverTimestamp(), meterEvent: { collection: source.parent.id, id: source.id },
  });
  const regularCheck = { tires: 'ok', lights: 'ok', brakes: 'ok', fluids: 'ok', equipment: 'ok' };
  function writeCheck(db, uid, date, km, items = regularCheck) {
    const batch = writeBatch(db);
    const entry = ref(db, `fleetChecks/${uid}_${plate}_${date}`);
    batch.set(entry, {
      vehicleId: plate, driverId: uid, date, km, items, notes: 'Inspeção', createdAt: serverTimestamp(),
    });
    meter(db, batch, km, entry);
    return batch.commit();
  }
  function start(db, uid, tripId, km) {
    const batch = writeBatch(db);
    const entry = ref(db, `fleetTrips/${tripId}`);
    batch.set(entry, {
      vehicleId: plate, driverId: uid, date: today, origin: 'Pátio', destination: 'Cliente', startKm: km,
      status: 'active', createdAt: serverTimestamp(),
    });
    batch.set(ref(db, `fleetTripLocks/${plate}`), { tripId, driverId: uid });
    meter(db, batch, km, entry);
    return batch.commit();
  }

  await assertFails(start(driver, 'driver', 'trip-a', 1010));
  await assertFails(writeCheck(driver, 'driver', '2020-01-01', 1010));
  await assertSucceeds(writeCheck(driver, 'driver', today, 1010, { ...regularCheck, brakes: 'issue' }));
  await assertFails(start(driver, 'driver', 'trip-a', 1010));
  await assertSucceeds(writeCheck(driver, 'driver', today, 1010));
  await assertFails(writeCheck(driver, 'driver', today, 1009));
  await assertSucceeds(start(driver, 'driver', 'trip-a', 1010));
  await assertSucceeds(writeCheck(coworker, 'other', today, 1010));
  await assertFails(start(coworker, 'other', 'trip-b', 1010));
  await assertFails(getDoc(ref(coworker, 'fleetTrips/trip-a')));
  await assertFails(getDocs(collection(driver, `${base}/fleetTrips`)));
  await assertSucceeds(getDocs(query(collection(driver, `${base}/fleetTrips`), where('driverId', '==', 'driver'))));

  const point = { driverId: 'driver', lat: -25.5, lng: -54.5, accuracy: 15, recordedAt: serverTimestamp() };
  await assertFails(setDoc(ref(coworker, 'fleetTrips/trip-a/points/other'), point));
  await assertSucceeds(setDoc(ref(driver, 'fleetTrips/trip-a/points/first'), point));
  await assertFails(getDoc(ref(coworker, 'fleetTrips/trip-a/points/first')));
  await assertSucceeds(getDoc(ref(manager, 'fleetTrips/trip-a/points/first')));
  const batch = writeBatch(driver);
  batch.update(ref(driver, 'fleetTrips/trip-a'), { status: 'finished', endKm: 1035, finishedAt: serverTimestamp() });
  batch.delete(ref(driver, `fleetTripLocks/${plate}`));
  meter(driver, batch, 1035, ref(driver, 'fleetTrips/trip-a'));
  await assertSucceeds(batch.commit());
  await assertFails(setDoc(ref(driver, 'fleetTrips/trip-a/points/last'), point));
  assert.equal((await getDoc(ref(manager, `fleetVehicles/${plate}`))).data().currentKm, 1035);
  await assertSucceeds(start(coworker, 'other', 'trip-b', 1035));

  const fuelBatch = writeBatch(driver);
  const fuel = ref(driver, 'fleetFuel/fuel-a');
  fuelBatch.set(fuel, { vehicleId: plate, driverId: 'driver', km: 1040, liters: 40, cost: 220,
    fuelType: 'Diesel', supplier: 'Posto', fullTank: true, createdAt: serverTimestamp() });
  meter(driver, fuelBatch, 1040, fuel);
  await assertSucceeds(fuelBatch.commit());
  await assertFails(getDoc(ref(coworker, 'fleetFuel/fuel-a')));
  const maintenance = { vehicleId: plate, title: 'Revisão', kind: 'preventive', dueKm: 1100, dueDate: '',
    status: 'planned', createdAt: serverTimestamp() };
  await assertFails(setDoc(ref(driver, 'fleetMaintenance/m1'), maintenance));
  await assertSucceeds(setDoc(ref(manager, 'fleetMaintenance/m1'), maintenance));
  await assertSucceeds(updateDoc(ref(manager, 'fleetMaintenance/m1'), { status: 'done', cost: 150, finishedAt: serverTimestamp() }));
  console.log('Regras da frota validadas.');
} finally {
  await env.cleanup();
}
