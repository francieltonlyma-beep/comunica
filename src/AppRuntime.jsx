import { Component, useEffect, useState } from 'react';

const BUILD_ID = import.meta.env.VITE_COMUNICA_BUILD_ID || 'development';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Falha inesperada na interface do Comunica.', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main id="main-content" tabIndex="-1" className="runtime-fallback" role="alert"><img src="/pwa/icon-192.png" alt="" /><h1>Não foi possível abrir esta área</h1><p>Seus dados continuam seguros. Recarregue o Comunica para tentar novamente.</p><button type="button" onClick={() => window.location.reload()}>Recarregar aplicativo</button></main>;
  }
}

export function AppLoadingScreen() {
  return <main id="main-content" tabIndex="-1" className="runtime-loading" aria-busy="true" aria-live="polite"><img src="/pwa/icon-192.png" alt="" /><div><strong>Comunica</strong><span>Preparando seu ambiente…</span></div><i aria-hidden="true" /></main>;
}

export function ProductSwitcher() {
  useEffect(() => {
    let portal;
    let style;
    const hidden = new Set();
    const normalize = value => String(value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
    const attach = () => {
      const candidates = [...document.querySelectorAll('button')].filter(button => !button.closest('.comunica-header-product-switcher'));
      const management = candidates.find(button => normalize(button.textContent).startsWith('comunica gestão'));
      const integra = candidates.find(button => normalize(button.textContent).startsWith('comunica integra'));
      const profile = document.querySelector('button[title="Meu Perfil de Colaborador"]');
      if (!management || !integra || !profile?.parentElement) return;
      [management, integra].forEach(button => {
        button.classList.add('comunica-product-switcher-source');
        hidden.add(button);
      });
      if (portal?.isConnected) return;
      portal = document.createElement('div');
      portal.className = 'comunica-header-product-switcher';
      for (const [label, source] of [['Comunica Gestão', management], ['Comunica Integra', integra]]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'comunica-header-product-button';
        button.textContent = label;
        button.setAttribute('aria-label', label);
        button.title = label;
        button.addEventListener('click', () => source.click());
        portal.appendChild(button);
      }
      profile.parentElement.insertBefore(portal, profile);
      if (!style) {
        style = document.createElement('style');
        style.textContent = '.comunica-product-switcher-source{display:none!important}.comunica-header-product-switcher{display:flex;align-items:center;gap:6px;margin-inline:8px}.comunica-header-product-button{border:1px solid #d8e1ec;border-radius:999px;background:#f7f9fc;color:#17324d;padding:7px 11px;font:600 12px/1.2 inherit;white-space:nowrap;cursor:pointer}.comunica-header-product-button:hover{background:#eaf1f8}@media(max-width:720px){.comunica-header-product-switcher{gap:4px;margin-inline:4px}.comunica-header-product-button{padding:6px 8px;font-size:11px}}';
        document.head.appendChild(style);
      }
    };
    const observer = new MutationObserver(attach);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    attach();
    return () => {
      observer.disconnect();
      portal?.remove();
      hidden.forEach(button => button.classList.remove('comunica-product-switcher-source'));
      style?.remove();
    };
  }, []);
  return null;
}

export function RuntimeNotices() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let request;

    async function checkVersion() {
      if (request || !navigator.onLine || BUILD_ID === 'development') return;
      const controller = new AbortController();
      request = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`/version.json?check=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const release = await response.json();
        if (!controller.signal.aborted && typeof release.buildId === 'string' && release.buildId) {
          setUpdate(release.buildId === BUILD_ID ? null : release);
        }
      } catch {
        // A próxima verificação tenta novamente se a rede estiver indisponível.
      } finally {
        window.clearTimeout(timeout);
        request = undefined;
      }
    }

    const onOnline = () => { setOnline(true); checkVersion(); };
    const onOffline = () => setOnline(false);
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    const startupTimer = window.setTimeout(checkVersion, 0);
    const timer = window.setInterval(onVisible, 60000);
    return () => {
      request?.abort();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearTimeout(startupTimer);
      window.clearInterval(timer);
    };
  }, []);

  const applyUpdate = async () => {
    setChecking(true);
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // O recarregamento com identificador novo ainda busca o HTML mais recente.
    }
    const url = new URL(window.location.href);
    url.searchParams.set('atualizar', update?.buildId || Date.now().toString());
    window.location.replace(url.toString());
  };

  return <div className="runtime-notices" aria-live="polite">
    {!online && <section className="runtime-notice runtime-offline" role="status"><span><strong>Sem conexão.</strong> Você pode consultar o que já foi carregado; alterações serão confirmadas quando a internet voltar.</span></section>}
    {update && <section className="runtime-notice runtime-update" role="status"><span><strong>Nova versão disponível.</strong> Atualize para receber as melhorias do Comunica.</span><button type="button" disabled={checking} onClick={applyUpdate}>{checking ? 'Atualizando…' : 'Atualizar agora'}</button></section>}
  </div>;
}
