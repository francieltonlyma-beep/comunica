// Capture before React's lazy application bundle mounts, so the native event is not lost.
export function createInstallPromptStore(target) {
  let pending = null;
  const listeners = new Set();
  const notify = () => listeners.forEach(listener => listener(pending));
  const capture = event => {
    if (typeof event?.prompt !== 'function') return;
    event.preventDefault();
    pending = event;
    notify();
  };
  const installed = () => { pending = null; notify(); };
  target?.addEventListener('beforeinstallprompt', capture);
  target?.addEventListener('appinstalled', installed);
  return {
    peek: () => pending,
    take: () => { const event = pending; pending = null; notify(); return event; },
    subscribe: listener => { listeners.add(listener); listener(pending); return () => listeners.delete(listener); },
    dispose: () => { target?.removeEventListener('beforeinstallprompt', capture); target?.removeEventListener('appinstalled', installed); listeners.clear(); },
  };
}
const store = createInstallPromptStore(typeof window === 'undefined' ? null : window);
export const getPendingInstallPrompt = () => store.peek();
export const takeInstallPrompt = () => store.take();
export const subscribeInstallPrompt = listener => store.subscribe(listener);

