import { useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { CAREER_DETAIL_FIELDS } from './careerVacancyDetails.js';

const labels = {
  roleName: 'Cargo', title: 'Título', description: 'Descrição', location: 'Local', mode: 'Modalidade',
  skills: 'Competências', quiz: 'Questionário', closesAt: 'Prazo', status: 'Situação',
};
const statuses = { published: 'Publicada', closed: 'Encerrada', archived: 'Arquivada' };
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

function display(field, value) {
  if (field === 'quiz') return (value || []).map(item => [item.question, ...(item.options || [])].join(' · ')).join('\n');
  if (field === 'skills') return (value || []).join(', ');
  if (field === 'status') return statuses[value] || value;
  if (field === 'closesAt' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  return value;
}

export default function CareerVacancyHistory({ vacancyRef, revision }) {
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const current = result?.revision === revision ? result : null;

  async function load() {
    setResult({ revision, loading: true });
    try {
      const snapshot = await getDocs(query(collection(vacancyRef, 'history'), orderBy('changedAt', 'desc')));
      setResult({ revision, entries: snapshot.docs.map(item => ({ id: item.id, ...item.data() })) });
    } catch {
      setResult({ revision, error: true });
    }
  }

  return <div className="mt-3 text-xs">
    <button type="button" aria-expanded={open} className="font-bold text-blue-800 hover:underline" onClick={() => {
      setOpen(!open);
      if (!open && !current) void load();
    }}>Histórico de alterações</button>
    {open && <div className="mt-2 max-h-96 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3">
      {!current ? <button type="button" className="font-bold text-blue-800 underline" onClick={load}>Atualizar histórico</button>
        : current.loading ? <p role="status">Carregando histórico…</p>
          : current.error ? <button type="button" className="font-bold text-blue-800 underline" onClick={load}>Tentar carregar novamente</button>
            : current.entries.length === 0 ? <p>Nenhuma alteração registrada.</p>
              : current.entries.map(({ id, before, after, changedAt, actorName }) => {
                const changes = [
                  ...Object.entries(labels).map(([key, label]) => [label, display(key, before[key]), display(key, after[key])]),
                  ...CAREER_DETAIL_FIELDS.map(({ key, label }) => [label, before.details?.[key], after.details?.[key]]),
                ].filter(([, previous, next]) => (previous || '') !== (next || ''));
                return <details key={id} className="rounded-lg bg-slate-50 p-2">
                  <summary className="cursor-pointer font-semibold">{changedAt ? dateTime.format(changedAt.toDate()) : 'Agora'} · {actorName} · {changes.map(([label]) => label).join(', ') || 'Dados da vaga'}</summary>
                  <dl className="mt-2 space-y-2">{changes.map(([label, previous, next]) => <div key={label}>
                    <dt className="font-bold">{label}</dt>
                    <dd className="grid gap-2 whitespace-pre-wrap break-words sm:grid-cols-2"><div><strong>Antes</strong><p>{previous || '—'}</p></div><div><strong>Depois</strong><p>{next || '—'}</p></div></dd>
                  </div>)}</dl>
                </details>;
              })}
    </div>}
  </div>;
}
