import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createInstallPromptStore } from '../src/installPrompt.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const handler = context => vm.runInNewContext('(' + app.split('const handleInstallApp = ')[1].split('const persistBrowserPushToken = ')[0].trim().replace(/;$/, '') + ')', context);
function context(overrides = {}) {
  const state = { help: false, status: '', completed: false, busy: false };
  const ctx = { installInFlight: { current: false }, isStandaloneApp: false, installCompleted: false, installPrompt: null,
    navigator: {}, takeInstallPrompt: () => null, setInstallStatus: value => { state.status = value; },
    setIsInstallingApp: value => { state.busy = value; }, setShowInstallHelp: value => { state.help = value; },
    setInstallCompleted: value => { state.completed = value; }, setInstallPrompt() {}, console: { error() {} }, ...overrides };
  return { ctx, state, run: handler(ctx) };
}

test('evento nativo capturado antes da montagem permanece disponível e é consumido uma vez', () => {
  const listeners = new Map();
  const target = { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
  const store = createInstallPromptStore(target);
  let prevented = false, notified = null;
  const event = { prompt() {}, preventDefault() { prevented = true; } };
  listeners.get('beforeinstallprompt')(event);
  store.subscribe(value => { notified = value; });
  assert.equal(prevented, true);
  assert.equal(notified, event);
  assert.equal(store.take(), event);
  assert.equal(store.take(), null);
  assert.equal(notified, null);
  store.dispose();
  assert.equal(listeners.size, 0);
});

test('clique abre imediatamente o prompt nativo e não abre instruções ao cancelar', async () => {
  let called = 0;
  const event = { prompt: async () => { called++; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  const { run, state } = context({ takeInstallPrompt: () => event });
  const promise = run();
  assert.equal(called, 1);
  await promise;
  assert.equal(state.help, false);
  assert.match(state.status, /cancelada/);
  assert.equal(state.busy, false);
});

test('Web Install é chamado diretamente no clique quando o navegador o suporta', async () => {
  let called = 0;
  const { run, state } = context({ navigator: { install: async () => { called++; } } });
  const promise = run();
  assert.equal(called, 1);
  await promise;
  assert.equal(state.completed, true);
  assert.equal(state.help, false);
});

test('segundo clique não reutiliza a mesma tentativa e falha não afirma instalação', async () => {
  let resolve, called = 0;
  const event = { prompt: () => { called++; return new Promise(done => { resolve = done; }); }, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  const { run, state } = context({ takeInstallPrompt: () => event });
  const first = run();
  await run();
  assert.equal(called, 1);
  resolve(); await first;
  assert.equal(state.completed, false);
  assert.match(state.status, /solicitada/);
});

test('navegador incompatível e app já instalado mostram estado sem fingir instalação', async () => {
  const unsupported = context();
  await unsupported.run();
  assert.equal(unsupported.state.help, false);
  assert.match(unsupported.state.status, /não liberou/);
  const installed = context({ isStandaloneApp: true });
  await installed.run();
  assert.match(installed.state.status, /já está instalado/);
  assert.equal(installed.state.help, false);
});

