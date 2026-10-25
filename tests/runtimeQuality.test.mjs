import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../src/AppRuntime.jsx', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const worker = fs.readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');
const vite = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
const health = fs.readFileSync(new URL('../functions/src/platformCompanyHealth.ts', import.meta.url), 'utf8');

test('published versions are detected without trusting a stale service worker cache', () => {
  assert.match(vite, /version\.json/);
  assert.match(runtime, /cache: 'no-store'/);
  assert.match(runtime, /Nova versão disponível/);
  assert.match(worker, /url\.pathname === '\/version\.json'/);
  assert.match(worker, /SKIP_WAITING/);
});

test('global runtime states explain loading, offline mode and unexpected failures', () => {
  assert.match(main, /AppErrorBoundary/);
  assert.match(main, /AppLoadingScreen/);
  assert.match(main, /RuntimeNotices/);
  assert.match(runtime, /Sem conexão/);
  assert.match(runtime, /Não foi possível abrir esta área/);
});

test('mobile and accessible navigation receive explicit interaction support', () => {
  assert.match(main, /Ir para o conteúdo principal/);
  assert.match(app, /id="main-content" tabIndex="-1"/);
  assert.match(app, /aria-controls="comunica-main-menu"/);
  assert.match(styles, /font-size: 16px !important/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /focus-visible/);
});

test('heavy and occasional features are loaded on demand', () => {
  for (const feature of ['LazyEmojiPicker', 'ScheduleCalendar', 'WhistleblowingAdmin', 'PlatformUpdates']) {
    assert.match(app, new RegExp(`lazy\\(\\(\\) => import\\('\\./${feature}`));
  }
});

test('support health reports actionable operational gaps', () => {
  for (const field of ['incompleteProfiles', 'inactive30Days', 'missingNotificationUsers', 'attentionCount', 'alerts']) {
    assert.match(health, new RegExp(field));
  }
  assert.match(app, /Diagnóstico operacional/);
  assert.match(app, /Pontos de atenção/);
});
