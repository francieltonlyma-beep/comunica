export default function ScheduleConfigurationAudit({ audit, onApplySuggestion, compact = false }) {
  if (!audit.errors.length && !audit.warnings.length) return <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900"><strong className="block">Configuração compatível</strong>{!compact && <span>Turnos, carga, descansos e dias disponíveis passaram pela conferência automática.</span>}</div>;
  const shown = [...audit.errors, ...audit.warnings].slice(0, compact ? 3 : 8);
  return <section className={`rounded-xl border p-3 ${audit.errors.length ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`} aria-label="Conferência automática das regras">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><strong className={`block text-xs ${audit.errors.length ? 'text-rose-950' : 'text-amber-950'}`}>{audit.errors.length ? `${audit.errors.length} incompatibilidade(s) para corrigir` : `${audit.warnings.length} ponto(s) para revisar`}</strong><p className="mt-1 text-[11px] leading-5 text-slate-700">A conferência antecipa bloqueios antes de gerar ou publicar a escala.</p></div>{onApplySuggestion && audit.errors.some(issue => issue.scope === 'Base da empresa') && <button type="button" onClick={onApplySuggestion} className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white">Ajustar base automaticamente</button>}</div>
    <ul className="mt-2 space-y-1 text-[11px] leading-5 text-slate-700">{shown.map((issue, index) => <li key={`${issue.code}-${issue.scope}-${index}`}>• {issue.message}</li>)}</ul>
    {audit.issues.length > shown.length && <p className="mt-2 text-[10px] text-slate-500">Mais {audit.issues.length - shown.length} item(ns) na configuração de turnos e turmas.</p>}
  </section>;
}

