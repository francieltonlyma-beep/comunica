import { useState } from 'react';
import { Printer } from 'lucide-react';
import { openSchedulePrintView } from './schedulePrint.js';
import { teamDaySummary, teamMonthRows } from './scheduleTeamMonth.js';
import './ScheduleTeamMonth.css';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
const coverageLabels = { sufficient: 'Suficiente', shortage: 'Falta de equipe', unknown: 'Revisar horários', none: 'Sem necessidade cadastrada' };

export default function ScheduleTeamMonth({ companyName, days, employees, departments, filters, getDepartments, today, selectedDate, selectedPerson, onSelectCell, onSelectCoverage, showAbsences, showEvents, showCoverage, coverageReady, coverageError }) {
  const [showHours, setShowHours] = useState(false);
  const [printError, setPrintError] = useState('');
  const rows = teamMonthRows(days, employees, { filters, getDepartments, showAbsences });
  const printMonth = () => {
    setPrintError('');
    const labels = [];
    if (filters.department !== 'all') labels.push(`Setor: ${departments.find(item => item.id === filters.department)?.name || filters.department}`);
    if (filters.employee !== 'all') labels.push(`Colaborador: ${employees.find(item => String(item.id) === String(filters.employee))?.name || filters.employee}`);
    if (filters.status !== 'all') labels.push(`Situação: ${filters.status}`);
    if (filters.search.trim()) labels.push(`Busca: ${filters.search.trim()}`);
    if (!showAbsences) labels.push('Ausências ocultas');
    try { openSchedulePrintView({ rows, days, departments, companyName, filterLabels: labels, showHours, showCoverage, showEvents }); }
    catch (error) { setPrintError(error.message || 'Não foi possível abrir a impressão. Tente novamente.'); }
  };
  return <section className="stm" aria-label="Escala mensal lado a lado">
    <div className="stm-toolbar"><div><strong>Equipe lado a lado</strong><span>{rows.length} colaborador(es) · {days.length} dias</span></div><div className="stm-print-tools"><label><input type="checkbox" checked={showHours} onChange={event => setShowHours(event.target.checked)}/>Exibir horários</label><button type="button" onClick={printMonth} disabled={!rows.length || !coverageReady || Boolean(coverageError)} title="Abrir uma versão de impressão da equipe visível; na janela de impressão, escolha Salvar como PDF"><Printer size={14}/>Imprimir / PDF</button></div></div>
    {printError && <p className="stm-print-error" role="alert">{printError}</p>}
    <p className="stm-help">Role para os lados para percorrer o mês. Os nomes ficam fixos. Clique em uma célula para consultar ou editar aquele dia.</p>
    <div className={`stm-scroll ${showHours ? 'stm-with-hours' : ''}`} tabIndex={0} aria-label="Quadro mensal da equipe; role para os lados e para baixo">
      <table className="stm-table"><caption>Escala publicada da equipe · {days[0]?.date.slice(0, 7).split('-').reverse().join('/')}</caption>
        <thead><tr><th scope="col" className="stm-person">Colaborador / setor</th>{days.map(day => <th scope="col" key={day.date} className={`${[0, 6].includes(new Date(day.date + 'T12:00:00').getDay()) ? 'stm-weekend' : ''} ${day.date === today ? 'stm-today' : ''}`} aria-current={day.date === today ? 'date' : undefined}><span>{Number(day.date.slice(-2))}</span><small>{weekdays[new Date(day.date + 'T12:00:00').getDay()]}</small>{showEvents && day.events.length > 0 && <abbr title={day.events.map(event => event.title).join('; ')} aria-label={day.events.map(event => event.title).join('; ')}>●</abbr>}</th>)}</tr></thead>
        <tbody>{showCoverage && <tr className="stm-coverage-row"><th scope="row" className="stm-person">Cobertura do setor<small>Toda a equipe</small></th>{days.map(day => <td key={day.date}><button type="button" className={`stm-coverage stm-${coverageReady && !coverageError ? day.coverage.status : 'unknown'}`} aria-label={`${dateLabel(day.date)}: ${coverageError || (!coverageReady ? 'Carregando cobertura' : coverageLabels[day.coverage.status])}`} title={coverageError || (!coverageReady ? 'Carregando cobertura' : coverageLabels[day.coverage.status])} onClick={() => onSelectCoverage(day.date)}>{!coverageReady || coverageError ? '?' : day.coverage.status === 'sufficient' ? '✓' : day.coverage.status === 'shortage' ? `−${day.coverage.missingMax}` : day.coverage.status === 'unknown' ? '?' : '—'}</button></td>)}</tr>}
          {rows.map(row => <tr key={row.key}><th scope="row" className="stm-person" title={row.name}><strong>{row.name}</strong><small>{row.departments.map(id => departments.find(department => department.id === id)?.name || id).join(' · ') || 'Sem setor'}</small></th>{row.cells.map(cell => {
            const summary = teamDaySummary(cell), selected = Boolean(selectedPerson) && selectedDate === cell.date && selectedPerson === row.userId;
            return <td key={cell.date} className={cell.date === today ? 'stm-today' : ''}><button type="button" aria-pressed={selected} title={`${row.name} · ${dateLabel(cell.date)}: ${summary.description}${summary.fixed ? ' · Dia fixado' : ''}`} aria-label={`${row.name}, ${dateLabel(cell.date)}: ${summary.description}${summary.fixed ? '. Dia fixado' : ''}`} className={`stm-cell stm-${summary.tone} ${selected ? 'stm-selected' : ''}`} onClick={() => onSelectCell(cell.date, row.userId, cell.absences.length && ['vacation', 'absence'].includes(summary.tone) ? 'absences' : 'schedules')}><span>{summary.code}{summary.partial && <sup title="Ausência parcial">A</sup>}{summary.fixed && <i aria-hidden="true">•</i>}</span>{showHours && summary.hours && <small>{summary.hours}</small>}</button></td>;
          })}</tr>)}
        </tbody>
      </table>
      {!rows.length && <p className="stm-empty">Nenhum colaborador encontrado. Confira os filtros do calendário.</p>}
    </div>
    <div className="stm-legend">{[['work','P · Presencial'],['remote','HO · Home office'],['off','F · Folga'],['holiday','FE · Feriado'],['vacation','V · Férias'],['absence','A · Ausência'],['empty','— · Sem registro']].map(([tone, label]) => <span key={tone}><i className={`stm-${tone}`}/>{label}</span>)}<span>• Dia fixado</span><span>2 reg. · Mais de uma marcação</span></div>
    <p className="stm-help">Ausências de dia inteiro aparecem sobre a marcação de trabalho. A sobrescrito indica ausência parcial. A cobertura considera intervalos e toda a equipe do setor, mesmo quando a grade está filtrada.</p>
  </section>;
}
