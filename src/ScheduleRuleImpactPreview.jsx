import { useState } from 'react';
import { DayCoverage } from './ScheduleCoveragePanel.jsx';
import { compareScheduleRules } from './scheduleRuleImpact.js';

const label = row => !row ? "Sem marcação" : `${row.status}${row.shiftStart && row.shiftEnd ? ` · ${row.shiftStart}–${row.shiftEnd}` : ''}${row.ruleConflicts?.length ? ' · ' + row.ruleConflicts.join('; ') : ''}`;

const hasShortage = day => day.rules.some(rule => rule.segments.some(segment => segment.missing > 0));
const coverageStatus = day => {
  if (!day.rules.length) return 'Sem meta';
  if (day.rules.some(rule => rule.unknown > 0 || rule.configurationMissing)) return 'Cobertura não confirmada';
  if (day.rules.every(rule => rule.closed)) return 'Fechado';
  return hasShortage(day) ? 'Abaixo do mínimo' : 'Mínimo atendido';
};

export default function ScheduleRuleImpactPreview({ savedRules, draftRules, dates, users, holidays, history, getDepartment, coverageContext, departments = [], disabled }) {
  const [preview, setPreview] = useState(null);
  const signature = JSON.stringify({
    savedRules, draftRules, dates, users: users.map(user => [user.id, user.name, getDepartment?.(user)]), holidays, history,
    coverageContext: coverageContext && { ...coverageContext, employees: coverageContext.employees.map(user => [user.id, coverageContext.getDepartments(user)]) },
  });
  const current = preview?.signature === signature ? preview : null;
  const run = () => {
    try {
      setPreview({ signature, ...compareScheduleRules({ savedRules, draftRules, dates, users, holidays, history, getDepartment, coverageContext }) });
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
    {current?.limited && <p role="status">A otimização atingiu o limite de busca em um dos cenários.</p>}
    {current?.coverageDays?.length > 0 && <section aria-label="Cobertura do período antes e depois" className="mt-3 grid gap-2">
      <h4 className="font-bold">Cobertura do período</h4>
      {current.coverageDays.map(({ date, before, after, team }) => {
        const prior = coverageStatus(before);
        const next = coverageStatus(after);
        const status = next === 'Abaixo do mínimo'
          ? prior === next ? 'Continua abaixo do mínimo' : prior === 'Cobertura não confirmada' ? next : 'Passou a ficar abaixo do mínimo'
          : prior === 'Abaixo do mínimo' && next === 'Mínimo atendido' ? 'Voltou a atender ao mínimo' : next;
        return <details key={date} className={hasShortage(after) ? 'rounded border border-amber-500 p-2' : 'rounded border p-2'}>
          <summary>{date.split('-').reverse().join('/')} · {status}</summary>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption>Escala simulada por colaborador</caption>
              <thead><tr><th scope="col">Colaborador</th><th scope="col">Regras salvas</th><th scope="col">Regras em edição</th></tr></thead>
              <tbody>{team.map(({ before, after }) => <tr key={after.userId}>
                <th scope="row">{after.userName}</th><td>{label(before)}</td><td>{label(after)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <h5>Regras salvas · {prior}</h5>
          <DayCoverage coverage={before} departments={departments} ready />
          <h5>Regras em edição · {next}</h5>
          <DayCoverage coverage={after} departments={departments} ready />
        </details>;
      })}
    </section>}
    {current && !current.error && <div className="mt-3 text-xs text-slate-700" role="status"><strong>{current.changes.length} dia(s) de pessoa alterados · {current.people} pessoa(s) · {current.days} data(s)</strong><p className="mt-1">A cobertura considera toda a equipe do setor. As mudanças de jornada são simuladas para os colaboradores selecionados. Revise o planejamento completo antes de publicar.</p>{current.changes.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold text-cyan-900">Ver mudanças por pessoa e dia</summary><ul className="mt-2 max-h-56 space-y-1 overflow-auto">{current.changes.map(change => <li key={`${change.userId}-${change.date}`}>{change.date.split('-').reverse().join('/')} · {change.userName}: {label(change.before)} → {label(change.after)}</li>)}</ul></details>}</div>}
  </section>;
}
