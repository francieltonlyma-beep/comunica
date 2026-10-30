const PUSH_REGISTRATION_FAILURES = [
  'messaging/token-subscribe-failed',
  'token-subscribe-failed',
  'invalid argument',
  'aborterror',
  'invalidstateerror',
];

export const isAppleMobileDevice = (navigatorLike = {}) => (
  /iPhone|iPad|iPod/i.test(navigatorLike.userAgent || '')
  || (navigatorLike.platform === 'MacIntel' && Number(navigatorLike.maxTouchPoints) > 1)
);

export const getAppleMobileVersion = (navigatorLike = {}) => {
  const match = String(navigatorLike.userAgent || '').match(/OS (\d+)[_.](\d+)/i);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
};

export const isRecoverablePushRegistrationError = (error) => {
  const details = `${error?.code || ''} ${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return PUSH_REGISTRATION_FAILURES.some(value => details.includes(value));
};

export const getPushActivationErrorMessage = (error, {
  appleMobile = false,
  permission = globalThis.Notification?.permission,
} = {}) => {
  const details = `${error?.code || ''} ${error?.name || ''} ${error?.message || ''}`.toLowerCase();

  if (permission === 'denied' || details.includes('permission-blocked') || details.includes('permission denied')) {
    return appleMobile
      ? 'As notificações estão bloqueadas. Abra Ajustes > Apps > Comunica > Notificações e ative Permitir Notificações.'
      : 'As notificações estão bloqueadas nas configurações deste navegador. Libere a permissão e tente novamente.';
  }
  if (details.includes('ios-version-unsupported')) {
    return 'Este iPhone precisa estar no iOS 16.4 ou mais recente para receber notificações pelo Comunica.';
  }
  if (details.includes('messaging/unsupported-browser') || details.includes('indexeddb') || details.includes('pushmanager')) {
    return appleMobile
      ? 'Este iPhone não disponibilizou o serviço de notificações. Atualize o iOS, feche o Comunica e abra novamente pelo ícone da Tela de Início.'
      : 'Este navegador não disponibilizou o serviço de notificações. Atualize-o e tente novamente.';
  }
  if (details.includes('safari-empty-push-subscription')) {
    return 'O iPhone autorizou as notificações, mas o iOS não criou o registro de envio. Atualize em Ajustes > Geral > Atualização de Software e tente novamente pelo ícone do Comunica.';
  }
  if (details.includes('vapid') || details.includes('missing-push-configuration')) {
    return 'A configuração de notificações do Comunica está incompleta. Avise o suporte para corrigir a chave de envio.';
  }
  if (isRecoverablePushRegistrationError(error)) {
    return appleMobile
      ? 'O iPhone não concluiu o registro das notificações. Feche o Comunica, abra novamente pelo ícone da Tela de Início e toque no sino outra vez.'
      : 'O navegador não concluiu o registro das notificações. Feche e abra o Comunica e tente novamente.';
  }
  return appleMobile
    ? 'O iPhone não concluiu a ativação. Confirme que o Comunica foi aberto pelo ícone da Tela de Início e tente novamente.'
    : 'Não foi possível concluir a ativação das notificações neste navegador. Tente novamente.';
};

const base64UrlToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const decoded = globalThis.atob(normalized);
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
};

const hasCompletePushSubscription = (subscription) => Boolean(
  subscription?.endpoint
  && subscription?.getKey?.('auth')
  && subscription?.getKey?.('p256dh')
);

export const ensureWebPushSubscription = async ({ registration, vapidKey }) => {
  const current = await registration?.pushManager?.getSubscription?.();
  if (hasCompletePushSubscription(current)) return current;
  await current?.unsubscribe?.().catch(() => false);

  const subscription = await registration?.pushManager?.subscribe?.({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(vapidKey),
  });
  if (!hasCompletePushSubscription(subscription)) {
    await subscription?.unsubscribe?.().catch(() => false);
    throw Object.assign(new Error('safari-empty-push-subscription'), {
      code: 'safari-empty-push-subscription',
    });
  }
  return subscription;
};

export const getWebPushTokenWithRecovery = async ({ messaging, registration, vapidKey, getToken, deleteToken }) => {
  if (!vapidKey) throw Object.assign(new Error('missing-push-configuration'), { code: 'missing-push-configuration' });

  const options = { vapidKey, serviceWorkerRegistration: registration };
  try {
    await ensureWebPushSubscription({ registration, vapidKey });
    return await getToken(messaging, options);
  } catch (error) {
    if (error?.code === 'safari-empty-push-subscription') throw error;
    if (!isRecoverablePushRegistrationError(error)) throw error;

    await deleteToken?.(messaging).catch(() => false);
    const existingSubscription = await registration?.pushManager?.getSubscription?.().catch(() => null);
    await existingSubscription?.unsubscribe?.().catch(() => false);
    await registration?.update?.().catch(() => undefined);
    await ensureWebPushSubscription({ registration, vapidKey });
    return getToken(messaging, options);
  }
};
