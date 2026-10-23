import { DayCoverage } from './ScheduleCoveragePanel.jsx';

export default function ScheduleOptimizationSummary({ before, analysis, swaps = 0, limited, requirements = [], fixedDays, selectedDate, departments, onOptimize, disabled }) {
  const day = analysis.days.find(item => item.date === selectedDate) || { rules: [] };
  return <section className="border-b border-cyan-100 bg-cyan-50/70 p-4" aria-label="Resultado da geração inteligente">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-extrabold text-cyan-950">Folgas e cobertura da equipe</h4><p className="mt-1 text-[11px] text-cyan-800">Trocas entre trabalho e folga da mesma pessoa, dentro da semana. Dias e horas semanais são mantidos.</p></div><button type="button" disabled={disabled || !requirements.length} onClick={onOptimize} className="rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Reorganizar folgas</button></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-4">
      <div className="rounded-xl border border-cyan-100 bg-white p-3"><span className="block text-[10px] text-slate-500">Antes da otimização</span><strong className="text-lg text-slate-900">{before?.coveredPercent == null ? '—' : before.coveredPercent + '%'}</strong></div>
      <div className="rounded-xl border border-cyan-100 bg-white p-3"><span className="block text-[10px] text-slate-500">Cobertura na prévia atual</span><strong className="text-lg text-cyan-900">{analysis.coveredPercent == null ? '—' : analysis.coveredPercent + '%'}</strong></div>
      <div className="rounded-xl border border-cyan-100 bg-white p-3"><span className="block text-[10px] text-slate-500">Trocas de folga</span><strong className="text-lg text-slate-900">{swaps}</strong></div>
      <div className="rounded-xl border border-cyan-100 bg-white p-3"><span className="block text-[10px] text-slate-500">Dias fixos ou preservados</span><strong className="text-lg text-slate-900">{fixedDays}</strong></div>
    </div>
    {!requirements.length ? <p className="mt-3 text-[11px] text-cyan-900">Cadastre a necessidade no calendário para orientar as trocas de folga. A distribuição padrão continua disponível.</p> : <><p className="mt-3 text-[11px] text-slate-600">Cobertura = proporção das horas de pessoas exigidas nas faixas cadastradas. A prévia considera toda a equipe do setor, ausências e intervalos.</p>
      {analysis.gaps > 0 && <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">Ainda há {analysis.gaps} faixa(s) descoberta(s). Reveja equipe, turnos, necessidade e dias fixos. {limited ? 'O limite desta busca foi atingido; a prévia pode ter outras combinações possíveis.' : 'As trocas testadas respeitam os dias preservados e o limite configurado de dias seguidos.'}</p>}
      {analysis.unknown > 0 && <p className="mt-2 text-[11px] text-amber-900">Há jornadas com dados incompletos. Confira os horários antes de usar a porcentagem como referência.</p>}
      <details className="mt-3 rounded-xl border border-cyan-100 bg-white p-3"><summary className="cursor-pointer text-xs font-bold text-cyan-900">Cobertura do dia {selectedDate.split('-').reverse().join('/')}</summary><div className="mt-3"><DayCoverage coverage={day} departments={departments} ready error="" /></div></details>
    </>}
  </section>;
}
