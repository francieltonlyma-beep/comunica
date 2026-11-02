import { useState } from 'react';
import { teamMonthRows, teamDaySummary } from './scheduleTeamMonth.js';
import { employeeMonthSummary } from './scheduleEmployeeManagement.js';
import './ScheduleEmployeeManagement.css';

export default function ScheduleEmployeeManagement({ days, employees, filters, getDepartments, onSelectDay }) {
  const [selected, setSelected] = useState('');
  const rows = teamMonthRows(days, employees, { filters, getDepartments, showAbsences: true });
  const row = rows.find(item => item.key === selected) || rows[0];
  const summary = row && employeeMonthSummary(row.cells);
  const duration = hours => `${Math.floor(Math.round(hours * 60) / 60)}h${String(Math.round(hours * 60) % 60).padStart(2, '0')}`;
  return <section className="sem" aria-label="Gestão do colaborador">
    <h3>Gestão do colaborador</h3>
    <p>Horas previstas na escala publicada, sem apuração de ponto. Ausências são exibidas para conferência e não descontadas automaticamente.</p>
    <label>Colaborador<select value={row?.key || ''} onChange={event => setSelected(event.target.value)}>{rows.map(person => <option key={person.key} value={person.key}>{person.name}</option>)}</select></label>
    {!row ? <p>Nenhum colaborador nos filtros selecionados.</p> : <>
      <div className="sem-totals">{[['Horas previstas', duration(summary.hours)], ['Extras previstas (incluídas)', duration(summary.extra)], ['Dias de trabalho', summary.work], ['Folgas', summary.off], ['Férias', summary.vacation], ['Dias com ausência', summary.absence], ['Feriados sem trabalho', summary.holiday], ['Sem registro', summary.empty]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <p>Totais do mês completo para a pessoa selecionada. Registros sobrepostos ou horários incompletos precisam de revisão; suas horas não entram no total.</p>
      <div className="sem-scroll"><table><caption>{row.name} · Detalhamento diário</caption><thead><tr><th>Dia</th><th>Situação e horários</th><th>Intervalo</th><th>Horas previstas</th><th>Extras incluídas</th><th>Detalhes</th></tr></thead><tbody>{summary.days.map(day => <tr key={day.date}><th>{new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</th><td>{teamDaySummary(day).description}</td><td>{day.schedules.map((item, index) => <div key={item.id || index}>{item.breakStart && item.breakEnd ? `${item.breakStart}–${item.breakEnd}` : Number(item.breakMinutes) > 0 ? `${item.breakMinutes} min` : '—'}</div>)}</td><td>{day.review ? 'Revisar registros' : duration(day.hours)}</td><td>{duration(day.extra)}</td><td><button type="button" className="sc-button" onClick={() => onSelectDay(day.date, row.userId)}>Ver dia</button></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
