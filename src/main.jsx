/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppErrorBoundary, AppLoadingScreen, RuntimeNotices } from './AppRuntime.jsx'

try {
  document.documentElement.classList.toggle('comunica-dark', localStorage.getItem('comunica_theme') === 'dark')
} catch {
  // O aplicativo continua com o tema claro quando o armazenamento estiver indisponível.
}

const DEPLOY_RECOVERY_KEY = 'comunica_deploy_recovery'

window.addEventListener('vite:preloadError', event => {
  event.preventDefault()
  if (sessionStorage.getItem(DEPLOY_RECOVERY_KEY)) return
  sessionStorage.setItem(DEPLOY_RECOVERY_KEY, new Date().toISOString())
  const refreshedUrl = new URL(window.location.href)
  refreshedUrl.searchParams.set('_deploy', Date.now().toString())
  window.location.replace(refreshedUrl.toString())
})

const Root = lazy(() => window.location.pathname.startsWith('/privacidade') ? import('./Privacy.jsx') : window.location.pathname.startsWith('/carreiras') ? import('./Careers.jsx') : window.location.pathname.startsWith('/denuncias') ? import('./PublicWhistleblowing.jsx') : import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <a className="skip-link" href="#main-content">Ir para o conteúdo principal</a>
      <RuntimeNotices />
      <Suspense fallback={<AppLoadingScreen />}><Root /></Suspense>
    </AppErrorBoundary>
  </StrictMode>,
)
