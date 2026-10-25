import { Component, useCallback, useEffect, useState } from 'react';

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

export function RuntimeNotices() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkVersion = useCallback(async () => {
    if (!navigator.onLine || BUILD_ID === 'development') return;
    try {
      const response = await fetch(`/version.json?check=${Date.now()}`, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
      if (!response.ok) return;
      const release = await response.json();
      if (release.buildId && release.buildId !== BUILD_ID) setUpdate(release);
    } catch {
      // A faixa de conexão já orienta o usuário quando a rede estiver indisponível.
    }
  }, []);

  useEffect(() => {
    const onOnline = () => { setOnline(true); checkVersion(); };
    const onOffline = () => setOnline(false);
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    const startupTimer = window.setTimeout(checkVersion, 0);
    const timer = window.setInterval(checkVersion, 5 * 60 * 1000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearTimeout(startupTimer);
      window.clearInterval(timer);
    };
  }, [checkVersion]);

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
