import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { displayDay } from './personnelModel.js';

const root = company => ['artifacts', 'comunica-salvador', 'public', 'data', 'companies', company, 'careerReviews'];
const panel = 'space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const button = 'rounded-lg border px-3 py-2 text-sm font-semibold';
const field = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm';
const decisions = { promotion: 'Promoção aprovada', raise: 'Reajuste aprovado', maintain: 'Manter enquadramento' };
const filters = { ready: 'Prontas para análise', overdue: 'Vencidas', upcoming: 'Próximas', closed: 'Concluídas' };

function reviewCategory(review, today) {
  if (review.nextDate && review.nextDate < today) return 'overdue';
  if (review.status === 'ready' || review.nextDate === today) return 'ready';
  return review.nextDate ? 'upcoming' : 'closed';
}

export function CareerReviewQueue({ db, company, employees, today, openFile }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ready');
  useEffect(() => onSnapshot(collection(db, ...root(company)),
    snapshot => setRows(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
    () => setError('Não foi possível consultar a fila.')), [db, company]);

  const names = new Map(employees.map(person => [person.id, person.name]));
  const grouped = Object.fromEntries(Object.keys(filters).map(key => [key, []]));
  for (const row of rows || []) grouped[reviewCategory(row, today)].push(row);
  const visible = grouped[filter].sort((a, b) => (a.nextDate || '9999').localeCompare(b.nextDate || '9999')
    || (names.get(a.id) || '').localeCompare(names.get(b.id) || '', 'pt-BR'));

  return <section className={panel}>
    <h3 className="text-lg font-bold">Fila de avaliações de carreira</h3>
    <p className="text-sm text-slate-600">Agende ou encaminhe uma avaliação pela ficha do colaborador.</p>
    <div className="flex flex-wrap gap-2">{Object.entries(filters).map(([key, label]) => (
      <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
        className={button + (filter === key ? ' border-blue-700 bg-blue-50 text-blue-900' : '')}>
        {label} · {rows ? grouped[key].length : '…'}
      </button>
    ))}</div>
    {error ? <p role="alert">{error}</p> : !rows ? <p role="status">Consultando a fila…</p> : !visible.length ? <p className="text-sm">Nenhuma avaliação nesta situação.</p> : (
      <ul className="divide-y">{visible.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div><strong>{names.get(row.id) || row.employeeName}</strong>
          <p className="text-xs text-slate-600">{row.nextDate ? 'Revisão em ' + displayDay(row.nextDate) : (decisions[row.decision] || 'Sem data marcada')}</p></div>
        <button type="button" className={button} onClick={() => openFile(row.id)}>Abrir ficha</button>
      </li>)}</ul>
    )}
  </section>;
}

export function CareerReviewDecision({ db, company, uid, person, today, ready }) {
  const [record, setRecord] = useState(undefined);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(doc(db, ...root(company), person.id),
    snapshot => setRecord(snapshot.data() || null), () => setFeedback('Não foi possível consultar a avaliação.')), [db, company, person.id]);
  useEffect(() => onSnapshot(collection(db, ...root(company), person.id, 'history'),
    snapshot => setHistory(snapshot.docs.map(item => item.data()).sort((a, b) => b.revision - a.revision)),
    () => setFeedback('Não foi possível consultar o histórico.')), [db, company, person.id]);

  function start(action) {
    setFeedback('');
    setForm({ action, nextDate: record?.nextDate || '', decision: 'maintain', note: '', revision: record?.revision || 0 });
  }

  async function save(event) {
    event.preventDefault();
    if (busy || !form) return;
    const closing = form.action === 'decide';
    const nextDate = form.action === 'ready' ? '' : form.nextDate;
    if ((!closing && form.action === 'schedule' && !nextDate) || (closing && !form.note.trim())) return;
    setBusy(true);
    setFeedback('');
    const target = doc(db, ...root(company), person.id);
    try {
      await runTransaction(db, async transaction => {
        const previous = (await transaction.get(target)).data();
        if ((previous?.revision || 0) !== form.revision) throw new Error('stale');
        const revision = form.revision + 1;
        const state = {
          employeeName: person.name, nextDate, revision,
          status: form.action === 'ready' ? 'ready' : nextDate ? 'scheduled' : 'closed',
          decision: closing ? form.decision : previous?.decision || '',
          note: closing ? form.note.trim() : previous?.note || '',
          updatedAt: serverTimestamp(), updatedBy: uid,
        };
        transaction.set(target, state);
        transaction.set(doc(target, 'history', String(revision)), { ...state, action: form.action });
      });
      setForm(null);
      setFeedback(closing ? 'Decisão registrada no histórico.' : 'Fila de avaliações atualizada.');
    } catch {
      setFeedback('Não foi possível salvar. Reabra o formulário para conferir a versão mais recente e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <section className={panel}>
    <h3 className="text-lg font-bold">Avaliação e decisão de carreira</h3>
    {record && <p className="text-sm">
      {filters[reviewCategory(record, today)]}{record.nextDate ? ' · ' + displayDay(record.nextDate) : ''}
      {record.decision && ' · Última decisão: ' + decisions[record.decision]}
    </p>}
    {record !== undefined && !form && <div className="flex flex-wrap gap-2">
      <button type="button" className={button} onClick={() => start('schedule')}>Agendar avaliação</button>
      {ready && record?.status !== 'ready' && <button type="button" className={button} onClick={() => start('ready')}>Enviar para análise</button>}
      <button type="button" className={button} onClick={() => start('decide')}>Registrar decisão</button>
    </div>}
    {form && <form onSubmit={save} className="space-y-3 rounded-xl border p-3">
      <fieldset disabled={busy} className="space-y-3">
        <legend className="font-bold">{{ schedule: 'Agendar avaliação', ready: 'Encaminhar para análise', decide: 'Registrar decisão' }[form.action]}</legend>
        {form.action === 'decide' && <>
          <label>Decisão<select className={field} value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })}>
            {Object.entries(decisions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>Justificativa<textarea required maxLength={1500} className={field} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
          <p className="text-xs text-slate-600">Registre a decisão aqui. Alterações no cadastro e no salário são feitas nos controles próprios.</p>
        </>}
        {form.action !== 'ready' && <label>{form.action === 'schedule' ? 'Data da avaliação' : 'Próxima revisão (opcional)'}
          <input type="date" className={field} required={form.action === 'schedule'} value={form.nextDate}
            onChange={e => setForm({ ...form, nextDate: e.target.value })} /></label>}
        <button type="submit" className={button}>{busy ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="ml-3 underline" onClick={() => setForm(null)}>Cancelar</button>
      </fieldset>
    </form>}
    {feedback && <p className="text-sm" role="status">{feedback}</p>}
    {history.length > 0 && <details>
      <summary className="cursor-pointer text-sm font-semibold">Histórico de avaliações</summary>
      <ul className="mt-2 space-y-2">{history.map(entry => <li key={entry.revision} className="rounded-lg border p-2 text-sm">
        <strong>{entry.action === 'decide' ? decisions[entry.decision] : entry.action === 'ready' ? 'Encaminhada para análise' : 'Agendada'}</strong>
        {entry.updatedAt && <span> · {entry.updatedAt.toDate().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>}
        {entry.action === 'decide' && <p className="whitespace-pre-wrap break-words">{entry.note}</p>}
        {entry.nextDate && <p>Próxima revisão em {displayDay(entry.nextDate)}</p>}
      </li>)}</ul>
    </details>}
  </section>;
}
