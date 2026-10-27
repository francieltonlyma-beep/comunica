import { useState } from 'react';
import { Plus, Pencil, Trash2, LoaderCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { normalizeCoverageRequirements, validateCoverageRequirements } from './scheduleCoverage.js';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const emptyRule = department => ({ id: '', department: department === 'all' ? '' : department, start: '08:00', end: '12:00', minimum: 1, weekdays: [1, 2, 3, 4, 5], includeRemote: false });

export function CoverageRequirementEditor({ requirements, departments, canConfigure, onSave, defaultDepartment, ready, error, embedded = false }) {
  const Form = embedded ? 'div' : 'form';
  const [draft, setDraft] = useState(() => emptyRule(defaultDepartment));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const patch = changes => setDraft(previous => ({ ...previous, ...changes }));
  const persist = async next => {
    const problem = validateCoverageRequirements(next, departments);
    if (problem) { setMessage(problem); return false; }
    setMessage(''); setSaving(true);
    try { const saved = await onSave(next); if (!saved) setMessage('O salvamento não foi confirmado. Sua edição foi preservada; tente novamente.'); return saved; }
    catch { setMessage('Não foi possível salvar. Sua edição foi preservada.'); return false; }
    finally { setSaving(false); }
  };
  const submit = async event => {
    event.preventDefault();
    const rule = normalizeCoverageRequirements([{ ...draft, id: draft.id || `coverage-${crypto.randomUUID()}` }])[0];
    const next = draft.id ? requirements.map(item => item.id === draft.id ? rule : item) : [...requirements, rule];
    if (await persist(next)) { setEditing(false); setDraft(emptyRule(defaultDepartment)); }
  };
  return <section className="sc-need-editor" aria-label="Necessidade de pessoas por setor">
    <div className="sc-need-heading"><div><h3>Necessidade de pessoas</h3><p>Defina o mínimo por setor, faixa de horário e dias da semana. Vale para os próximos planejamentos.</p></div>
      {canConfigure && ready && !editing && <button type="button" className="sc-primary" disabled={saving || requirements.length >= 100} onClick={() => { setDraft(emptyRule(defaultDepartment)); setMessage(''); setEditing(true); }}><Plus size={15} /> Nova faixa</button>}
    </div>
    {error && <p role="alert" className="sc-coverage-warning">{error}</p>}
    {!ready && !error && <p role="status" className="sc-muted">Carregando necessidades salvas...</p>}
    {ready && !requirements.length && !editing && <p className="sc-muted">Nenhuma necessidade cadastrada. Cadastre a primeira faixa para acompanhar a cobertura no calendário.</p>}
    <div className="sc-need-list">{requirements.map(rule => <article className="sc-need-rule" key={rule.id}>
      <div><strong>{departments.find(item => item.id === rule.department)?.name || 'Setor não disponível'}</strong><p>{rule.start} – {rule.end} · mínimo {rule.minimum} pessoa(s)</p><small>{rule.weekdays.map(day => dayNames[day]).join(' · ')}{rule.includeRemote ? ' · inclui home office' : ' · presencial'}</small></div>
      {canConfigure && ready && <div className="sc-need-rule-actions"><button type="button" className="sc-icon-button" disabled={saving} aria-label={`Editar necessidade ${rule.start} de ${departments.find(item => item.id === rule.department)?.name || rule.department}`} onClick={() => { setDraft({ ...rule, weekdays: [...rule.weekdays] }); setEditing(true); setMessage(''); }}><Pencil size={14} /></button><button type="button" className="sc-icon-button" disabled={saving} aria-label={`Remover necessidade ${rule.start} de ${departments.find(item => item.id === rule.department)?.name || rule.department}`} onClick={async () => { if (await persist(requirements.filter(item => item.id !== rule.id))) { if (draft.id === rule.id) setEditing(false); } }}><Trash2 size={14} /></button></div>}
    </article>)}</div>
    {canConfigure && ready && editing && <Form onSubmit={embedded ? undefined : submit} className="sc-need-form">
      <h4>{draft.id ? 'Editar faixa' : 'Nova faixa de necessidade'}</h4>
      <div className="sc-need-fields">
        <label>Setor<select required disabled={saving} value={draft.department} onChange={event => patch({ department: event.target.value })}><option value="">Selecione o setor</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Das<input type="time" required disabled={saving} value={draft.start} onChange={event => patch({ start: event.target.value })} /></label>
        <label>Até<input type="time" required disabled={saving} value={draft.end} onChange={event => patch({ end: event.target.value })} /></label>
        <label>Mínimo de pessoas<input type="number" required min="1" max="500" step="1" disabled={saving} value={draft.minimum} onChange={event => patch({ minimum: event.target.value })} /></label>
      </div>
      <fieldset disabled={saving}><legend>Repetir nos dias</legend><div className="sc-need-weekdays">{dayNames.map((name, day) => <label key={name}><input type="checkbox" checked={draft.weekdays.includes(day)} onChange={event => patch({ weekdays: event.target.checked ? [...draft.weekdays, day].sort() : draft.weekdays.filter(value => value !== day) })} />{name}</label>)}</div></fieldset>
      <label className="sc-need-remote"><input type="checkbox" disabled={saving} checked={draft.includeRemote} onChange={event => patch({ includeRemote: event.target.checked })} />Contar home office na cobertura desta faixa</label>
      <div className="sc-need-form-actions"><button type="button" disabled={saving} className="sc-button" onClick={() => { setEditing(false); setMessage(''); }}>Cancelar</button><button className="sc-primary" disabled={saving} type={embedded ? 'button' : 'submit'} onClick={embedded ? submit : undefined}>{saving ? <LoaderCircle size={15} className="sc-spin" /> : null}{saving ? 'Salvando...' : 'Salvar necessidade'}</button></div>
    </Form>}
    {message && <p className="sc-coverage-warning" role="alert">{message}</p>}
    {!canConfigure && <p className="sc-muted">A configuração segue a permissão “Configurar regras da escala inteligente”.</p>}
  </section>;
}

export function DayCoverage({ coverage, departments, ready, error }) {
  if (error) return <p role="alert" className="sc-coverage-warning">{error}</p>;
  if (!ready) return <p className="sc-muted" role="status">Carregando cobertura...</p>;
  if (!coverage.rules.length) return <div className="sc-empty"><Clock size={24} /><strong>Sem necessidade para este dia</strong><p>Cadastre uma faixa ou revise o setor selecionado.</p></div>;
  return <div className="sc-coverage-details"><p className="sc-muted">Considera toda a escala do setor, mesmo com filtros por pessoa ou situação. Contagens são de pessoas distintas por horário.</p>
    {coverage.rules.map(rule => <article className={`sc-coverage-card sc-coverage-${rule.status}`} key={rule.id}>
      <div className="sc-coverage-title">{rule.status === 'sufficient' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}<strong>{departments.find(item => item.id === rule.department)?.name || rule.department}</strong></div>
      <p>{rule.start} – {rule.end} · mínimo {rule.minimum} · {rule.includeRemote ? 'inclui home office' : 'presencial'}</p>
      {rule.unknown > 0 && <p className="sc-coverage-warning">{rule.unknown} pessoa(s) com horário ou intervalo incompleto. Não entram na contagem confirmada.</p>}
      <div className="sc-coverage-segments">{rule.segments.map(segment => <div key={segment.start}><span>{segment.start} – {segment.end}</span><strong>{segment.available}/{rule.minimum}</strong><span className={segment.missing ? 'sc-shortage-text' : 'sc-sufficient-text'}>{segment.missing ? `${rule.unknown ? 'A confirmar' : 'Faltam'} ${segment.missing}` : 'Suficiente'}</span></div>)}</div>
    </article>)}
  </div>;
}
