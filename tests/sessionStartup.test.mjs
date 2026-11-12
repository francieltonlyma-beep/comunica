import test from 'node:test';
import assert from 'node:assert/strict';
import { observeSessionStartup } from '../src/sessionStartup.js';

function harness(t, validate) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let next, error;
  let unsubscribed = false;
  const ready = [], errors = [];
  const stop = observeSessionStartup({
    subscribe: (onNext, onError) => { next = onNext; error = onError; return () => { unsubscribed = true; }; },
    validate, onReady: result => ready.push(result), onError: value => errors.push(value),
  });
  t.after(stop);
  return { next: user => next(user), error: value => error(value), ready, errors, stop, unsubscribed: () => unsubscribed };
}
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test('auth observer that never answers leaves loading after the deadline', t => {
  const h = harness(t, user => user);
  t.mock.timers.tick(15000);
  assert.equal(h.errors.length, 1);
  assert.equal(h.ready.length, 0);
});

test('pending profile read times out and its late result is ignored', async t => {
  let resolve;
  const h = harness(t, () => new Promise(done => { resolve = done; }));
  h.next({ uid: 'employee' });
  await flush();
  t.mock.timers.tick(15000);
  resolve({ id: 'employee', isAdmin: true });
  await flush();
  assert.equal(h.errors.length, 1);
  assert.deepEqual(h.ready, []);
});

test('signing out supersedes a pending previous session', async t => {
  let resolve;
  const h = harness(t, user => user ? new Promise(done => { resolve = done; }) : null);
  h.next({ uid: 'previous' });
  await flush();
  h.next(null);
  await flush();
  resolve({ id: 'previous' });
  await flush();
  t.mock.timers.tick(15000);
  assert.deepEqual(h.ready, [null]);
  assert.deepEqual(h.errors, []);
});

test('valid restored session finishes once without a timeout', async t => {
  const h = harness(t, user => ({ id: user.uid }));
  h.next({ uid: 'employee' });
  await flush();
  t.mock.timers.tick(15000);
  assert.deepEqual(h.ready, [{ id: 'employee' }]);
  assert.deepEqual(h.errors, []);
});

test('profile and auth errors reach the recovery screen', async t => {
  const failure = new Error('offline');
  const h = harness(t, () => { throw failure; });
  h.next({ uid: 'employee' });
  await flush();
  assert.deepEqual(h.errors, [failure]);
  h.error(failure);
  assert.equal(h.errors.length, 2);
});

test('unmount cancels observer and ignores in-flight work', async t => {
  let resolve;
  const h = harness(t, () => new Promise(done => { resolve = done; }));
  h.next({ uid: 'employee' });
  await flush();
  h.stop();
  resolve({ id: 'employee' });
  await flush();
  t.mock.timers.tick(15000);
  assert.equal(h.unsubscribed(), true);
  assert.deepEqual(h.ready, []);
  assert.deepEqual(h.errors, []);
});
