import { useRef, useState } from 'react';
import { teamMonthKeyboardTarget } from './scheduleKeyboardNavigation.js';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Printer } from 'lucide-react';
import { openSchedulePrintView } from './schedulePrint.js';
import { nextTeamCoverageDate, teamCoverageSummary, teamDaySummary, teamMonthRows } from './scheduleTeamMonth.js';
import './ScheduleTeamMonth.css';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

export default function ScheduleTeamMonth({ companyName, days, employees, departments, filters, getDepartments, today, selectedDate, selectedPerson, onSelectCell, onSelectCoverage, showAbsences, showEvents, showCoverage, coverageReady, coverageError }) {
  const scrollRef = useRef(null);
  const [showHours, setShowHours] = useState(false);
  const [onlyScheduled, setOnlyScheduled] = useState(false);
  const filterKey = [filters.department, filters.employee, filters.status, filters.search, onlyScheduled, showAbsences].join('|');
  const [rowPagination, setRowPagination] = useState({ key: filterKey, count: 12 });
  const [printError, setPrintError] = useState('');
  const rows = teamMonthRows(days, employees, { filters, getDepartments, showAbsences, onlyScheduled });
  const visibleRowCount = rowPagination.key === filterKey ? rowPagination.count : 12;
  const visibleRows = rows.slice(0, visibleRowCount);
  const activeRow = Math.max(0, visibleRows.findIndex(row => row.userId === selectedPerson));
  const activeDay = Math.max(0, days.findIndex(day => day.date === selectedDate));
  const selectCell = (cell, row, keyboard = false) => {
    const summary = teamDaySummary(cell);
    onSelectCell(cell.date, row.userId, cell.absences.length && ['vacation', 'absence'].includes(summary.tone) ? 'absences' : 'schedules', { keyboard });
  };
  const moveSelection = (event, rowIndex, dayIndex) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = teamMonthKeyboardTarget(event.key, rowIndex, dayIndex, rows.length, days.length);
    if (!next) return;
    event.preventDefault();
    if (next.row >= visibleRows.length) setRowPagination({ key: filterKey, count: Math.min(rows.length, Math.max(visibleRowCount + 12, next.row + 1)) });
    selectCell(rows[next.row].cells[next.day], rows[next.row], true);
    requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector(`[data-team-row="${next.row}"][data-team-day="${next.day}"]`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
  };
  const coverageSummaries = days.map(day => ({ date: day.date, ...teamCoverageSummary(day.coverage, departments, { ready: coverageReady, error: coverageError }) }));
  const coverageCounts = coverageSummaries.reduce((counts, day) => ({ ...counts, [day.tone]: (counts[day.tone] || 0) + 1 }), {});
  const nextPendingDate = coverageReady && !coverageError ? nextTeamCoverageDate(days, selectedDate, departments) : '';
  const printMonth = () => {
    setPrintError('');
    const labels = [];
    if (filters.department !== 'all') labels.push(`Setor: ${departments.find(item => item.id === filters.department)?.name || filters.department}`);
    if (filters.employee !== 'all') labels.push(`Colaborador: ${employees.find(item => String(item.id) === String(filters.employee))?.name || filters.employee}`);
    if (filters.status !== 'all') labels.push(`Situação: ${filters.status}`);
    if (filters.search.trim()) labels.push(`Busca: ${filters.search.trim()}`);
    if (onlyScheduled) labels.push('Somente pessoas escaladas');
    if (!showAbsences) labels.push('Ausências ocultas');
    try { openSchedulePrintView({ rows, days, departments, companyName, filterLabels: labels, showHours, showCoverage, showEvents }); }
    catch (error) { setPrintError(error.message || 'Não foi possível abrir a impressão. Tente novamente.'); }
  };
  return <section className="stm" aria-label="Escala mensal lado a lado">
    <div className="stm-toolbar"><div><strong>Equipe lado a lado</strong><span>{visibleRows.length} de {rows.length} colaborador(es) · {days.length} dias</span></div><div className="stm-print-tools"><label><input type="checkbox" checked={onlyScheduled} onChange={event => setOnlyScheduled(event.target.checked)}/>Só pessoas escaladas</label><label><input type="checkbox" checked={showHours} onChange={event => setShowHours(event.target.checked)}/>Exibir horários</label><button type="button" onClick={printMonth} disabled={!rows.length || !coverageReady || Boolean(coverageError)} title="Abrir uma versão de impressão com toda a equipe filtrada; na janela de impressão, escolha Salvar como PDF"><Printer size={14}/>Imprimir / PDF</button></div></div>
    {printError && <p className="stm-print-error" role="alert">{printError}</p>}
    {showCoverage && <div className="stm-month-coverage" aria-label="Resumo da cobertura mensal">
      <strong>Cobertura no mês</strong>
      {coverageError ? <span role="alert">{coverageError}</span> : !coverageReady ? <span role="status">Carregando cobertura...</span> : <>
        <span className="stm-summary-sufficient"><CheckCircle2 size={14}/>{(coverageCounts.sufficient || 0) + (coverageCounts.excess || 0)} dia(s) com mínimo atendido</span>
        <span className="stm-summary-shortage"><AlertTriangle size={14}/>{coverageCounts.shortage || 0} com falta de equipe</span>
        <span className="stm-summary-unknown"><Clock size={14}/>{coverageCounts.unknown || 0} a revisar</span>
        <span className="stm-summary-excess">{coverageCounts.excess || 0} acima do máximo</span>
        {coverageCounts.closed > 0 && <span>{coverageCounts.closed} fechado(s)</span>}
        {coverageCounts.none > 0 && <span>{coverageCounts.none} sem necessidade cadastrada</span>}
        {nextPendingDate && <button type="button" onClick={() => onSelectCoverage(nextPendingDate)}><ArrowRight size={14}/>Próxima pendência · {Number(nextPendingDate.slice(-2))}</button>}
      </>}
    </div>}
    <p className="stm-selection" aria-live="polite">{days.some(day => day.date === selectedDate) ? `Dia selecionado: ${dateLabel(selectedDate)}${selectedPerson ? ` · ${rows.find(row => row.userId === selectedPerson)?.name || ''}` : ''}` : 'Selecione uma célula da equipe'}</p>
    <p className="stm-help">Clique em uma célula e use ← → para mudar o dia e ↑ ↓ para mudar o funcionário. Os dias e os nomes ficam fixos durante a rolagem.</p>
    <div ref={scrollRef} className={`stm-scroll ${showHours ? 'stm-with-hours' : ''}`} aria-label="Quadro mensal da equipe; use as setas do teclado nas células">
      <table className="stm-table"><caption>Escala publicada da equipe · {days[0]?.date.slice(0, 7).split('-').reverse().join('/')}</caption>
        <thead><tr><th scope="col" className="stm-person">Colaborador / setor</th>{days.map(day => <th scope="col" key={day.date} className={`${[0, 6].includes(new Date(day.date + 'T12:00:00').getDay()) ? 'stm-weekend' : ''} ${day.date === today ? 'stm-today' : ''} ${day.date === selectedDate ? 'stm-day-selected' : ''}`} aria-label={`${dateLabel(day.date)}${day.date === selectedDate ? ', dia selecionado' : ''}`}  aria-current={day.date === today ? 'date' : undefined}><span>{Number(day.date.slice(-2))}</span><small>{weekdays[new Date(day.date + 'T12:00:00').getDay()]}</small>{showEvents && day.events.length > 0 && <abbr title={day.events.map(event => event.title).join('; ')} aria-label={day.events.map(event => event.title).join('; ')}>●</abbr>}</th>)}</tr></thead>
        <tbody>{showCoverage && <tr className="stm-coverage-row"><th scope="row" className="stm-person">Disponíveis / mínimo<small>Pior faixa · toda a equipe</small></th>{coverageSummaries.map(summary => <td key={summary.date} className={summary.date === selectedDate ? 'stm-column-selected' : ''}><button type="button" className={`stm-coverage stm-${summary.tone}`} aria-label={`${dateLabel(summary.date)}: ${summary.label}${summary.details ? `. ${summary.details}` : ''}`} title={`${summary.label}${summary.details ? `\n${summary.details}` : ''}`} onClick={() => onSelectCoverage(summary.date)}><span>{summary.code}{summary.unknown ? ' ?' : summary.excess ? ' ↑' : ''}</span><small>{summary.tone === 'shortage' ? 'Falta' : summary.tone === 'unknown' ? 'Revisar' : summary.tone === 'excess' ? 'Excesso' : summary.tone === 'sufficient' ? 'OK' : summary.tone === 'closed' ? 'Fechado' : '—'}</small></button></td>)}</tr>}
          {visibleRows.map((row, rowIndex) => <tr key={row.key}><th scope="row" className={`stm-person ${row.userId === selectedPerson ? 'stm-person-selected' : ''}`} title={row.name}><strong>{row.name}</strong><small>{row.departments.map(id => departments.find(department => department.id === id)?.name || id).join(' · ') || 'Sem setor'}</small></th>{row.cells.map((cell, dayIndex) => {
            const summary = teamDaySummary(cell), selected = Boolean(selectedPerson) && selectedDate === cell.date && selectedPerson === row.userId;
            return <td key={cell.date} className={`${cell.date === today ? 'stm-today' : ''} ${cell.date === selectedDate ? 'stm-column-selected' : ''}`}><button type="button" data-team-row={rowIndex} data-team-day={dayIndex} tabIndex={rowIndex === activeRow && dayIndex === activeDay ? 0 : -1} onKeyDown={event => moveSelection(event, rowIndex, dayIndex)} aria-pressed={selected} title={`${row.name} · ${dateLabel(cell.date)}: ${summary.description}${summary.fixed ? ' · Dia fixado' : ''}`} aria-label={`${row.name}, ${dateLabel(cell.date)}: ${summary.description}${summary.fixed ? '. Dia fixado' : ''}`} className={`stm-cell stm-${summary.tone} ${selected ? 'stm-selected' : ''}`} onClick={() => selectCell(cell, row)}><span>{summary.code}{summary.partial && <sup title="Ausência parcial">A</sup>}{summary.fixed && <i aria-hidden="true">•</i>}</span>{showHours && summary.hours && <small>{summary.hours}</small>}</button></td>;
          })}</tr>)}
        </tbody>
      </table>
      {!rows.length && <p className="stm-empty">{onlyScheduled ? 'Nenhuma pessoa possui escala publicada neste mês com os filtros atuais.' : 'Nenhum colaborador encontrado. Confira os filtros do calendário.'}</p>}
    </div>
    {rows.length > 12 && <div className="stm-pagination"><span aria-live="polite">{visibleRows.length} de {rows.length} pessoas visíveis. As linhas são carregadas em blocos para manter o calendário ágil.</span><div>{visibleRows.length > 12 && <button type="button" onClick={() => setRowPagination({ key: filterKey, count: 12 })}>Recolher para 12</button>}{visibleRows.length < rows.length && <button type="button" onClick={() => setRowPagination({ key: filterKey, count: visibleRowCount + 12 })}>Mostrar mais {Math.min(12, rows.length - visibleRows.length)}</button>}</div></div>}
    <div className="stm-legend">{[['work','P · Presencial'],['remote','HO · Home office'],['off','F · Folga'],['holiday','FE · Feriado'],['vacation','V · Férias'],['absence','A · Ausência'],['empty','— · Sem registro']].map(([tone, label]) => <span key={tone}><i className={`stm-${tone}`}/>{label}</span>)}<span>• Dia fixado</span><span>2 reg. · Mais de uma marcação</span></div>
    <p className="stm-help">Ausências de dia inteiro aparecem sobre a marcação de trabalho. A sobrescrito indica ausência parcial. A cobertura mostra disponíveis / mínimo na pior faixa do dia, sem somar pessoas de horários ou setores diferentes. Clique na contagem para conferir todos os horários. A seta ↑ indica excesso em alguma faixa; ? indica horários incompletos. Usa toda a equipe do setor, mesmo com a grade filtrada.</p>
  </section>;
}

