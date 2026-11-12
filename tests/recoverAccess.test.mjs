import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const script = readFileSync(new URL('../public/recover-access.js', import.meta.url), 'utf8');
function recovery({ fail = false } = {}) {
  const removed = [], deleted = [], unregistered = [];
  const nodes = Object.fromEntries(['recover', 'status', 'open'].map(id => [id, { hidden: id === 'open' }]));
  let click;
  nodes.recover.addEventListener = (_event, callback) => { click = callback; };
  const caches = { keys: async () => ['comunica-shell-v3', 'comunica-shell-v4', 'other-app'], delete: async key => { deleted.push(key); } };
  const context = {
    document: { getElementById: id => nodes[id] }, location: { origin: 'https://comunica-info.web.app' }, URL,
    navigator: { serviceWorker: { getRegistrations: async () => {
      if (fail) throw new Error('storage unavailable');
      return ['/firebase-messaging-sw.js', '/other-worker.js'].map(path => ({
        active: { scriptURL: `https://comunica-info.web.app${path}` }, unregister: async () => { unregistered.push(path); },
      }));
    } } },
    caches, window: { caches },
    localStorage: { removeItem: key => removed.push(key) },
    sessionStorage: { removeItem: key => removed.push(key) },
  };
  runInNewContext(script, context);
  return { click, nodes, removed, deleted, unregistered };
}
test('recovery removes only Comunica shell and identity, preserving drafts and other apps', async () => {
  const h = recovery(); await h.click();
  assert.deepEqual(h.deleted, ['comunica-shell-v3', 'comunica-shell-v4']);
  assert.deepEqual(h.unregistered, ['/firebase-messaging-sw.js']);
  assert.deepEqual(h.removed, ['comunica_current_user', 'comunica_active_company', 'comunica_deploy_recovery']);
  assert.equal(h.nodes.open.hidden, false);
  assert.match(h.nodes.open.href, /^\/\?atualizar=recuperacao-\d+$/);
  assert.equal(h.nodes.recover.hidden, true);
});
test('failed recovery allows retry and does not present false success', async () => {
  const h = recovery({ fail: true }); await h.click();
  assert.equal(h.nodes.recover.disabled, false);
  assert.equal(h.nodes.open.hidden, true);
  assert.match(h.nodes.status.textContent, /Não foi possível concluir/);
  assert.deepEqual(h.removed, []);
});
