import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

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
    <Suspense fallback={<div className="min-h-screen bg-slate-100 p-8 text-center text-sm text-slate-600">Carregando...</div>}><Root /></Suspense>
  </StrictMode>,
)
