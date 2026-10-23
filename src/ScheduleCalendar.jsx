import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Maximize2, Minimize2, Plus, Search, SlidersHorizontal, X, Trash2, LoaderCircle, Clock, Users, CalendarCheck, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { calendarRecordsForDay, scheduleCalendarDates, scheduleTone, shiftCalendarPeriod } from './scheduleCalendarModel.js';
import { coverageForDay } from './scheduleCoverage.js';
import { CoverageRequirementEditor, DayCoverage } from './ScheduleCoveragePanel.jsx';
import './ScheduleCalendar.css';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const shortDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const longDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const toneNames = { work: 'Presencial', remote: 'Home office', off: 'Folga', vacation: 'Férias', absence: 'Afastamento' };

export default function ScheduleCalendar({
  today, selectedDate, onSelectDate, schedules, absences, events, employees, departments, getDepartments,
  currentUser, canManage, canWrite, deletingScheduleId, onDeleteSchedule, onDeleteAbsence, onDeleteEvent,
  onPlan, onAbsence, onEvent, onPresence, presence = [], modalOpen, formatDuration,
  coverageRequirements = [], coverageReady = true, coverageError = '', canConfigureCoverage = false, onSaveCoverage,
}) {
  const [anchor, setAnchor] = useState(selectedDate || today);
  const [view, setView] = useState('month');
  const [fullscreen, setFullscreen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [department, setDepartment] = useState('all');
  const [employee, setEmployee] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showEvents, setShowEvents] = useState(false);
  const [showAbsences, setShowAbsences] = useState(true);
  const [dayTab, setDayTab] = useState('schedules');
  const [showCoverage, setShowCoverage] = useState(true);
  const [needsOpen, setNeedsOpen] = useState(false);
  const shellRef = useRef(null);
  const expandRef = useRef(null);
  const previousFocus = useRef(null);
  const modalOpenRef = useRef(modalOpen);
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    expandRef.current?.focus();
    const onKey = event => {
      if (modalOpenRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setFullscreen(false);
      }
      if (event.key === 'Tab') {
        const focusable = [...(shellRef.current?.querySelectorAll('button:not(:disabled), input, select, summary, [tabindex="0"]') || [])]
          .filter(element => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!shellRef.current?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      requestAnimationFrame(() => {
        if (previousFocus.current?.isConnected) previousFocus.current.focus();
        else document.querySelector('.sc-calendar button[aria-label="Abrir calendário em tela cheia"]')?.focus();
      });
    };
  }, [fullscreen]);

  const data = { schedules, absences, events, employees, getDepartments };
  const filters = { department, employee, status, search };
  const dates = scheduleCalendarDates(anchor, view);
  const days = dates.map(date => ({ ...calendarRecordsForDay(date, data, filters), coverage: coverageForDay(date, coverageRequirements, data, department) }));
  const activeCoverage = coverageForDay(selectedDate, coverageRequirements, data, department);
  const activeDay = calendarRecordsForDay(selectedDate, data, filters);
  const month = anchor.slice(0, 7);
  const eligibleEmployees = employees.filter(user => department === 'all' || getDepartments(user).includes(department))
    .slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const statuses = [...new Set(['Presencial', 'Home Office', 'Folga', 'Férias', ...schedules.map(item => item.status).filter(Boolean)])];
  const hasFilters = department !== 'all' || employee !== 'all' || status !== 'all' || search.trim();
  const title = view === 'month'
    ? new Date(`${anchor}T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : `${shortDate(dates[0])} – ${shortDate(dates[6])} · ${anchor.slice(0, 4)}`;
  const selectedCounts = activeDay.schedules.reduce((counts, item) => {
    const tone = scheduleTone(item.status);
    counts[tone] = (counts[tone] || 0) + 1;
    return counts;
  }, {});
  const chooseDate = date => {
    onSelectDate(date);
    setDetailsOpen(true);
    if (date.slice(0, 7) !== month) setAnchor(date);
    if (window.innerWidth <= 1100) requestAnimationFrame(() => shellRef.current?.querySelector('.sc-day-panel')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  const navigate = direction => {
    const next = shiftCalendarPeriod(anchor, direction, view);
    setAnchor(next);
    onSelectDate(next);
  };
  const clearFilters = () => { setDepartment('all'); setEmployee('all'); setStatus('all'); setSearch(''); };
  const openEvent = holiday => {
    setShowEvents(true);
    setDayTab('events');
    onEvent(holiday);
  };
  const showDayCategory = category => {
    setDayTab(category);
    if (category === 'events') setShowEvents(true);
    if (category === 'absences') setShowAbsences(true);
  };

  const calendar = (
    <section ref={shellRef} data-tour="scale" className={`sc-calendar ${fullscreen ? 'sc-fullscreen' : ''}`}
      role={fullscreen ? 'dialog' : undefined} aria-modal={fullscreen && !modalOpen ? true : undefined} aria-label="Calendário de escalas">
      <header className="sc-header">
        <div className="sc-heading">
          <span className="sc-heading-icon"><CalendarDays size={24} /></span>
          <div><span className="sc-eyebrow">PLANEJAMENTO DA EQUIPE</span><h2>Calendário de escalas</h2><p>Selecione um dia para consultar e organizar a equipe.</p></div>
        </div>
        <div className="sc-header-actions">
          {canManage && canWrite && <button type="button" className="sc-primary" onClick={onPlan}><Plus size={16} /> Planejar escala</button>}
          <button type="button" className="sc-button" aria-expanded={needsOpen} onClick={() => setNeedsOpen(value => !value)}><Users size={16} /> Necessidade</button>
          <button type="button" ref={expandRef} className="sc-button" onClick={() => {
            previousFocus.current = expandRef.current;
            setFullscreen(value => !value);
          }} aria-label={fullscreen ? 'Sair da tela cheia' : 'Abrir calendário em tela cheia'}>
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}<span>{fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</span>
          </button>
        </div>
      </header>

      {needsOpen && <CoverageRequirementEditor requirements={coverageRequirements} departments={departments} canConfigure={canConfigureCoverage && canWrite} onSave={onSaveCoverage} defaultDepartment={department} ready={coverageReady} error={coverageError} />}

      <div className="sc-toolbar">
        <div className="sc-period">
          <div className="sc-arrows"><button type="button" onClick={() => navigate(-1)} aria-label={view === 'month' ? 'Mês anterior' : 'Semana anterior'}><ChevronLeft size={19} /></button>
            <button type="button" onClick={() => navigate(1)} aria-label={view === 'month' ? 'Próximo mês' : 'Próxima semana'}><ChevronRight size={19} /></button></div>
          <h3 aria-live="polite">{title}</h3>
          <button type="button" className="sc-button sc-today" onClick={() => { setAnchor(today); onSelectDate(today); }}>Hoje</button>
        </div>
        <div className="sc-view-tools">
          <div className="sc-segment" aria-label="Visualização do calendário">
            <button type="button" aria-pressed={view === 'month'} onClick={() => { setView('month'); setAnchor(selectedDate); }}>Mês</button>
            <button type="button" aria-pressed={view === 'week'} onClick={() => { setView('week'); setAnchor(selectedDate); }}>Semana</button>
          </div>
          <button type="button" className={`sc-button ${hasFilters ? 'sc-filter-active' : ''}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={16} /> Filtros{hasFilters ? ' •' : ''}</button>
          <button type="button" className="sc-button sc-detail-toggle" aria-expanded={detailsOpen} aria-label={detailsOpen ? 'Ocultar detalhes do dia' : 'Mostrar detalhes do dia'} onClick={() => setDetailsOpen(value => !value)}>{detailsOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}</button>
        </div>
      </div>

      {filtersOpen && <div className="sc-filters">
        <label>Setor<select value={department} onChange={event => { setDepartment(event.target.value); setEmployee('all'); }}>
          <option value="all">Todos os setores</option>{departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Colaborador<select value={employee} onChange={event => setEmployee(event.target.value)}>
          <option value="all">Todos os colaboradores</option>{eligibleEmployees.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
        <label>Situação da escala<select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">Todas as situações</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Buscar pessoa<div className="sc-search"><Search size={15} /><input value={search} type="search" placeholder="Nome ou cargo" onChange={event => setSearch(event.target.value)} /></div></label>
        {hasFilters && <button type="button" className="sc-link" onClick={clearFilters}>Limpar filtros</button>}
      </div>}

      <div className="sc-layer-bar">
        <div className="sc-legend">{Object.entries(toneNames).slice(0, 4).map(([tone, name]) => <span key={tone}><i className={`sc-dot sc-${tone}`} />{name}</span>)}</div>
        <div className="sc-layers"><label><input type="checkbox" checked={showCoverage} onChange={event => setShowCoverage(event.target.checked)} />Cobertura</label><span>Exibir também:</span>
          <label><input type="checkbox" checked={showAbsences} onChange={event => setShowAbsences(event.target.checked)} />Ausências</label>
          <label><input type="checkbox" checked={showEvents} onChange={event => setShowEvents(event.target.checked)} />Eventos e feriados</label>
        </div>
      </div>
      {showCoverage && <div className="sc-coverage-overview">
        <span className="sc-eyebrow">COBERTURA DA ESCALA PLANEJADA</span>
        {coverageError ? <span className="sc-coverage-warning" role="alert">{coverageError}</span> : !coverageReady ? <span role="status">Carregando necessidades...</span> : !coverageRequirements.length ? <span>Defina o mínimo de pessoas para destacar os horários com falta de equipe.</span> : <><span className="sc-sufficient-text">● Suficiente</span><span className="sc-shortage-text">● Falta de equipe</span><span className="sc-coverage-warning">● Dados a revisar</span><span>Usa toda a equipe do setor, mesmo com filtros por pessoa.</span></>}
        {coverageReady && coverageRequirements.length > 0 && <button type="button" className="sc-link" onClick={() => { setDetailsOpen(true); setDayTab('coverage'); }}>Ver cobertura do dia</button>}
      </div>}
      {hasFilters && <div className="sc-filter-note">Visualização filtrada{department !== 'all' ? ` · ${departments.find(item => item.id === department)?.name || department}` : ''}{employee !== 'all' ? ` · ${employees.find(item => String(item.id) === String(employee))?.name || ''}` : ''}{status !== 'all' ? ` · ${status}` : ''}{search.trim() ? ` · “${search.trim()}”` : ''}<button type="button" onClick={clearFilters}>Limpar</button></div>}

      <div className={`sc-workspace ${detailsOpen ? 'sc-with-details' : ''}`}>
        <div className="sc-grid-area">
          <div className="sc-grid-scroll" tabIndex={0} aria-label="Grade do calendário; role horizontalmente em telas pequenas">
            <div className={`sc-grid sc-${view}-view`}>
              {weekdays.map(day => <div key={day} className="sc-weekday">{day}</div>)}
              {days.map(day => {
                const selected = selectedDate === day.date;
                const outside = view === 'month' && day.date.slice(0, 7) !== month;
                const groups = Object.entries(day.schedules.reduce((result, item) => { const tone = scheduleTone(item.status); result[tone] = (result[tone] || 0) + 1; return result; }, {})).sort(([a], [b]) => Object.keys(toneNames).indexOf(a) - Object.keys(toneNames).indexOf(b));
                const shown = view === 'week' ? 7 : 2;
                const noData = !day.schedules.length && !(showAbsences && day.absences.length) && !(showEvents && day.events.length);
                return <button type="button" key={day.date} onClick={() => chooseDate(day.date)}
                  aria-pressed={selected} aria-current={day.date === today ? 'date' : undefined}
                  aria-label={`${longDate(day.date)}: ${day.schedules.length} registros de escala${showAbsences ? `, ${day.absences.length} ausências` : ''}${showEvents ? `, ${day.events.length} eventos` : ''}`}
                  className={`sc-day ${outside ? 'sc-outside' : ''} ${selected ? 'sc-selected' : ''} ${day.date === today ? 'sc-is-today' : ''}`}>
                  <span className="sc-day-top"><span className="sc-day-number">{Number(day.date.slice(-2))}</span>{day.date === today && <span className="sc-today-label">Hoje</span>}</span>
                  {showCoverage && coverageReady && day.coverage.status !== 'none' && <span className={`sc-coverage-badge sc-coverage-${day.coverage.status}`} title={day.coverage.status === 'shortage' ? `Faltam até ${day.coverage.missingMax} pessoas em uma faixa do dia` : day.coverage.status === 'unknown' ? 'Horários incompletos: revise a cobertura' : 'Mínimo atendido em todas as faixas configuradas'}><span className="sc-coverage-wide">{day.coverage.status === 'shortage' ? `Faltam até ${day.coverage.missingMax}` : day.coverage.status === 'unknown' ? 'Revisar horários' : 'Suficiente'}</span><span className="sc-coverage-compact">{day.coverage.status === 'shortage' ? `−${day.coverage.missingMax}` : day.coverage.status === 'unknown' ? '?' : '✓'}</span></span>}
                  <span className="sc-day-groups">{groups.map(([tone, count]) => <span key={tone} className={`sc-count sc-${tone}`} title={`${count} · ${toneNames[tone]}`}><i />{count}<span>{toneNames[tone]}</span></span>)}</span>
                  <span className="sc-mobile-markers">{showAbsences && day.absences.length > 0 && <span className="sc-count sc-absence"><Clock size={9} />{day.absences.length}</span>}{showEvents && day.events.length > 0 && <span className="sc-count sc-event"><CalendarCheck size={9} />{day.events.length}</span>}</span>
                  <span className="sc-day-entries">
                    {day.schedules.slice(0, shown).map(item => <span className={`sc-entry sc-${scheduleTone(item.status)}`} key={item.id}><i /> <span>{item.userName}</span>{view === 'week' && <small>{item.shiftStart || item.status}</small>}</span>)}
                    {day.schedules.length > shown && <span className="sc-more">+{day.schedules.length - shown} na escala</span>}
                    {showAbsences && day.absences.length > 0 && <span className="sc-entry sc-absence"><Clock size={11} />{day.absences.length} ausência{day.absences.length > 1 ? 's' : ''}</span>}
                    {showEvents && day.events.slice(0, 1).map(item => <span key={item.id} className="sc-entry sc-event"><CalendarCheck size={11} /><span>{item.title}</span></span>)}
                    {showEvents && day.events.length > 1 && <span className="sc-more">+{day.events.length - 1} evento(s)</span>}
                    {noData && !outside && <span className="sc-day-empty">{hasFilters ? 'Sem resultados' : 'Sem registros'}</span>}
                  </span>
                </button>;
              })}
            </div>
          </div>
          <footer className="sc-grid-footer"><span><span className="sc-dot sc-today-dot" /> Hoje</span><span>Clique em um dia para ver os detalhes e planejar.</span></footer>
        </div>

        {detailsOpen && <aside className="sc-day-panel" aria-label="Detalhes do dia selecionado">
          <div className="sc-panel-heading"><div><span className="sc-eyebrow">DIA SELECIONADO</span><h3>{longDate(selectedDate)}</h3></div><button type="button" className="sc-icon-button" onClick={() => setDetailsOpen(false)} aria-label="Fechar detalhes do dia"><X size={18} /></button></div>
          <div className="sc-day-summary">{Object.entries(selectedCounts).map(([tone, count]) => <span className={`sc-count sc-${tone}`} key={tone}>{count} {toneNames[tone]}</span>)}{!activeDay.schedules.length && <span className="sc-muted">Nenhuma escala{hasFilters ? ' neste filtro' : ' planejada'}.</span>}</div>
          {canWrite && <div className="sc-day-actions">
            {canManage && <button type="button" className="sc-primary" onClick={onPlan}><Plus size={15} /> Planejar este dia</button>}
            <button type="button" className="sc-button" onClick={onAbsence}>Agendar ausência</button>
            {selectedDate === today && <button type="button" className="sc-button" onClick={() => onPresence(selectedDate)}>Atualizar presença</button>}
            {currentUser.isAdmin && <><button type="button" className="sc-button" onClick={() => openEvent(false)}>Criar evento</button><button type="button" className="sc-button" onClick={() => openEvent(true)}>Marcar feriado</button></>}
          </div>}
          <div className="sc-day-tabs">
            {[['schedules', 'Escala', activeDay.schedules.length], ['coverage', 'Cobertura', activeCoverage.rules.length], ['absences', 'Ausências', activeDay.absences.length], ['events', 'Eventos', activeDay.events.length]].map(([key, label, count]) =>
              <button type="button" key={key} aria-pressed={dayTab === key} onClick={() => showDayCategory(key)}>{label}<span>{count}</span></button>)}
          </div>
          <div className="sc-records">
            {dayTab === 'coverage' && <DayCoverage coverage={activeCoverage} departments={departments} ready={coverageReady} error={coverageError} />}
            {dayTab === 'schedules' && (activeDay.schedules.length ? activeDay.schedules.map(item => <article key={item.id} className={`sc-record sc-${scheduleTone(item.status)}`}>
              <div className="sc-record-title"><strong>{item.userName}</strong>{canManage && canWrite && <button type="button" disabled={Boolean(deletingScheduleId)} className="sc-icon-button" onClick={() => onDeleteSchedule(item)} aria-label={`Excluir escala de ${item.userName}`} title="Excluir esta escala e todo o período vinculado">{deletingScheduleId === item.id ? <LoaderCircle size={15} className="sc-spin" /> : <Trash2 size={15} />}</button>}</div>
              <span className="sc-record-status">{item.status}</span>
              <p>{item.shiftStart && item.shiftEnd ? `${item.shiftStart} – ${item.shiftEnd}` : item.shift || 'Integral'}{Number(item.plannedHours) > 0 ? ` · ${formatDuration(item.plannedHours)}h` : ''}</p>
              {Number(item.extraHours) > 0 && <p>Extra: {formatDuration(item.extraHours)}h</p>}
              {(item.breakStart && item.breakEnd) ? <p>Intervalo: {item.breakStart} – {item.breakEnd}</p> : Number(item.breakMinutes) > 0 && <p>Intervalo: {formatDuration(Number(item.breakMinutes) / 60)}h</p>}
              {item.startDate !== item.endDate && <p>Período: {shortDate(item.startDate)} – {shortDate(item.endDate)}</p>}
              {item.ruleReason && <p>{item.ruleGroupName ? `${item.ruleGroupName} · ` : ''}{item.ruleReason}</p>}
              {item.notes && <p>{item.notes}</p>}
            </article>) : <div className="sc-empty"><Users size={27} /><strong>{hasFilters ? 'Nenhum resultado' : 'Dia sem escala planejada'}</strong><p>{hasFilters ? 'Ajuste os filtros para ver outros registros.' : 'Use “Planejar este dia” para organizar a equipe.'}</p></div>)}
            {dayTab === 'absences' && (activeDay.absences.length ? activeDay.absences.map(item => <article className="sc-record sc-absence" key={item.id}>
              <div className="sc-record-title"><strong>{item.userName}</strong>{canWrite && (currentUser.isAdmin || String(item.userId) === String(currentUser.id)) && <button type="button" className="sc-icon-button" onClick={() => onDeleteAbsence(item.id, item.userId)} aria-label={`Remover ausência de ${item.userName}`}><Trash2 size={15} /></button>}</div>
              <p>{item.startTime} – {item.endTime}</p><p>{item.reason}</p>
            </article>) : <p className="sc-muted">Nenhuma ausência neste dia{hasFilters ? ' para os filtros selecionados' : ''}.</p>)}
            {dayTab === 'events' && (activeDay.events.length ? activeDay.events.map(item => <article className="sc-record sc-event" key={item.id}>
              <div className="sc-record-title"><strong>{item.title}</strong>{canWrite && currentUser.isAdmin && <button type="button" className="sc-icon-button" onClick={() => onDeleteEvent(item.id)} aria-label={`Cancelar evento ${item.title}`}><Trash2 size={15} /></button>}</div>
              <p>{item.location}</p><p>{item.description}</p>
            </article>) : <p className="sc-muted">Nenhum evento neste dia.</p>)}
          </div>
          {selectedDate === today && <details className="sc-presence"><summary>Presença de hoje <span>{presence.length}</span></summary>
            {presence.filter(user => (department === 'all' || getDepartments(user).includes(department)) && (employee === 'all' || String(user.id) === String(employee)) && (!search.trim() || user.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))).map(user => <div key={user.id}><span>{user.name}</span><strong>{user.currentStatus}</strong></div>)}
          </details>}
        </aside>}
      </div>
    </section>
  );
  return fullscreen ? createPortal(calendar, document.body) : calendar;
}
