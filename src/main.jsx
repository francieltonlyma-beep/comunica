import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const DEPLOY_RECOVERY_KEY = 'comunica_deploy_recovery'\n\nwindow.addEventListener('vite:preloadError', event => {\n  event.preventDefault()\n  if (sessionStorage.getItem(DEPLOY_RECOVERY_KEY)) return\n  sessionStorage.setItem(DEPLOY_RECOVERY_KEY, new Date().toISOString())\n  const refreshedUrl = new URL(window.location.href)\n  refreshedUrl.searchParams.set('_deploy', Date.now().toString())\n  window.location.replace(refreshedUrl.toString())\n})\n\nconst Root = lazy(() => window.location.pathname.startsWith('/privacidade') ? import('./Privacy.jsx') : window.location.pathname.startsWith('/carreiras') ? import('./Careers.jsx') : window.location.pathname.startsWith('/denuncias') ? import('./PublicWhistleblowing.jsx') : import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div className="min-h-screen bg-slate-100 p-8 text-center text-sm text-slate-600">Carregando...</div>}><Root /></Suspense>
  </StrictMode>,
)
