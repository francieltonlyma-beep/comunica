import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAppleMobileVersion,
  getPushActivationErrorMessage,
  getWebPushTokenWithRecovery,
  isAppleMobileDevice,
} from '../src/pushNotifications.js';

test('identifica iPhone e a versão do iOS', () => {
  const device = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X)' };
  assert.equal(isAppleMobileDevice(device), true);
  assert.deepEqual(getAppleMobileVersion(device), { major: 17, minor: 6 });
});

test('orienta a liberação da permissão bloqueada no iPhone', () => {
  const message = getPushActivationErrorMessage(new Error('permission denied'), {
    appleMobile: true,
    permission: 'denied',
  });
  assert.match(message, /Ajustes > Apps > Comunica > Notificações/);
});

test('orienta atualização quando o iOS não suporta Web Push', () => {
  const message = getPushActivationErrorMessage(
    Object.assign(new Error('ios-version-unsupported'), { code: 'ios-version-unsupported' }),
    { appleMobile: true },
  );
  assert.match(message, /iOS 16\.4/);
});

test('refaz uma inscrição do Safari que falhou antes de desistir', async () => {
  let attempts = 0;
  let unsubscribed = false;
  let updated = false;
  const getToken = async () => {
    attempts += 1;
    if (attempts === 1) {
      throw Object.assign(new Error('Request contains an invalid argument'), {
        code: 'messaging/token-subscribe-failed',
      });
    }
    return 'token-recuperado';
  };
  const registration = {
    pushManager: {
      getSubscription: async () => ({ unsubscribe: async () => { unsubscribed = true; } }),
    },
    update: async () => { updated = true; },
  };

  const token = await getWebPushTokenWithRecovery({
    messaging: {}, registration, vapidKey: 'chave', getToken,
  });

  assert.equal(token, 'token-recuperado');
  assert.equal(attempts, 2);
  assert.equal(unsubscribed, true);
  assert.equal(updated, true);
});

test('não repete falhas que não são de registro', async () => {
  let attempts = 0;
  await assert.rejects(
    getWebPushTokenWithRecovery({
      messaging: {},
      registration: {},
      vapidKey: 'chave',
      getToken: async () => {
        attempts += 1;
        throw Object.assign(new Error('bad vapid key'), { code: 'messaging/invalid-vapid-key' });
      },
    }),
    /bad vapid key/,
  );
  assert.equal(attempts, 1);
});
