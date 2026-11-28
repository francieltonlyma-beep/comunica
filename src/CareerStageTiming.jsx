import { CAREER_STAGES, CAREER_STALLED_DAYS, careerIsStalled, careerStageAge } from './careerTriage.js';

export default function CareerStageTiming({ rows, stage, now, selectStage, selectStalled }) {
  const groups = CAREER_STAGES.map(({id, label}) => {
    const applications = rows[id];
    const ages = applications.map(application => careerStageAge(application, now)).filter(age => age !== null);
    return {id, label, count: applications.length, stalled: applications.filter(application => careerIsStalled(application, now)).length,
      average: ages.length ? Math.round(ages.reduce((total, value) => total + value, 0) / ages.length) : null};
  }).filter(group => group.count);
  if (!groups.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h4 className="text-sm font-extrabold text-slate-900">Tempo na etapa por vaga</h4>
    <p className="mt-1 text-xs text-slate-600">A média considera as candidaturas com data de entrada na etapa. Pendentes há {CAREER_STALLED_DAYS} dias ou mais aparecem em atraso.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {groups.map(group => <div key={group.id} className="rounded-lg border border-slate-200 p-2.5 text-xs">
        <button type="button" aria-pressed={stage === group.id} onClick={() => selectStage(group.id)}
          className="w-full rounded-md text-left font-bold text-blue-800 hover:underline">
          {group.label} ({group.count}) <span className="block font-normal text-slate-600">{group.average === null ? 'Sem data registrada' : `Média de ${group.average} dia(s)`}</span>
        </button>
        {group.stalled > 0 && <button type="button" onClick={() => selectStalled(group.id)} className="mt-2 font-semibold text-amber-800 hover:underline">
          {group.stalled} em atraso
        </button>}
      </div>)}
    </div>
  </section>;
}
