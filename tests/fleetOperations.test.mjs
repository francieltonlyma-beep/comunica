import assert from 'node:assert/strict';
import test from 'node:test';
import { fleetDate, fleetDirectionsUrl, fleetFuelMetrics, fleetMaintenanceState } from '../src/fleetOperations.js';

test('uses the operating day in Brasília around UTC midnight', () => {
  assert.equal(fleetDate(new Date('2026-11-22T02:59:59Z')), '2026-11-21');
  assert.equal(fleetDate(new Date('2026-11-22T03:00:00Z')), '2026-11-22');
});

test('counts intermediate partial fills between complete tanks', () => {
  const entries = [
    { km: 1100, liters: 10, cost: 60 },
    { km: 1200, liters: 10, cost: 70, fullTank: true },
    { km: 1000, liters: 35, cost: 200, fullTank: true },
    { km: 1300, liters: 5, cost: 30 },
  ];
  assert.deepEqual(fleetFuelMetrics(entries), { consumption: 10, costPerKm: 0.65 });
  assert.equal(fleetFuelMetrics(entries.slice(0, 2)), null);
});

test('flags maintenance at the first due limit and preserves completed status', () => {
  const record = { status: 'planned', dueDate: '2026-11-25', dueKm: 2000 };
  assert.equal(fleetMaintenanceState(record, 2000, '2026-11-21'), 'Vencida');
  assert.equal(fleetMaintenanceState(record, 1999, '2026-11-25'), 'Vencida');
  assert.equal(fleetMaintenanceState(record, 1999, '2026-11-21'), 'Programada');
  assert.equal(fleetMaintenanceState({ ...record, status: 'done' }, 3000, '2026-12-01'), 'Concluída');
});

test('encodes origin and destination in the route URL', () => {
  const url = new URL(fleetDirectionsUrl('Foz do Iguaçu & Centro', 'Curitiba, PR'));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('origin'), 'Foz do Iguaçu & Centro');
  assert.equal(url.searchParams.get('destination'), 'Curitiba, PR');
});
