import { useState } from 'react';
import { ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { scheduleCalendarDates } from './scheduleCalendarModel.js';
import { proposalCalendarDays } from './scheduleProposalCalendar.js';
import './ScheduleProposalCalendar.css';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const fullDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
const coverageText = { gap: 'Falta cobertura', unknown: 'Conferir horários', covered: 'Cobertura atendida', none: 'Sem necessidade cadastrada' };

export default function ScheduleProposalCalendar({ rows, analysis, issues = [], selectedDate, onSelectDate, onOpenDay, disabled }) {
  const [employee, setEmployee] = useState('all');
  const people = [...new Map(rows.map(row => [String(row.userId), row.userName])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'pt-BR'));
  const activeEmployee = people.some(([id]) => id === employee) ? employee : 'all';
  const days = proposalCalendarDays(rows, analysis?.days, issues, activeEmployee);
  if (!days.length) return null;
  const byDate = new Map(days.map(day => [day.date, day]));
  const months = [...new Set(days.map(day => day.date.slice(0, 7)))];
  const month = months.includes(selectedDate?.slice(0, 7)) ? selectedDate.slice(0, 7) : months[0];
  const monthIndex = months.indexOf(month);
  const title = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const gapDays = days.filter(day => day.coverage === 'gap');
  const unknownDays = days.filter(day => day.coverage === 'unknown');
  const needsReview = gapDays.length ? gapDays : unknownDays;
  const nextGap = needsReview.find(day => day.date > selectedDate) || needsReview[0];
  const reviewLabel = gapDays.length ? `Conferir cobertura · ${gapDays.length} dia(s)` : unknownDays.length ? `Conferir horários · ${unknownDays.length} dia(s)` : days.some(day => day.coverage === 'covered') ? 'Cobertura atendida no período' : 'Sem necessidade cadastrada';
  const selected = byDate.get(selectedDate);
  return <section className="spc" aria-label="Calendário da simulação">
    <header className="spc-toolbar">
      <div><span className="spc-eyebrow">Prévia · ainda não publicada</span><h4>Confira a distribuição no calendário</h4><p>Selecione um dia para revisar os horários abaixo.</p></div>
      <label className="spc-filter">Visualizar colaborador<select value={activeEmployee} disabled={disabled} onChange={event => setEmployee(event.target.value)}><option value="all">Toda a equipe selecionada</option>{people.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    </header>
    <div className="spc-navigation"><div className="spc-month"><button type="button" disabled={disabled || monthIndex === 0} aria-label="Mês anterior da simulação" onClick={() => onSelectDate(days.find(day => day.date.startsWith(months[monthIndex - 1])).date)}><ChevronLeft size={18} /></button><strong aria-live="polite">{title}</strong><button type="button" disabled={disabled || monthIndex === months.length - 1} aria-label="Próximo mês da simulação" onClick={() => onSelectDate(days.find(day => day.date.startsWith(months[monthIndex + 1])).date)}><ChevronRight size={18} /></button></div><button className="spc-find-gap" type="button" disabled={disabled || !nextGap} onClick={() => nextGap && onSelectDate(nextGap.date)}>{reviewLabel}</button></div>
    <div className="spc-legend"><span><i className="spc-dot-work" />Trabalho</span><span><i className="spc-dot-off" />Folga</span><span><i className="spc-dot-absence" />Ausência / férias</span><span><LockKeyhole size={12} />Fixo ou preservado</span><span><i className="spc-dot-gap" />Falta cobertura</span><span><i className="spc-dot-unknown" />Conferir horários</span></div>
    <div className="spc-grid" aria-label={title}>
      {weekdays.map(day => <span className="spc-weekday" key={day}>{day}</span>)}
      {scheduleCalendarDates(`${month}-01`).map(date => {
        const day = byDate.get(date);
        if (!day || !date.startsWith(month)) return <div className="spc-empty" key={date} aria-hidden="true"><span>{Number(date.slice(-2))}</span></div>;
        const label = `${fullDate(date)}: ${day.working} em trabalho, ${day.off} de folga, ${day.absent} em ausência ou férias, ${day.fixed} fixos ou preservados. ${coverageText[day.coverage]}.${day.blocking ? ` ${day.blocking} bloqueio(s).` : ''}`;
        return <button key={date} type="button" disabled={disabled} aria-label={label} aria-pressed={date === selectedDate} className={`spc-day spc-${day.coverage} ${date === selectedDate ? 'spc-selected' : ''}`} onClick={() => { onSelectDate(date); onOpenDay?.(date); }}>
          <span className="spc-day-head"><strong>{Number(date.slice(-2))}</strong>{day.fixed > 0 && <span className="spc-fixed"><LockKeyhole size={11} /><span>{day.fixed}</span></span>}</span>
          {activeEmployee !== 'all' ? <span className="spc-person-status">{day.rows[0]?.status || 'Sem marcação'}</span> : <span className="spc-counts"><span className="spc-work">{day.working}<small> trabalho</small></span><span className="spc-off">{day.off}<small> folga</small></span>{day.absent > 0 && <span className="spc-absence">{day.absent}<small> ausência</small></span>}</span>}
          {day.holiday && <span className="spc-holiday">Feriado</span>}
          {day.coverage !== 'none' && <span className="spc-coverage"><span className="spc-coverage-dot" /><span>{coverageText[day.coverage]}</span></span>}
          {day.blocking > 0 && <span className="spc-blocking">!<small> Revisar</small></span>}
        </button>;
      })}
    </div>
    <p className="spc-note">Cobertura considera toda a equipe do setor, inclusive ao visualizar um colaborador. {activeEmployee !== 'all' && 'O filtro altera apenas o resumo dos dias; a edição abaixo continua mostrando a equipe.'}</p>
    <div className="spc-selection" role="status"><strong>{selectedDate ? fullDate(selectedDate) : 'Selecione um dia'}</strong>{selected && <span>{selected.working} em trabalho · {selected.off} de folga{selected.absent ? ` · ${selected.absent} em ausência / férias` : ''} · {coverageText[selected.coverage]}</span>}</div>
  </section>;
}
