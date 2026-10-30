import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const functionsSource = await readFile(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const workerSource = await readFile(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8');

test('a ativação só confirma depois de vincular o token à conta', () => {
  const handler = appSource.slice(
    appSource.indexOf('const handleEnablePushNotifications'),
    appSource.indexOf('// 1. Pede permissão'),
  );
  assert.ok(handler.indexOf('await persistBrowserPushToken(token)') < handler.indexOf("triggerNotification('Notificações ativadas e vinculadas"));
  assert.match(appSource, /updateDoc\(userRef, \{pushTokens: arrayUnion\(token\)\}\)/);
});

test('a mensagem web leva título e conteúdo também no bloco específico do Safari', () => {
  const messagePush = functionsSource.slice(
    functionsSource.indexOf('const notifyMessageRecipients'),
    functionsSource.indexOf('type MessageActivityData'),
  );
  assert.match(messagePush, /webpush:[\s\S]*notification: \{[\s\S]*title: "Nova mensagem no Comunica"/);
  assert.match(messagePush, /icon: "\/pwa\/icon-192\.png"/);
});

test('o service worker usa a mesma versão do Firebase do aplicativo', () => {
  assert.match(workerSource, /firebasejs\/12\.14\.0\/firebase-app-compat\.js/);
  assert.match(workerSource, /firebasejs\/12\.14\.0\/firebase-messaging-compat\.js/);
});
