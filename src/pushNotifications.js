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

export const getWebPushTokenWithRecovery = async ({ messaging, registration, vapidKey, getToken }) => {
  if (!vapidKey) throw Object.assign(new Error('missing-push-configuration'), { code: 'missing-push-configuration' });

  const options = { vapidKey, serviceWorkerRegistration: registration };
  try {
    return await getToken(messaging, options);
  } catch (error) {
    if (!isRecoverablePushRegistrationError(error)) throw error;

    const existingSubscription = await registration?.pushManager?.getSubscription?.().catch(() => null);
    await existingSubscription?.unsubscribe?.().catch(() => false);
    await registration?.update?.().catch(() => undefined);
    return getToken(messaging, options);
  }
};
