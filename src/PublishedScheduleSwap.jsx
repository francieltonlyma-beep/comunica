import PurchaseSelect from './PurchaseSelect.jsx';
import { coverageChangeError } from './scheduleCoverageChange.js';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { DayCoverage } from './ScheduleCoveragePanel.jsx';
import { coverageMissingMinutes } from './publishedScheduleEdit.js';
import { publishedScheduleOnDay, publishedSwapCandidates, publishedSwapCoverage, publishedSwapIssues, publishedSwapSummary } from './publishedScheduleSwap.js';
import './PublishedScheduleEditor.css';

const shortDate = date => date.split('-').reverse().join('/');
const missingLabel = value => `${Math.round(value)} min de pessoas sem cobertura`;

export default function PublishedScheduleSwap({ swap, context, requirements = [], departments, employees, disabled, ready, stale, mode = 'apply', onSave, onClose }) {
  const initialCandidates = publishedSwapCandidates(swap.source, swap.date, context.history, employees);
  const [targetDate, setTargetDate] = useState(swap.targetDate || swap.date);
  const [targetUserId, setTargetUserId] = useState(swap.targetUserId != null ? String(swap.targetUserId) : initialCandidates[0]?.id != null ? String(initialCandidates[0].id) : '');
  const [reason, setReason] = useState(swap.reason || '');
  const [submitError, setSubmitError] = useState('');
  const shell = useRef(null), busy = useRef(disabled), saving = useRef(false), operationId = useRef(globalThis.crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const locked = disabled || submitting;
  useEffect(() => { busy.current = disabled; }, [disabled]);
  useEffect(() => {
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; shell.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const candidates = publishedSwapCandidates(swap.source, targetDate, context.history, employees);
  const target = publishedScheduleOnDay(context.history, targetUserId, targetDate);
  const issues = target ? publishedSwapIssues(swap.source, swap.date, target, targetDate, context) : ['Escolha uma pessoa com escala publicada neste dia.'];
  const coverage = target && !issues.length ? publishedSwapCoverage(swap.source, swap.date, target, targetDate, requirements, context) : [];
  const summary = target ? publishedSwapSummary(swap.source, target) : null;
  const onKey = event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!busy.current && !saving.current) onClose(); }
    if (event.key === 'Tab') {
      const elements = [...shell.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')].filter(element => element.getClientRects().length && !element.closest('fieldset:disabled'));
      const first = elements[0], last = elements.at(-1);
      if (!elements.includes(document.activeElement)) { event.preventDefault(); first?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };
  const coverageProblem = coverageChangeError(coverage);
  const submit = async event => {
    event.preventDefault();
    if (busy.current || saving.current || !ready || stale || coverageProblem || issues.length || !target) return;
    if (!reason.trim()) { setSubmitError('Informe o motivo da troca.'); shell.current?.querySelector('textarea')?.focus(); return; }
    saving.current = true; busy.current = true; setSubmitting(true);
    setSubmitError('');
    try { if (!await onSave({ target, targetDate, reason: reason.trim(), publicationId: operationId.current })) setSubmitError('O salvamento não foi confirmado. Sua troca foi preservada.'); }
    catch { setSubmitError('Não foi possível salvar. Sua troca foi preservada; tente novamente.'); }
    finally { saving.current = false; busy.current = disabled; setSubmitting(false); }
  };
  return <div className="pse-backdrop"><section className="pse-modal" ref={shell} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Trocar escala publicada de ${swap.source.userName}`} onKeyDown={onKey}>
    <header className="pse-header"><div><span>Escala publicada · troca de folga ou turno</span><h3><ArrowLeftRight size={18}/> {mode === 'request' ? 'Solicitar troca' : mode === 'approval' ? 'Analisar solicitação' : 'Trocar entre colaboradores'}</h3><p>{mode === 'request' ? 'O colega escolhido e o gestor precisarão aprovar.' : 'Somente os dois dias escolhidos serão alterados.'}</p></div><button type="button" disabled={locked} onClick={onClose} aria-label="Fechar troca de escala"><X size={20}/></button></header>
    <form onSubmit={submit}>
      {!ready && <p className="pse-warning" role="status">Aguarde a confirmação dos dados da empresa para revisar e salvar.</p>}
      {stale && <p className="pse-warning" role="alert">Os dados mudaram durante a revisão. Feche e abra esta troca novamente.</p>}
      <div className="pse-swap-source"><span>Primeiro dia</span><strong>{swap.source.userName}</strong><p>{shortDate(swap.date)} · {publishedSwapSummary(swap.source, swap.source).source}</p></div>
      <fieldset disabled={locked || !ready || stale} className="pse-fields"><legend>{mode === 'approval' ? 'Troca solicitada' : 'Escolha outro colaborador do mesmo setor'}</legend>
        <label>Dia da outra escala<input type="date" disabled={mode === 'approval'} value={targetDate} onChange={event => { const date = event.target.value; const next = publishedSwapCandidates(swap.source, date, context.history, employees); setTargetDate(date); setTargetUserId(next.some(person => String(person.id) === targetUserId) ? targetUserId : next[0]?.id != null ? String(next[0].id) : ''); setSubmitError(''); }}/></label>
        <label>Colaborador<PurchaseSelect searchPlaceholder="Buscar por nome" label="Colaborador para a troca" value={targetUserId} onChange={selectedId => { setTargetUserId(selectedId); setSubmitError(''); }} disabled={mode === 'approval'} placeholder="Selecione" options={candidates.map(person => [String(person.id), person.name])} /></label>
        <label className="pse-wide">Motivo da troca (obrigatório)<textarea required aria-invalid={Boolean(submitError && !reason.trim())} maxLength={240} rows={2} value={reason} onChange={event => { setReason(event.target.value); setSubmitError(''); }} placeholder="Ex.: troca combinada entre a equipe"/></label>
      </fieldset>
      {summary && <section className="pse-swap-comparison" aria-label="Prévia dos dois dias"><h4>Antes e depois da troca</h4><p>Apenas estas duas marcações mudam. Nada foi salvo.</p><div className="pse-comparison-scroll"><table><thead><tr><th scope="col">Colaborador / dia</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead><tbody><tr><th scope="row">{swap.source.userName}<small>{shortDate(swap.date)}</small></th><td>{summary.source}</td><td className="pse-changed">{summary.target}</td></tr><tr><th scope="row">{target.userName}<small>{shortDate(targetDate)}</small></th><td>{summary.target}</td><td className="pse-changed">{summary.source}</td></tr></tbody></table></div></section>}
      {issues.length > 0 && <ul className="pse-warning" role="alert">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
      {!issues.length && <section className="pse-coverage" aria-label="Impacto da troca na cobertura"><h4>Confira a cobertura antes de salvar</h4><p>Os dias seguintes também são conferidos quando há jornada que atravessa a meia-noite.</p>
        {!requirements.length ? <p>Sem necessidades de cobertura cadastradas. Não há uma meta para comparar.</p> : coverage.map(day => <div key={day.date} className="pse-day"><strong>{shortDate(day.date)}</strong><p>Antes: {missingLabel(coverageMissingMinutes(day.before))}<br/>Depois: {missingLabel(coverageMissingMinutes(day.after))}</p>{coverageMissingMinutes(day.after) > coverageMissingMinutes(day.before) && <p className="pse-warning">A troca aumenta a falta de cobertura neste período.</p>}<details><summary>Ver faixas após a troca</summary><DayCoverage coverage={day.after} departments={departments} ready={ready} error=""/></details></div>)}
      </section>}
      {coverageProblem && <p className="pse-warning" role="alert">{coverageProblem}</p>}
      {submitError && <p className="pse-warning" role="alert">{submitError}</p>}
      <footer className="pse-footer"><button type="button" disabled={locked} onClick={onClose}>Cancelar</button><button type="submit" disabled={locked || !ready || stale || Boolean(coverageProblem) || issues.length > 0}>{locked ? 'Salvando...' : mode === 'request' ? 'Enviar solicitação de troca' : mode === 'approval' ? 'Aprovar e aplicar troca' : 'Confirmar troca dos dois dias'}</button></footer>
    </form>
  </section></div>;
}
