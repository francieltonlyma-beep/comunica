import { useEffect, useState } from 'react';
import { collection, getDocsFromServer, onSnapshot, query, where } from 'firebase/firestore';
import { hrActionItems } from './hrWorkflow.js';
import { displayDay } from './personnelModel.js';

const types = {all: 'Todas', interview: 'Entrevistas', stalled: 'Candidaturas paradas', goal: 'Metas vencidas', review: 'Avaliações'};
const control = 'rounded-lg border px-3 py-2 text-xs font-semibold aria-pressed:bg-blue-50 aria-pressed:text-blue-800';

export default function HrActionQueue({ db, company, confidential, employees, applications, today, now, openFile, openApplication, openGoal }) {
  const [reviews, setReviews] = useState(null);
  const [reviewError, setReviewError] = useState(false);
  const [goals, setGoals] = useState(null);
  const [queryVersion, setQueryVersion] = useState(0);
  const [filter, setFilter] = useState('all');
  const roster = JSON.stringify(employees.map(person => [person.id, person.name]));
  useEffect(() => {
    if (!confidential) return;
    return onSnapshot(collection(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'careerReviews'),
      snapshot => { setReviews(snapshot.docs.map(item => ({...item.data(), id: item.id}))); setReviewError(false); },
      () => setReviewError(true));
  }, [db, company, confidential]);

  useEffect(() => {
    if (!confidential) return;
    let cancelled = false;
    const people = JSON.parse(roster);
    async function load() {
      const rows = [];
      let failed = 0;
      for (let start = 0; start < people.length && !cancelled; start += 12) {
        const batch = await Promise.allSettled(people.slice(start, start + 12).map(async ([employeeId, employeeName]) => {
          const source = collection(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'development', employeeId, 'goals');
          const snapshot = await getDocsFromServer(query(source, where('due', '>', ''), where('due', '<', today)));
          return snapshot.docs.map(item => ({...item.data(), id: item.id, employeeId, employeeName}));
        }));
        for (const result of batch) {
          if (result.status === 'fulfilled') rows.push(...result.value);
          else failed += 1;
        }
      }
      if (!cancelled) setGoals({rows, failed, roster, today, queryVersion});
    }
    void load();
    return () => { cancelled = true; };
  }, [db, company, confidential, roster, today, queryVersion]);

  const readyGoals = goals?.roster === roster && goals.today === today && goals.queryVersion === queryVersion ? goals : null;
  const horizon = new Date(Date.parse(today + 'T12:00:00Z') + 7 * 86_400_000).toISOString().slice(0, 10);
  const rows = hrActionItems({
    applications: applications || [], reviews: reviews || [], overdueGoals: readyGoals?.rows || [],
    today, horizon, now,
  });
  const visible = rows.filter(item => filter === 'all' || item.type === filter);
  const enabled = Object.entries(types).filter(([key]) => key === 'all' ||
    (key === 'interview' || key === 'stalled' ? Boolean(applications) : confidential));
  const loading = confidential && ((!reviews && !reviewError) || !readyGoals);

  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-bold">Fila de ação do RH</h3>
      {confidential && <button type="button" onClick={() => setQueryVersion(value => value + 1)} className={control}>Atualizar metas</button>}
    </div>
    <p className="text-xs text-slate-600">Entrevistas e avaliações dos próximos sete dias, além de pendências vencidas. Candidaturas entram na fila após sete dias na mesma etapa.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de pendência">
      {enabled.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} className={control} onClick={() => setFilter(id)}>
        {label} ({id === 'all' ? rows.length : rows.filter(row => row.type === id).length})
      </button>)}
    </div>
    {loading && <p role="status" className="text-sm text-slate-600">Consultando pendências de carreira e PDI…</p>}
    {(reviewError || readyGoals?.failed > 0) && <p role="alert" className="text-sm text-amber-800">Parte das pendências está indisponível. Atualize a fila ou reabra a aba para tentar novamente.</p>}
    {!loading && !visible.length && <p className="text-sm text-slate-600">Nenhuma pendência neste filtro.</p>}
    <ul className="divide-y divide-slate-100">
      {visible.map(item => <li key={item.key} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="min-w-0">
          <strong className="block break-words text-sm text-slate-900">{item.title}</strong>
          <p className="text-xs text-slate-600">{item.detail} · {item.owner}{item.due && ' · ' + displayDay(item.due)}</p>
        </div>
        <button type="button" className={control} onClick={() => {
          if (item.application) openApplication(item.application);
          else if (item.goalId) openGoal(item.employeeId, item.goalId);
          else openFile(item.employeeId);
        }}>{item.application ? 'Abrir candidatura' : item.goalId ? 'Abrir meta' : 'Abrir ficha'}</button>
      </li>)}
    </ul>
  </section>;
}
