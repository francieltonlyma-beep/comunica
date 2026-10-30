import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('o toque no sino conclui o token antes de liberar a restauração automática', () => {
  const handler = source.slice(
    source.indexOf('const handleEnablePushNotifications'),
    source.indexOf('// 1. Pede permissão'),
  );
  assert.ok(handler.indexOf('const token = await webPushTokenRequestRef.current') < handler.indexOf('setBrowserPushGranted(true)'));
});

test('a abertura da tela não cria uma nova inscrição sem gesto do usuário', () => {
  assert.match(source, /if \(subscriptionIsComplete\) \{/);
  assert.doesNotMatch(source, /Não foi possível ativar notificações do navegador\. Confira a permissão do site\./);
});

test('falhas explícitas exibem um código curto para diagnóstico', () => {
  assert.match(source, /Código: \$\{getPushActivationDiagnosticCode\(error\)\}/);
});
