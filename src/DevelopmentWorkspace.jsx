import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import PurchaseSelect from './PurchaseSelect.jsx';

const card = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const field = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const emptyGoal = { title: '', nextStep: '', due: '', feedback: '', status: 'active' };
const formatDate = value => value ? value.split('-').reverse().join('/') : 'Sem prazo';

function Goals({ db, company, person, editable }) {
  const [goals, setGoals] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const path = ['artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'development', person, 'goals'];

  useEffect(() => onSnapshot(collection(db, 'artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'development', person, 'goals'),
    snapshot => {
      setGoals(snapshot.docs.map(record => ({ id: record.id, ...record.data() })));
      setError('');
    }, () => setError('Não foi possível consultar as metas.')), [db, company, person]);

  async function save(event) {
    event.preventDefault();
    if (saving || !draft.title.trim()) return;
    setSaving(true);
    setError('');
    const target = draft.id ? doc(db, ...path, draft.id) : doc(collection(db, ...path));
    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(target);
        const previous = snapshot.data();
        if (draft.id && previous?.revision !== draft.revision) throw new Error('outdated');
        transaction.set(target, {
          title: draft.title.trim(), due: draft.due, status: draft.status,
          nextStep: draft.nextStep.trim(), feedback: draft.feedback.trim(),
          revision: (previous?.revision || 0) + 1, updatedAt: serverTimestamp(),
          feedbackAt: draft.feedback.trim() === (previous?.feedback || '')
            ? (previous?.feedbackAt || null) : serverTimestamp(),
        });
      });
      setDraft(null);
    } catch {
      setError('Não foi possível salvar. Reabra a meta e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const list = [...(goals || [])].sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active') ||
    (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title, 'pt-BR'));
  const latest = list.filter(goal => goal.feedback).sort((a, b) => (b.feedbackAt?.toMillis() || 0) - (a.feedbackAt?.toMillis() || 0))[0];
  return <>
    {editable && !draft && <button type="button" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
      onClick={() => { setError(''); setDraft(emptyGoal); }}>Nova meta</button>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {draft && <form className={card} onSubmit={save}>
      <h3 className="font-bold">{draft.id ? 'Editar meta' : 'Nova meta'}</h3>
      <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
        <label>Meta<input required maxLength={160} className={field} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>Prazo<input type="date" className={field} value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} /></label>
        <label>Próximo passo<textarea rows={2} maxLength={1000} className={field} value={draft.nextStep} onChange={e => setDraft({ ...draft, nextStep: e.target.value })} /></label>
        <label>Feedback para o colaborador<textarea rows={2} maxLength={1500} className={field} value={draft.feedback} onChange={e => setDraft({ ...draft, feedback: e.target.value })} /></label>
        <label>Situação<select className={field} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>
          <option value="active">Em andamento</option><option value="done">Concluída</option><option value="archived">Arquivada</option>
        </select></label>
      </fieldset>
      <p className="text-xs text-slate-600">A meta e o feedback ficam visíveis para a pessoa selecionada.</p>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{saving ? 'Salvando…' : 'Salvar meta'}</button>
        <button type="button" disabled={saving} className="rounded-lg border px-4 py-2 text-sm" onClick={() => setDraft(null)}>Cancelar</button>
      </div>
    </form>}
    {!editable && latest && <section className={card}>
      <h3 className="font-bold">Último feedback</h3>
      <p className="text-xs text-slate-600">{latest.title}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{latest.feedback}</p>
    </section>}
    {goals === null && !error && <p role="status">Consultando metas…</p>}
    {goals?.length === 0 && <p className={card}>Nenhuma meta registrada.</p>}
    {list.map(goal => <article className={card} key={goal.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-blue-700">{{ active: 'Em andamento', done: 'Concluída', archived: 'Arquivada' }[goal.status]} · {formatDate(goal.due)}</p>
          <h3 className="break-words font-bold">{goal.title}</h3>
        </div>
        {editable && <button type="button" className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => { setError(''); setDraft(goal); }}>Editar meta</button>}
      </div>
      {goal.nextStep && <p className="whitespace-pre-wrap break-words text-sm"><strong>Próximo passo</strong><br />{goal.nextStep}</p>}
      {goal.feedback && (editable || latest?.id !== goal.id) && <p className="whitespace-pre-wrap break-words text-sm"><strong>Feedback</strong><br />{goal.feedback}</p>}
    </article>)}
  </>;
}

export default function DevelopmentWorkspace({ db, company, uid, employees = [], editable = false }) {
  const [employee, setEmployee] = useState('');
  const person = editable ? employee : uid;
  return <section className="space-y-4">
    <header className={card}>
      <h2 className="text-xl font-bold">{editable ? 'Desenvolvimento da equipe' : 'Meu desenvolvimento'}</h2>
      {editable && <PurchaseSelect label="Colaborador" searchPlaceholder="Buscar por nome" value={employee} onChange={setEmployee}
        placeholder="Selecione o colaborador" options={employees.map(p => [p.id, p.name])} />}
    </header>
    {person && <Goals key={person} db={db} company={company} person={person} editable={editable} />}
  </section>;
}
