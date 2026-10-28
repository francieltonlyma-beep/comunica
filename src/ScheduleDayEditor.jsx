import { useEffect, useState } from 'react';
import { CalendarDays, LockKeyhole, Search } from 'lucide-react';
import { isFixedProposalRow, isProtectedProposalRow } from './scheduleOptimizer.js';
import { isWorking } from './scheduleDayRules.js';
import './ScheduleDayEditor.css';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const statuses = ['Presencial', 'Home Office', 'Folga', 'Feriado'];

export default function ScheduleDayEditor({
  problem, issues = [], onClearProblem, onOptimize, sectionRef, rows, date, departments = [], disabled, canConfigureRules, onChange, onStatusChange,
  onToggleLock, onRepeatOvertime, onCreateRule, getHours, formatDuration, parseHours,
  intervalMinutes, renderTable,
}) {
  const [view, setView] = useState('cards');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const activeProblem = problem?.date === date && rows.some(row => row.key === problem.rowKey) ? problem : null;
  useEffect(() => {
    if (!activeProblem || !sectionRef?.current) return;
    const card = Array.from(sectionRef.current.querySelectorAll('[data-schedule-row]')).find(element => element.dataset.scheduleRow === activeProblem.rowKey);
    const input = card?.querySelector(`[data-schedule-field="${activeProblem.field}"]`);
    const target = input && !input.disabled && !input.closest('fieldset:disabled') ? input : card;
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
    if (target === input && activeProblem.blocking !== false && typeof input.setCustomValidity === 'function') {
      input.setCustomValidity(`${activeProblem.message} Como resolver: ${activeProblem.hint}`);
      input.reportValidity();
      return () => input.setCustomValidity('');
    }
  }, [activeProblem, sectionRef]);
  const clearProblem = element => {
    element?.setCustomValidity?.('');
    if (activeProblem) { setSearch(''); setStatus('all'); setView('cards'); onClearProblem?.(); }
  };
  const departmentName = row => departments.find(department => department.id === row.dept)?.name || 'Sem setor';
  const filtered = rows.filter(row => row.key === activeProblem?.rowKey || (normalize(`${row.userName} ${departmentName(row)}`).includes(normalize(search).trim())
    && (status === 'all' || (status === 'work' ? isWorking(row) : status === 'off' ? ['Folga', 'Feriado'].includes(row.status) : !isWorking(row) && !['Folga', 'Feriado'].includes(row.status)))));
  const heading = date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', weekday: 'long' }) : 'Dia selecionado';
  return <section ref={sectionRef} tabIndex={-1} className="sde" aria-label="Editar dia da simulação">
    <header className="sde-header"><div><span className="sde-eyebrow"><CalendarDays size={14} /> Ajustes do dia</span><h4>{heading}</h4><p>As alterações ficam na prévia até você salvar e publicar.</p></div><div className="sde-views" aria-label="Formato de edição"><button type="button" disabled={disabled} aria-pressed={view === 'cards' || Boolean(activeProblem)} onClick={() => setView('cards')}>Por colaborador</button><button type="button" disabled={disabled} aria-pressed={view === 'table' && !activeProblem} onClick={() => { onClearProblem?.(); setView('table'); }}>Ver em tabela</button></div></header>
    {view === 'table' && !activeProblem ? renderTable() : <>
      <div className="sde-filters"><label><span><Search size={13} />Buscar neste dia</span><input type="search" placeholder="Nome ou setor" value={search} disabled={disabled} onChange={event => setSearch(event.target.value)} /></label><label><span>Situação</span><select value={status} disabled={disabled} onChange={event => setStatus(event.target.value)}><option value="all">Todas as situações</option><option value="work">Em trabalho</option><option value="off">Folgas e feriados</option><option value="absent">Ausências e férias</option></select></label><span className="sde-result" role="status">{filtered.length} de {rows.length} colaborador(es)</span></div>
      {!filtered.length && <div className="sde-empty"><p>Nenhum colaborador encontrado neste dia com esses filtros.</p><button type="button" disabled={disabled} onClick={() => { setSearch(''); setStatus('all'); }}>Limpar filtros</button></div>}
      <div className="sde-cards">{filtered.map(row => {
        const working = isWorking(row), preserved = isProtectedProposalRow(row), fixed = isFixedProposalRow(row);
        const hardFixed = preserved || row.pinned || row.ruleApplied || row.constraintLocked;
        const hours = getHours(row);
        const known = working && row.shiftStart && row.shiftEnd;
        const fieldIssue = field => issues.find(issue => issue.blocking && (issue.rowKey || issue.key) === row.key && issue.field === field) || (activeProblem?.rowKey === row.key && activeProblem.field === field && activeProblem.blocking !== false ? activeProblem : null);
        const issueId = field => `schedule-${encodeURIComponent(row.key)}-${field}-issue`;
        const feedback = field => { const issue = fieldIssue(field); return issue ? <small id={issueId(field)} className="sde-field-error">{issue.hint || issue.message}</small> : null; };
        const change = changes => onChange(row.key, changes);
        const timeField = (label, field, changes) => <label><span>{label}</span><input data-schedule-field={field} aria-label={`${label} de ${row.userName}`} aria-invalid={Boolean(fieldIssue(field))} aria-describedby={fieldIssue(field) ? issueId(field) : undefined} type="time" disabled={!working} value={row[field] || ''} onChange={event => { clearProblem(event.currentTarget); change(changes ? changes(event.target.value) : { [field]: event.target.value }); }} />{feedback(field)}</label>;
        return <article className={`sde-card ${preserved ? 'sde-preserved' : ''}`} key={row.key} data-schedule-row={row.key} tabIndex={-1} aria-label={`Escala de ${row.userName}`}>
          <header className="sde-person"><div><h5>{row.userName}</h5><p>{departmentName(row)}{row.holiday ? ' · feriado' : ''}</p></div><span className={`sde-badge ${fixed ? 'sde-fixed' : ''}`}>{fixed && <LockKeyhole size={12} />}{preserved ? 'Preservado' : hardFixed ? 'Regra fixa' : fixed ? 'Dia fixado' : 'Dia livre'}</span></header>
          <p className="sde-reason"><strong>{row.groupName || 'Padrão da empresa'}</strong> · {row.ruleReason || 'Jornada padrão e distribuição de folgas'}</p>
          {row.ruleConflicts?.length > 0 && <p className="sde-conflict">Conflito: {row.ruleConflicts.join(' / ')}. Corrija a regra ou ajuste este dia.</p>}
          {activeProblem?.rowKey === row.key && <div className="sde-problem-popup" role="alert"><strong>{activeProblem.message}</strong>{activeProblem.blocking === false && <p>Este aviso não impede a publicação.</p>}<p><b>Como resolver:</b> {preserved ? 'Este lançamento é preservado. Corrija a marcação ou a ausência diretamente no calendário e gere uma nova prévia.' : activeProblem.hint}</p><div>{activeProblem.code === 'coverage' && onOptimize && <button type="button" disabled={disabled} onClick={() => { onClearProblem?.(); onOptimize(); }}>Corrigir cobertura automaticamente</button>}<button type="button" onClick={() => onClearProblem?.()}>Fechar orientação</button></div></div>}
          <fieldset disabled={disabled || preserved} className="sde-fields"><legend className="sde-sr">Horários e situação de {row.userName}</legend>
            <label className="sde-status"><span>Situação do dia</span><select data-schedule-field="status" aria-label={`Situação de ${row.userName}`} aria-invalid={Boolean(fieldIssue('status'))} aria-describedby={fieldIssue('status') ? issueId('status') : undefined} value={row.status} onChange={event => { clearProblem(event.currentTarget); onStatusChange(row, event.target.value); }}>{statuses.map(value => <option key={value}>{value}</option>)}{!statuses.includes(row.status) && <option>{row.status}</option>}</select>{feedback('status')}</label>
            {timeField('Entrada', 'shiftStart')}{timeField('Saída base', 'shiftEnd')}
            {timeField('Início do intervalo', 'breakStart', value => ({ breakStart: value, breakMinutes: intervalMinutes(value, row.breakEnd) }))}
            {timeField('Fim do intervalo', 'breakEnd', value => ({ breakEnd: value, breakMinutes: intervalMinutes(row.breakStart, value) }))}
            <label><span>Hora extra (hh:mm)</span><input data-schedule-field="extraHours" aria-label={`Hora extra de ${row.userName}`} aria-invalid={Boolean(fieldIssue('extraHours'))} aria-describedby={fieldIssue('extraHours') ? issueId('extraHours') : undefined} type="time" disabled={!working} min="00:00" max={formatDuration(row.maxExtraHoursPerDay ?? 12)} value={formatDuration(row.extraHours)} onChange={event => { clearProblem(event.currentTarget); change({ extraHours: parseHours(event.target.value) }); }} />{feedback('extraHours')}</label>
          </fieldset>
          <div className="sde-totals"><div><span>Saída final</span><strong>{known ? hours.actualEnd : working ? 'Confira horários' : '—'}</strong></div><div><span>Carga do dia</span><strong>{known ? formatDuration(hours.total) : '—'}</strong></div>{known && <small>Base {formatDuration(hours.regular)} + extra {formatDuration(hours.extra)}</small>}</div>
          <p className="sde-hint">{preserved ? 'Lançamento já registrado. Ele será mantido como está no calendário.' : hardFixed ? 'Este dia segue uma regra ou ausência registrada. Ajustes de horário ficam fixados na prévia.' : fixed ? 'Este dia será mantido nas próximas reorganizações. Libere para permitir novas trocas.' : 'Qualquer edição fixa apenas este dia nas próximas reorganizações.'}</p>
          <div className="sde-actions"><button type="button" disabled={disabled || hardFixed} aria-pressed={fixed} onClick={() => onToggleLock(row.key)}>{preserved ? 'Preservado no calendário' : hardFixed ? 'Fixo pela regra / ausência' : fixed ? 'Liberar dia' : 'Fixar dia'}</button><details><summary>Mais opções</summary><div><button type="button" disabled={disabled || preserved || !working || !(Number(row.extraHours) > 0)} onClick={() => onRepeatOvertime(row)}>Repetir extra nos próximos dias</button>{canConfigureRules && <button type="button" disabled={disabled || preserved} onClick={() => onCreateRule(row)}>Criar regra recorrente</button>}</div><p>Repetir extra altera e fixa os próximos dias de trabalho desta pessoa na prévia.</p></details></div>
        </article>;
      })}</div>
    </>}
  </section>;
}

