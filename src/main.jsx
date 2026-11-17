/* eslint-disable react-refresh/only-export-components */
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './installPrompt.js'
import { AppErrorBoundary, AppLoadingScreen, RuntimeNotices } from './AppRuntime.jsx'
import { claimDeployRecovery } from './deployRecovery.js'

try {
  document.documentElement.classList.toggle('comunica-dark', localStorage.getItem('comunica_theme') === 'dark')
} catch {
  // O aplicativo continua com o tema claro quando o armazenamento estiver indisponível.
}

let recoveringDeploy = false

window.addEventListener('vite:preloadError', event => {
  if (recoveringDeploy) { event.preventDefault(); return }
  const refreshedUrl = claimDeployRecovery({
    url: window.location.href,
    buildId: import.meta.env.VITE_COMUNICA_BUILD_ID || 'development',
    getStorage: () => window.sessionStorage,
  })
  if (!refreshedUrl) return // Let the error boundary offer a manual retry.
  event.preventDefault()
  recoveringDeploy = true
  window.location.replace(refreshedUrl)
})

const Root = lazy(() => window.location.pathname.startsWith('/pesquisa') ? import('./PublicSurvey.jsx') : window.location.pathname.startsWith('/cotacao') ? import('./PublicPurchaseQuote.jsx') : window.location.pathname.startsWith('/privacidade') ? import('./Privacy.jsx') : window.location.pathname.startsWith('/carreiras') ? import('./Careers.jsx') : window.location.pathname.startsWith('/denuncias') ? import('./PublicWhistleblowing.jsx') : import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <a className="skip-link" href="#main-content">Ir para o conteúdo principal</a>
      <RuntimeNotices />
      <Suspense fallback={<AppLoadingScreen />}><Root /></Suspense>
    </AppErrorBoundary>
  </StrictMode>,
)

