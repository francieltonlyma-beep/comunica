import { useState } from 'react';
import { teamMonthRows, teamDaySummary } from './scheduleTeamMonth.js';
import { employeeMonthSummary } from './scheduleEmployeeManagement.js';
import { filterEmployeeDays } from './employeeManagementFilter.js';
import './ScheduleEmployeeManagement.css';

const duration = hours => `${Math.floor(Math.round(hours * 60) / 60)}h${String(Math.round(hours * 60) % 60).padStart(2, '0')}`;

export default function ScheduleEmployeeManagement({ days, employees, filters, getDepartments, onSelectDay }) {
  const [selected, setSelected] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sort, setSort] = useState('date');
  const rows = teamMonthRows(days, employees, { filters, getDepartments, showAbsences: true });
  const matchingPeople = rows.filter(person => `${person.name} ${person.role}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(personSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()));
  const row = matchingPeople.find(item => item.key === selected) || matchingPeople[0];
  const month = days[0]?.date.slice(0, 7) || '';
  const from = start.startsWith(month) ? start : '';
  const to = end.startsWith(month) ? end : '';
  const allDays = row ? employeeMonthSummary(row.cells).days : [];
  const visibleDays = filterEmployeeDays(allDays, { status, start: from, end: to, sort });
  const summary = employeeMonthSummary(visibleDays);
  const reviewCount = summary.days.filter(day => day.review).length;
  const clear = () => { setPersonSearch(''); setStatus('all'); setStart(''); setEnd(''); setSort('date'); };

  return <section className="sem" aria-label="Gestão do colaborador">
    <div className="sem-heading"><div><span className="sem-eyebrow">ESCALA PUBLICADA · {month}</span><h3>Gestão do colaborador</h3><p>Consulte a jornada prevista, folgas e ausências de cada pessoa. Os totais acompanham os filtros abaixo; não representam apuração de ponto.</p></div><span className="sem-count">{matchingPeople.length} pessoa(s) · {visibleDays.length} dia(s)</span></div>
    <div className="sem-filters" aria-label="Filtros da gestão do colaborador">
      <label>Buscar colaborador<input type="search" value={personSearch} onChange={event => setPersonSearch(event.target.value)} placeholder="Nome ou cargo" /></label>
      <label>Colaborador<select value={row?.key || ''} onChange={event => setSelected(event.target.value)} disabled={!matchingPeople.length}>{matchingPeople.length ? matchingPeople.map(person => <option key={person.key} value={person.key}>{person.name}{person.role ? ` · ${person.role}` : ''}</option>) : <option value="">Nenhuma pessoa encontrada</option>}</select></label>
      <label>Situação<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todas</option><option value="work">Trabalho</option><option value="off">Folga</option><option value="vacation">Férias</option><option value="absence">Ausência</option><option value="holiday">Feriado sem trabalho</option><option value="empty">Sem registro</option><option value="review">Precisa de revisão</option></select></label>
      <label>De<input type="date" value={from} min={days[0]?.date} max={days.at(-1)?.date} onChange={event => setStart(event.target.value)} /></label>
      <label>Até<input type="date" value={to} min={days[0]?.date} max={days.at(-1)?.date} onChange={event => setEnd(event.target.value)} /></label>
      <label>Ordenação<select value={sort} onChange={event => setSort(event.target.value)}><option value="date">Mais antigo primeiro</option><option value="recent">Mais recente primeiro</option></select></label>
      <button type="button" className="sem-clear" onClick={clear}>Limpar filtros</button>
    </div>
    {!row ? <p role="status" className="sem-empty">Nenhum colaborador nos filtros selecionados. Ajuste a busca ou o setor no calendário.</p> : <>
      <div className="sem-totals" aria-label="Resumo dos dias filtrados">{[['Horas previstas', duration(summary.hours)], ['Extras previstas (incluídas)', duration(summary.extra)], ['Dias de trabalho', summary.work], ['Folgas', summary.off], ['Férias', summary.vacation], ['Dias com ausência', summary.absence], ['Feriados sem trabalho', summary.holiday], ['Sem registro', summary.empty], ['Revisar', reviewCount]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <p className="sem-note">Ausências são exibidas, sem desconto automático das horas previstas. Jornadas sobrepostas ou com horários incompletos ficam fora da soma e aparecem em “Revisar”.</p>
      {!summary.days.length ? <p role="status" className="sem-empty">Nenhum dia corresponde aos filtros. Ajuste a situação ou o intervalo de datas.</p> : <div className="sem-scroll"><table><caption>{row.name} · {summary.days.length} dia(s) exibido(s)</caption><thead><tr><th>Dia</th><th>Situação e horários</th><th>Intervalo</th><th>Horas previstas</th><th>Extras incluídas</th><th>Detalhes</th></tr></thead><tbody>{summary.days.map(day => <tr key={day.date} className={day.review ? 'sem-review' : ''}><th scope="row">{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</th><td>{teamDaySummary(day).description}{day.review && <strong className="sem-review-label"> · Revisar</strong>}</td><td>{day.schedules.map((item, index) => <div key={item.id || index}>{item.breakStart && item.breakEnd ? `${item.breakStart}–${item.breakEnd}` : Number(item.breakMinutes) > 0 ? `${item.breakMinutes} min` : '—'}</div>)}</td><td>{day.review ? 'Revisar registros' : duration(day.hours)}</td><td>{day.review ? '—' : duration(day.extra)}</td><td><button type="button" className="sc-button" onClick={() => onSelectDay(day.date, row.userId)}>Ver dia</button></td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
