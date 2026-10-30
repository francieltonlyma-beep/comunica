import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAppleMobileVersion,
  getPushActivationErrorMessage,
  getPushActivationDiagnosticCode,
  getWebPushTokenWithRecovery,
  ensureWebPushSubscription,
  repairWebPushServiceWorker,
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
      getSubscription: async () => ({
        endpoint: 'https://push.example/device',
        getKey: () => new Uint8Array([1]),
        unsubscribe: async () => { unsubscribed = true; },
      }),
      subscribe: async () => ({
        endpoint: 'https://push.example/device-new',
        getKey: () => new Uint8Array([2]),
      }),
    },
    update: async () => { updated = true; },
  };

  const token = await getWebPushTokenWithRecovery({
    messaging: {}, registration, vapidKey: 'AQ', getToken,
  });

  assert.equal(token, 'token-recuperado');
  assert.equal(attempts, 2);
  assert.equal(unsubscribed, true);
  assert.equal(updated, true);
});

test('identifica o registro vazio devolvido pelo Safari', async () => {
  const previousAtob = globalThis.atob;
  globalThis.atob = value => Buffer.from(value, 'base64').toString('binary');
  try {
    await assert.rejects(
      ensureWebPushSubscription({
        registration: {
          pushManager: {
            getSubscription: async () => null,
            subscribe: async () => ({ endpoint: '', getKey: () => null, unsubscribe: async () => true }),
          },
        },
        vapidKey: 'AQ',
      }),
      error => error?.code === 'safari-empty-push-subscription',
    );
  } finally {
    globalThis.atob = previousAtob;
  }
});

test('explica a correção quando o iOS devolve um registro vazio', () => {
  const message = getPushActivationErrorMessage(
    Object.assign(new Error('safari-empty-push-subscription'), { code: 'safari-empty-push-subscription' }),
    { appleMobile: true },
  );
  assert.match(message, /Ajustes > Geral > Atualização de Software/);
});

test('gera um código curto e seguro para o suporte', () => {
  assert.equal(
    getPushActivationDiagnosticCode({ code: 'messaging/token-subscribe-failed' }),
    'token-subscribe-failed',
  );
});

test('preserva o nome do DOMException quando o código é numérico', () => {
  assert.equal(
    getPushActivationDiagnosticCode({ code: 11, name: 'InvalidStateError' }),
    'invalidstateerror',
  );
});

test('substitui uma inscrição criada com outra chave VAPID', async () => {
  const previousAtob = globalThis.atob;
  globalThis.atob = value => Buffer.from(value, 'base64').toString('binary');
  let current;
  let unsubscribed = false;
  let subscribed = false;
  const oldKey = Uint8Array.from([9]).buffer;
  current = {
    endpoint: 'https://push.example/old',
    options: { applicationServerKey: oldKey },
    getKey: () => new Uint8Array([1]),
    unsubscribe: async () => { unsubscribed = true; current = null; return true; },
  };
  try {
    const replacement = await ensureWebPushSubscription({
      registration: {
        pushManager: {
          getSubscription: async () => current,
          subscribe: async () => {
            subscribed = true;
            current = {
              endpoint: 'https://push.example/new',
              getKey: () => new Uint8Array([2]),
            };
            return current;
          },
        },
      },
      vapidKey: 'AQ',
    });
    assert.equal(replacement.endpoint, 'https://push.example/new');
    assert.equal(unsubscribed, true);
    assert.equal(subscribed, true);
  } finally {
    globalThis.atob = previousAtob;
  }
});

test('recria o serviço de notificações sem apagar dados do aplicativo', async () => {
  let unsubscribed = false;
  let unregistered = false;
  let registeredPath = '';
  const activeWorker = { state: 'activated' };
  const repaired = await repairWebPushServiceWorker({
    registration: {
      pushManager: {
        getSubscription: async () => ({ unsubscribe: async () => { unsubscribed = true; } }),
      },
      unregister: async () => { unregistered = true; return true; },
    },
    serviceWorkerContainer: {
      register: async (path, options) => {
        registeredPath = `${path}:${options.scope}`;
        return { active: activeWorker, update: async () => undefined };
      },
    },
  });
  assert.equal(unsubscribed, true);
  assert.equal(unregistered, true);
  assert.equal(registeredPath, '/firebase-messaging-sw.js:/');
  assert.equal(repaired.active, activeWorker);
});

test('não repete falhas que não são de registro', async () => {
  let attempts = 0;
  await assert.rejects(
    getWebPushTokenWithRecovery({
      messaging: {},
      registration: {
        pushManager: {
          getSubscription: async () => ({
            endpoint: 'https://push.example/device',
            getKey: () => new Uint8Array([1]),
          }),
        },
      },
      vapidKey: 'AQ',
      getToken: async () => {
        attempts += 1;
        throw Object.assign(new Error('bad vapid key'), { code: 'messaging/invalid-vapid-key' });
      },
    }),
    /bad vapid key/,
  );
  assert.equal(attempts, 1);
});
