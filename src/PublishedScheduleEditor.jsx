import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DayCoverage } from './ScheduleCoveragePanel.jsx';
import { coverageMissingMinutes, publishedDayHours, publishedEditCoverage, publishedEditIssues, publishedScheduleDraft } from './publishedScheduleEdit.js';
import './PublishedScheduleEditor.css';

const duration = value => { const total = Math.max(0, Math.round((Number(value) || 0) * 60)); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; };
const parseHours = value => { const [hours, minutes] = value.split(':').map(Number); return hours + minutes / 60; };
const shortDate = date => date.split('-').reverse().join('/');
const missingLabel = value => `${Math.round(value)} min de pessoas sem cobertura`;

export default function PublishedScheduleEditor({ edit, context, requirements = [], departments, disabled, ready, stale, onSave, onClose }) {
  const [draft, setDraft] = useState(() => publishedScheduleDraft(edit.source));
  const [submitError, setSubmitError] = useState('');
  const shell = useRef(null), busy = useRef(disabled);
  useEffect(() => { busy.current = disabled; }, [disabled]);
  useEffect(() => {
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; shell.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const onKey = event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!busy.current) onClose(); }
    if (event.key === 'Tab') {
      const elements = [...shell.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')].filter(element => element.getClientRects().length && !element.closest('fieldset:disabled'));
      const first = elements[0], last = elements.at(-1);
      if (!elements.includes(document.activeElement)) { event.preventDefault(); first?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  const patch = changes => { setDraft(previous => ({ ...previous, ...changes })); setSubmitError(''); };
  const working = ['Presencial', 'Home Office'].includes(draft.status);
  const issues = publishedEditIssues(edit.source, draft, edit.date, context);
  const coverage = issues.length ? [] : publishedEditCoverage(edit.source, draft, edit.date, requirements, context);
  const hours = publishedDayHours(draft);
  const changed = JSON.stringify(draft) !== JSON.stringify(publishedScheduleDraft(edit.source));
  const submit = async event => {
    event.preventDefault();
    if (disabled || !ready || stale || issues.length || !changed) return;
    try { if (!await onSave(draft)) setSubmitError('O salvamento não foi confirmado. Sua edição foi preservada.'); }
    catch { setSubmitError('Não foi possível salvar. Sua edição foi preservada; tente novamente.'); }
  };
  return <div className="pse-backdrop"><section className="pse-modal" ref={shell} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Editar escala publicada de ${edit.source.userName}`} onKeyDown={onKey}>
    <header className="pse-header"><div><span>Escala publicada · ajuste de um dia</span><h3>{edit.source.userName}</h3><p>{shortDate(edit.date)} · Os outros dias do período serão mantidos.</p></div><button type="button" disabled={disabled} onClick={onClose} aria-label="Fechar edição da escala"><X size={20}/></button></header>
    <form onSubmit={submit}>
      {!ready && <p className="pse-warning" role="status">Aguarde a confirmação dos dados da empresa para revisar e salvar.</p>}
      {stale && <p className="pse-warning" role="alert">Os dados mudaram durante a edição. Feche e abra este ajuste novamente para revisar a versão atual.</p>}
      <fieldset disabled={disabled || !ready || stale} className="pse-fields"><legend>Horários deste dia</legend>
        <label className="pse-wide">Situação<select value={draft.status} onChange={event => patch({ status: event.target.value })}><option>Presencial</option><option>Home Office</option><option>Folga</option><option>Feriado</option></select></label>
        {[['Entrada','shiftStart'],['Saída base (sem extra)','shiftEnd'],['Início do intervalo','breakStart'],['Fim do intervalo','breakEnd']].map(([label, field]) => <label key={field}>{label}<input type="time" disabled={!working} value={draft[field]} onChange={event => patch({ [field]: event.target.value })}/></label>)}
        <label>Hora extra (hh:mm)<input type="time" disabled={!working} min="00:00" max="12:00" value={duration(draft.extraHours)} onChange={event => patch({ extraHours: parseHours(event.target.value) })}/></label>
        <label className="pse-wide">Motivo do ajuste (opcional)<textarea maxLength={240} rows={2} value={draft.reason} onChange={event => patch({ reason: event.target.value })}/></label>
      </fieldset>
      {!edit.source.baseShiftEnd && Number(edit.source.extraHours) > 0 && <p className="pse-warning">O registro anterior não separa a saída base da hora extra. A saída registrada foi usada como base; confira os horários e a extra antes de salvar.</p>}
      <div className="pse-totals"><span>Saída final<strong>{working && !issues.length ? hours.actualEnd : '—'}</strong></span><span>Carga do dia<strong>{working && !issues.length ? duration(hours.total) : '—'}</strong></span><span>Proteção<strong>Dia fixado após salvar</strong></span></div>
      {issues.length > 0 && <ul className="pse-warning" role="alert">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
      {!issues.length && <section className="pse-coverage" aria-label="Impacto na cobertura"><h4>Confira a cobertura antes de salvar</h4><p>Inclui o dia seguinte para conferir jornadas que atravessam a meia-noite. Os valores consideram toda a equipe do setor.</p>
        {!requirements.length ? <p>Sem necessidades de cobertura cadastradas. Não há uma meta para comparar.</p> : coverage.map(day => <div key={day.date} className="pse-day"><strong>{shortDate(day.date)}</strong><p>Antes: {missingLabel(coverageMissingMinutes(day.before))}<br/>Depois: {missingLabel(coverageMissingMinutes(day.after))}</p>{coverageMissingMinutes(day.after) > coverageMissingMinutes(day.before) && <p className="pse-warning">Este ajuste aumenta a falta de cobertura. Confira a equipe antes de salvar.</p>}<details><summary>Ver faixas de cobertura após o ajuste</summary><DayCoverage coverage={day.after} departments={departments} ready={ready} error=""/></details></div>)}
      </section>}
      {(edit.source.updatedBy || edit.source.updatedAt) && <p className="pse-history">Última alteração: {edit.source.updatedBy || 'responsável não informado'}{Number(edit.source.updatedAt) > 0 ? ` · ${new Date(edit.source.updatedAt).toLocaleString('pt-BR')}` : ''}</p>}
      {submitError && <p className="pse-warning" role="alert">{submitError}</p>}
      <footer className="pse-footer"><button type="button" disabled={disabled} onClick={onClose}>Cancelar</button><button type="submit" disabled={disabled || !ready || stale || issues.length > 0 || !changed}>{disabled ? 'Salvando...' : 'Salvar alteração deste dia'}</button></footer>
    </form>
  </section></div>;
}
