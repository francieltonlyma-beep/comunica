import { useState } from 'react';
import { CalendarDays, LockKeyhole, Search } from 'lucide-react';
import { isFixedProposalRow, isProtectedProposalRow } from './scheduleOptimizer.js';
import { isWorking } from './scheduleDayRules.js';
import './ScheduleDayEditor.css';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const statuses = ['Presencial', 'Home Office', 'Folga', 'Feriado'];

export default function ScheduleDayEditor({
  sectionRef, rows, date, departments = [], disabled, canConfigureRules, onChange, onStatusChange,
  onToggleLock, onRepeatOvertime, onCreateRule, getHours, formatDuration, parseHours,
  intervalMinutes, renderTable,
}) {
  const [view, setView] = useState('cards');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const departmentName = row => departments.find(department => department.id === row.dept)?.name || 'Sem setor';
  const filtered = rows.filter(row => normalize(`${row.userName} ${departmentName(row)}`).includes(normalize(search).trim())
    && (status === 'all' || (status === 'work' ? isWorking(row) : status === 'off' ? ['Folga', 'Feriado'].includes(row.status) : !isWorking(row) && !['Folga', 'Feriado'].includes(row.status))));
  const heading = date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', weekday: 'long' }) : 'Dia selecionado';
  return <section ref={sectionRef} tabIndex={-1} className="sde" aria-label="Editar dia da simulação">
    <header className="sde-header"><div><span className="sde-eyebrow"><CalendarDays size={14} /> Ajustes do dia</span><h4>{heading}</h4><p>As alterações ficam na prévia até você salvar e publicar.</p></div><div className="sde-views" aria-label="Formato de edição"><button type="button" disabled={disabled} aria-pressed={view === 'cards'} onClick={() => setView('cards')}>Por colaborador</button><button type="button" disabled={disabled} aria-pressed={view === 'table'} onClick={() => setView('table')}>Ver em tabela</button></div></header>
    {view === 'table' ? renderTable() : <>
      <div className="sde-filters"><label><span><Search size={13} />Buscar neste dia</span><input type="search" placeholder="Nome ou setor" value={search} disabled={disabled} onChange={event => setSearch(event.target.value)} /></label><label><span>Situação</span><select value={status} disabled={disabled} onChange={event => setStatus(event.target.value)}><option value="all">Todas as situações</option><option value="work">Em trabalho</option><option value="off">Folgas e feriados</option><option value="absent">Ausências e férias</option></select></label><span className="sde-result" role="status">{filtered.length} de {rows.length} colaborador(es)</span></div>
      {!filtered.length && <div className="sde-empty"><p>Nenhum colaborador encontrado neste dia com esses filtros.</p><button type="button" disabled={disabled} onClick={() => { setSearch(''); setStatus('all'); }}>Limpar filtros</button></div>}
      <div className="sde-cards">{filtered.map(row => {
        const working = isWorking(row), preserved = isProtectedProposalRow(row), fixed = isFixedProposalRow(row);
        const hardFixed = preserved || row.pinned || row.ruleApplied || row.constraintLocked;
        const hours = getHours(row);
        const known = working && row.shiftStart && row.shiftEnd;
        const change = changes => onChange(row.key, changes);
        const timeField = (label, field, changes) => <label><span>{label}</span><input aria-label={`${label} de ${row.userName}`} type="time" disabled={!working} value={row[field] || ''} onChange={event => change(changes ? changes(event.target.value) : { [field]: event.target.value })} /></label>;
        return <article className={`sde-card ${preserved ? 'sde-preserved' : ''}`} key={row.key} aria-label={`Escala de ${row.userName}`}>
          <header className="sde-person"><div><h5>{row.userName}</h5><p>{departmentName(row)}{row.holiday ? ' · feriado' : ''}</p></div><span className={`sde-badge ${fixed ? 'sde-fixed' : ''}`}>{fixed && <LockKeyhole size={12} />}{preserved ? 'Preservado' : hardFixed ? 'Regra fixa' : fixed ? 'Dia fixado' : 'Dia livre'}</span></header>
          <p className="sde-reason"><strong>{row.groupName || 'Padrão da empresa'}</strong> · {row.ruleReason || 'Jornada padrão e distribuição de folgas'}</p>
          {row.ruleConflicts?.length > 0 && <p className="sde-conflict">Conflito: {row.ruleConflicts.join(' / ')}. Corrija a regra ou ajuste este dia.</p>}
          <fieldset disabled={disabled || preserved} className="sde-fields"><legend className="sde-sr">Horários e situação de {row.userName}</legend>
            <label className="sde-status"><span>Situação do dia</span><select aria-label={`Situação de ${row.userName}`} value={row.status} onChange={event => onStatusChange(row, event.target.value)}>{statuses.map(value => <option key={value}>{value}</option>)}{!statuses.includes(row.status) && <option>{row.status}</option>}</select></label>
            {timeField('Entrada', 'shiftStart')}{timeField('Saída base', 'shiftEnd')}
            {timeField('Início do intervalo', 'breakStart', value => ({ breakStart: value, breakMinutes: intervalMinutes(value, row.breakEnd) }))}
            {timeField('Fim do intervalo', 'breakEnd', value => ({ breakEnd: value, breakMinutes: intervalMinutes(row.breakStart, value) }))}
            <label><span>Hora extra (hh:mm)</span><input aria-label={`Hora extra de ${row.userName}`} type="time" disabled={!working} min="00:00" max="12:00" value={formatDuration(row.extraHours)} onChange={event => change({ extraHours: parseHours(event.target.value) })} /></label>
          </fieldset>
          <div className="sde-totals"><div><span>Saída final</span><strong>{known ? hours.actualEnd : working ? 'Confira horários' : '—'}</strong></div><div><span>Carga do dia</span><strong>{known ? formatDuration(hours.total) : '—'}</strong></div>{known && <small>Base {formatDuration(hours.regular)} + extra {formatDuration(hours.extra)}</small>}</div>
          <p className="sde-hint">{preserved ? 'Lançamento já registrado. Ele será mantido como está no calendário.' : hardFixed ? 'Este dia segue uma regra ou ausência registrada. Ajustes de horário ficam fixados na prévia.' : fixed ? 'Este dia será mantido nas próximas reorganizações. Libere para permitir novas trocas.' : 'Qualquer edição fixa apenas este dia nas próximas reorganizações.'}</p>
          <div className="sde-actions"><button type="button" disabled={disabled || hardFixed} aria-pressed={fixed} onClick={() => onToggleLock(row.key)}>{preserved ? 'Preservado no calendário' : hardFixed ? 'Fixo pela regra / ausência' : fixed ? 'Liberar dia' : 'Fixar dia'}</button><details><summary>Mais opções</summary><div><button type="button" disabled={disabled || preserved || !working || !(Number(row.extraHours) > 0)} onClick={() => onRepeatOvertime(row)}>Repetir extra nos próximos dias</button>{canConfigureRules && <button type="button" disabled={disabled || preserved} onClick={() => onCreateRule(row)}>Criar regra recorrente</button>}</div><p>Repetir extra altera e fixa os próximos dias de trabalho desta pessoa na prévia.</p></details></div>
        </article>;
      })}</div>
    </>}
  </section>;
}
