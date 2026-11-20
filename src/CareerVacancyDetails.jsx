import { useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus.js';
import { appendCareerDetail, CAREER_DETAIL_FIELDS, CAREER_DETAIL_LIMIT, CAREER_LIBRARY_ITEM_LIMIT } from './careerVacancyDetails.js';

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs';
const buttonClass = 'rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50';

export function CareerVacancyLibrary({ library, onSave, onDelete, onClose }) {
  const [category, setCategory] = useState(CAREER_DETAIL_FIELDS[0].key);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState('');
  const [removingId, setRemovingId] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useDialogFocus(true, () => { if (!busy) onClose(); });
  const items = library.items.filter(item => item.category === category);

  function resetEditor() {
    setDraft('');
    setEditingId('');
    setRemovingId('');
  }

  async function save(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || library.status !== 'ready') return;
    setBusy(true);
    try {
      if (await onSave(editingId, { category, text })) resetEditor();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (busy) return;
    setBusy(true);
    try {
      if (await onDelete(id)) resetEditor();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="career-library-title" tabIndex={-1}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
          <h3 id="career-library-title" className="text-sm font-extrabold">Pré-cadastros de vagas</h3>
          <button type="button" disabled={busy} onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>
        <div className="space-y-4 p-5">
          <p className="text-xs text-slate-600">Cadastre textos que a equipe de recrutamento pode inserir ao publicar uma vaga.</p>
          <label className="block text-xs font-bold text-slate-700">
            Categoria
            <select className={inputClass} value={category} disabled={busy} onChange={event => { setCategory(event.target.value); resetEditor(); }}>
              {CAREER_DETAIL_FIELDS.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
            </select>
          </label>
          {library.status === 'loading' && <p role="status" className="text-xs text-slate-500">Carregando pré-cadastros…</p>}
          {library.status === 'error' && <p role="alert" className="text-xs text-rose-700">Não foi possível carregar os pré-cadastros. Atualize a página e tente novamente.</p>}
          {library.status === 'ready' && <>
            <form onSubmit={save} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {editingId ? 'Editar item' : 'Novo item'}
                <input className={inputClass} required maxLength={CAREER_LIBRARY_ITEM_LIMIT} value={draft} disabled={busy}
                  onChange={event => setDraft(event.target.value)} placeholder={CAREER_DETAIL_FIELDS.find(field => field.key === category).example} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={buttonClass} disabled={busy || !draft.trim()}>{editingId ? 'Salvar alteração' : 'Adicionar item'}</button>
                {editingId && <button type="button" disabled={busy} onClick={resetEditor} className="px-2 text-xs font-bold text-slate-600">Cancelar edição</button>}
              </div>
            </form>
            {items.length === 0 ? <p className="text-xs text-slate-500">Nenhum item cadastrado nesta categoria.</p> : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {items.map(item => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <span className="min-w-0 break-words text-xs text-slate-700">{item.text}</span>
                    <div className="flex flex-wrap gap-3 text-xs font-bold">
                      {removingId === item.id ? <>
                        <button type="button" className="text-rose-700" disabled={busy} onClick={() => remove(item.id)}>Confirmar exclusão</button>
                        <button type="button" className="text-slate-600" disabled={busy} onClick={() => setRemovingId('')}>Cancelar</button>
                      </> : <>
                        <button type="button" className="text-blue-700" disabled={busy} onClick={() => { setEditingId(item.id); setDraft(item.text); setRemovingId(''); }}>Editar</button>
                        <button type="button" className="text-rose-700" disabled={busy} onClick={() => setRemovingId(item.id)}>Excluir</button>
                      </>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>}
        </div>
      </section>
    </div>
  );
}

export function CareerVacancyDetailEditor({ library, details, onChange, onLimit }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-extrabold text-slate-800">Experiências, benefícios e condições</h4>
      <p className="mt-1 text-xs text-slate-600">Insira itens dos pré-cadastros ou digite diretamente. Os campos preenchidos aparecem na página da vaga.</p>
      {library.status === 'error' && <p role="status" className="mt-2 text-xs text-rose-700">Pré-cadastros indisponíveis no momento.</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {CAREER_DETAIL_FIELDS.map(field => {
          const current = details[field.key] || '';
          const options = library.items.filter(item => item.category === field.key);
          return (
            <div key={field.key}>
              <label className="block text-xs font-bold text-slate-700">
                {field.label}
                <textarea rows={2} maxLength={CAREER_DETAIL_LIMIT} className={inputClass} value={current}
                  onChange={event => onChange(field.key, event.target.value)} placeholder={field.example} />
              </label>
              {options.length > 0 && (
                <select className={inputClass} value="" aria-label={`Inserir item pré-cadastrado em ${field.label.toLocaleLowerCase('pt-BR')}`}
                  onChange={event => {
                    const item = options.find(option => option.id === event.target.value);
                    if (!item) return;
                    const next = appendCareerDetail(current, item.text);
                    if (next === null) onLimit();
                    else onChange(field.key, next);
                  }}>
                  <option value="">Inserir item pré-cadastrado</option>
                  {options.map(item => <option key={item.id} value={item.id}>{item.text}</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CareerVacancyPublishedDetails({ details }) {
  const filledFields = CAREER_DETAIL_FIELDS.filter(field => details?.[field.key]);
  if (!filledFields.length) return null;
  return (
    <dl className="mt-4 space-y-3 text-xs text-slate-700">
      {filledFields.map(field => (
        <div key={field.key}>
          <dt className="font-bold">{field.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words">{details[field.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
