// Recuperação independente do React e da restauração de autenticação.
const button = document.getElementById('recover');
const status = document.getElementById('status');
const open = document.getElementById('open');
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Preparando a versão mais recente…';
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.filter(registration =>
        [registration.active, registration.waiting, registration.installing].some(worker =>
          worker && new URL(worker.scriptURL).origin === location.origin &&
          new URL(worker.scriptURL).pathname === '/firebase-messaging-sw.js')
      ).map(registration => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('comunica-shell-')).map(key => caches.delete(key)));
    }
    // Não apaga IndexedDB, rascunhos, notificações ou outras preferências.
    localStorage.removeItem('comunica_current_user');
    localStorage.removeItem('comunica_active_company');
    sessionStorage.removeItem('comunica_deploy_recovery');
    open.href = `/?atualizar=recuperacao-${Date.now()}`;
    status.textContent = 'Pronto. Abra o Comunica para entrar novamente.';
    button.hidden = true;
    open.hidden = false;
  } catch {
    status.textContent = 'Não foi possível concluir. Tente novamente neste navegador.';
    button.disabled = false;
  }
});
