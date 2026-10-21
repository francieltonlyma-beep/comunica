import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, X } from 'lucide-react';
import { PLATFORM_TUTORIALS } from './tutorialContent';

const EMPTY_RECT = { top: 0, left: 0, width: 0, height: 0 };

function visibleRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const margin = 8;
  const top = Math.max(margin, rect.top - margin);
  const left = Math.max(margin, rect.left - margin);
  const right = Math.min(window.innerWidth - margin, rect.right + margin);
  const bottom = Math.min(window.innerHeight - margin, rect.bottom + margin);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

export default function FeatureTutorial({ tutorialId, onClose, onNavigate, userId, canManage = false, availableTabs = [] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tutorial = PLATFORM_TUTORIALS[tutorialId];
  const steps = useMemo(() => (tutorial?.steps || []).filter(item => (!item.adminOnly || canManage) && (!item.tab || availableTabs.includes(item.tab))), [availableTabs, canManage, tutorial]);
  const step = steps[stepIndex];
  const totalSteps = steps.length;
  const completionKey = useMemo(() => `comunica_guided_tour_${userId || 'device'}_${tutorialId || 'unknown'}`, [tutorialId, userId]);

  useEffect(() => {
    setStepIndex(0);
  }, [tutorialId]);

  useEffect(() => {
    if (!tutorialId || !step) return undefined;
    let timer;
    onNavigate?.(step);
    const selector = step.target || `[data-tour="${tutorialId}"]`;
    const findTarget = () => document.querySelector(selector) || document.querySelector(`[data-tour="${tutorialId}"]`);
    const updateTarget = () => setTargetRect(visibleRect(findTarget()));
    timer = window.setTimeout(() => {
      const element = findTarget();
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        timer = window.setTimeout(updateTarget, 360);
      } else setTargetRect(null);
    }, 120);
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [onNavigate, step, tutorialId]);

  useEffect(() => {
    if (!tutorialId) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && stepIndex < totalSteps - 1) setStepIndex(index => index + 1);
      if (event.key === 'ArrowLeft' && stepIndex > 0) setStepIndex(index => index - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, stepIndex, totalSteps, tutorialId]);

  if (!tutorialId || !tutorial || !step) return null;

  const finish = () => {
    try { window.localStorage.setItem(completionKey, new Date().toISOString()); } catch { /* dispositivo sem armazenamento local */ }
    onClose();
  };
  const isLast = stepIndex === totalSteps - 1;
  const rect = targetRect || EMPTY_RECT;
  const cardWidth = Math.min(380, window.innerWidth - 24);
  const cardLeft = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, targetRect ? rect.left : (window.innerWidth - cardWidth) / 2));
  const roomBelow = targetRect ? window.innerHeight - (rect.top + rect.height) : 0;
  const cardTop = targetRect
    ? roomBelow >= 300
      ? Math.min(window.innerHeight - 12, rect.top + rect.height + 14)
      : Math.max(12, rect.top - 286)
    : Math.max(12, (window.innerHeight - 280) / 2);

  return createPortal(
    <div className="fixed inset-0 z-[10020]" role="dialog" aria-modal="true" aria-labelledby="guided-tour-title">
      {targetRect ? <div aria-hidden="true" className="pointer-events-none fixed rounded-2xl border-2 border-cyan-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.72),0_0_0_6px_rgba(103,232,249,0.2)] transition-all duration-300" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} /> : <div aria-hidden="true" className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />}
      <section className="fixed overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl" style={{ top: cardTop, left: cardLeft, width: cardWidth, maxHeight: 'calc(100vh - 24px)' }}>
        <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 px-4 py-3.5 text-white">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><BookOpen className="h-4.5 w-4.5" /></span><div><span className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Tour guiado · {stepIndex + 1} de {totalSteps}</span><h2 id="guided-tour-title" className="mt-0.5 truncate text-sm font-extrabold">{tutorial.title}</h2></div></div><button type="button" onClick={onClose} aria-label="Sair do tour" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button></div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300 transition-all duration-300" style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} /></div>
        </header>
        <div className="max-h-[52vh] overflow-y-auto px-4 py-4"><h3 className="text-base font-extrabold text-slate-900">{step.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p>{step.action && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-semibold leading-5 text-blue-900"><strong className="block">Experimente agora</strong>{step.action}</div>}{stepIndex === 0 && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500"><strong className="text-slate-700">Quem pode usar:</strong> {tutorial.audience}</p>}</div>
        <footer className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3"><button type="button" onClick={onClose} className="mr-auto text-[10px] font-bold text-slate-500 hover:text-slate-800">Pular tour</button><button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex(index => Math.max(0, index - 1))} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 disabled:opacity-35"><ArrowLeft className="h-3.5 w-3.5" /> Anterior</button><button type="button" onClick={() => isLast ? finish() : setStepIndex(index => index + 1)} className="inline-flex items-center gap-1 rounded-xl bg-blue-700 px-3.5 py-2 text-[10px] font-extrabold text-white shadow-sm hover:bg-blue-800">{isLast ? <><CheckCircle2 className="h-3.5 w-3.5" /> Concluir</> : <>Próximo <ArrowRight className="h-3.5 w-3.5" /></>}</button></footer>
      </section>
    </div>,
    document.body,
  );
}
