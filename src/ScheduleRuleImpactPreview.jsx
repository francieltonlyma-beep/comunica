import { useState } from 'react';
import { compareScheduleRules } from './scheduleRuleImpact.js';

const label = row => `${row.status}${row.shiftStart && row.shiftEnd ? ` · ${row.shiftStart}–${row.shiftEnd}` : ''}${row.ruleConflicts?.length ? ' · conflito de regras' : ''}`;

export default function ScheduleRuleImpactPreview({ savedRules, draftRules, dates, users, holidays, history, getDepartment, disabled }) {
  const [preview, setPreview] = useState(null);
  const signature = JSON.stringify({ savedRules, draftRules, dates, users: users.map(user => [user.id, user.name]), holidays, history: history.map(row => [row.id, row.userId, row.startDate, row.endDate, row.status, row.shiftStart, row.shiftEnd]) });
  const current = preview?.signature === signature ? preview : null;
  const run = () => {
    try {
      setPreview({ signature, ...compareScheduleRules({ savedRules, draftRules, dates, users, holidays, history, getDepartment }) });
    } catch {
      setPreview({ signature, error: 'Corrija as regras incompatíveis antes de comparar as escalas.' });
    }
  };
  return <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-3" aria-label="Prévia do impacto das regras">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-xs text-cyan-950">Antes de salvar: quem mudaria?</strong><p className="mt-1 text-[11px] text-cyan-900">Compare a versão salva com as regras em edição no período escolhido. A comparação não publica nem altera escalas existentes.</p></div><button type="button" disabled={disabled || !savedRules || !dates.length || !users.length} onClick={run} className="rounded-lg bg-cyan-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Comparar regras</button></div>
    {!dates.length && <p className="mt-2 text-xs text-amber-900">Escolha um período válido de até 31 dias para comparar.</p>}
    {!users.length && <p className="mt-2 text-xs text-amber-900">Selecione colaboradores para comparar.</p>}
    {preview && !current && <p className="mt-2 text-xs text-amber-900">As regras ou o período mudaram. Compare novamente antes de salvar.</p>}
    {current?.error && <p className="mt-2 text-xs text-rose-800" role="alert">{current.error}</p>}
    {current && !current.error && <div className="mt-3 text-xs text-slate-700" role="status"><strong>{current.changes.length} dia(s) de pessoa alterados · {current.people} pessoa(s) · {current.days} data(s)</strong><p className="mt-1">A prévia compara jornada e situação antes de ausências, ajustes manuais e otimização da cobertura. Revise a simulação completa antes de publicar.</p>{current.changes.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold text-cyan-900">Ver mudanças por pessoa e dia</summary><ul className="mt-2 max-h-56 space-y-1 overflow-auto">{current.changes.map(change => <li key={`${change.userId}-${change.date}`}>{change.date.split('-').reverse().join('/')} · {change.userName}: {label(change.before)} → {label(change.after)}</li>)}</ul></details>}</div>}
  </section>;
}
