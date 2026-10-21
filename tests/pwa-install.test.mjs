import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const indexSource = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const workerSource = fs.readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8'));

test('a instalação móvel possui manifesto, ícones e modo standalone', () => {
  assert.match(indexSource, /rel="manifest" href="\/manifest\.json"/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#071a36');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
});

test('o aplicativo registra o serviço e oferece instalação orientada', () => {
  assert.match(workerSource, /addEventListener\('fetch'/);
  assert.match(appSource, /beforeinstallprompt/);
  assert.match(appSource, /Instalar o Comunica no celular/);
  assert.match(appSource, /Adicionar à Tela de Início/);
});

test('o service worker clona respostas antes de entregá-las ao navegador', () => {
  assert.match(workerSource, /const cacheCopy = response\.ok \? response\.clone\(\) : null/);
  assert.match(workerSource, /cache\.put\(event\.request, cacheCopy\)/);
  assert.doesNotMatch(workerSource, /cache\.put\(event\.request, response\.clone\(\)\)/);
});
