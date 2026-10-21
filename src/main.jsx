import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const Root = lazy(() => window.location.pathname.startsWith('/privacidade') ? import('./Privacy.jsx') : window.location.pathname.startsWith('/carreiras') ? import('./Careers.jsx') : window.location.pathname.startsWith('/denuncias') ? import('./PublicWhistleblowing.jsx') : import('./App.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div className="min-h-screen bg-slate-100 p-8 text-center text-sm text-slate-600">Carregando...</div>}><Root /></Suspense>
  </StrictMode>,
)
