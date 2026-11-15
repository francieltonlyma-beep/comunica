import test from 'node:test';
import assert from 'node:assert/strict';
import { claimDeployRecovery } from '../src/deployRecovery.js';

const url = 'https://comunica-info.web.app/?messageThread=123#main-content';
const memoryStorage = () => {
  const items = new Map();
  return { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value) };
};

test('retries once per build while preserving notification links', () => {
  const storage = memoryStorage();
  const claim = buildId => claimDeployRecovery({ url, buildId, getStorage: () => storage });
  const recovered = new URL(claim('release-a'));
  assert.equal(recovered.searchParams.get('messageThread'), '123');
  assert.equal(recovered.hash, '#main-content');
  assert.equal(recovered.searchParams.get('_deploy'), 'release-a');
  assert.equal(claim('release-a'), null);
  assert.ok(claim('release-b'));
});

test('unavailable browser storage still permits recovery without a reload loop', () => {
  const getStorage = () => { throw new Error('SecurityError'); };
  const recovered = claimDeployRecovery({ url, buildId: 'release-a', getStorage });
  assert.ok(recovered);
  assert.equal(claimDeployRecovery({ url: recovered, buildId: 'release-a', getStorage }), null);
  assert.ok(claimDeployRecovery({ url: recovered, buildId: 'release-b', getStorage }));
});

test('an old recovery timestamp does not disable recovery for future releases', () => {
  const storage = memoryStorage();
  storage.setItem('comunica_deploy_recovery', '2026-11-01T12:00:00Z');
  assert.ok(claimDeployRecovery({ url, buildId: 'release-a', getStorage: () => storage }));
});
