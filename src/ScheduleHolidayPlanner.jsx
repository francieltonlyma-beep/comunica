import { useState } from 'react';
import { holidayWorkTemplate, isWorking } from './scheduleDayRules.js';
import { isReplaceableSchedule } from './scheduleOptimizer.js';

const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100';
const button = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40';
const activeOn = (item, date) => (item.startDate || item.date || '') <= date && (item.endDate || item.date || item.startDate || '') >= date;

export default function ScheduleHolidayPlanner({ holidays, employees, rules, history = [], absences = [], startDate, assignments, onChange, disabled = false }) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const dates = [...new Set(holidays.map(item => item.date))].sort();
  const date = dates.includes(selected) ? selected : dates[0];
  if (!date) return null;
  const day = assignments[date] || {};
  const visible = employees.filter(user => String(user.name || '').toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')));
  const preserved = user => history.some(item => String(item.userId) === String(user.id) && activeOn(item, date) && !isReplaceableSchedule(item)) || absences.some(item => String(item.userId) === String(user.id) && activeOn(item, date));
  const setStatus = (users, status) => {
    const next = { ...day };
    for (const user of users.filter(user => !preserved(user))) {
      if (!status) delete next[user.id];
      else if (status === 'Folga') next[user.id] = { status: 'Folga' };
      else next[user.id] = { ...(isWorking(next[user.id]) ? next[user.id] : holidayWorkTemplate(user.id, date, rules, history, startDate)), status };
    }
    onChange({ ...assignments, [date]: next });
  };
  const patch = (userId, changes) => onChange({ ...assignments, [date]: { ...day, [userId]: { ...day[userId], ...changes } } });

  return <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4" aria-label="Escala individual dos feriados">
    <div><h5 className="text-sm font-bold text-amber-950">Quem trabalha em cada feriado?</h5><p className="mt-1 text-xs leading-5 text-slate-600">Defina somente as exceções deste planejamento. “Seguir escala normal” usa as regras da turma: {rules.holidaysCountAsRest === false ? 'o feriado é um dia normal de trabalho e distribuição de folgas.' : 'o feriado é descanso por padrão; você pode escolher quem trabalha.'} Ausências e marcações fixas são preservadas.</p></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Feriado<select className={field} disabled={disabled} value={date} onChange={event => setSelected(event.target.value)}>{dates.map(value => <option key={value} value={value}>{value.split('-').reverse().join('/')} · {[...new Set(holidays.filter(item => item.date === value).map(item => item.title || 'Feriado'))].join(' / ')}</option>)}</select></label><label className="text-xs font-bold text-slate-700">Buscar colaborador<input className={field} disabled={disabled} value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome entre os selecionados" /></label></div>
    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-slate-600">{visible.length} pessoa(s) visível(is)</span><button type="button" className={button} disabled={disabled || !visible.length} onClick={() => setStatus(visible, 'Presencial')}>Trabalho para os visíveis</button><button type="button" className={button} disabled={disabled || !visible.length} onClick={() => setStatus(visible, 'Folga')}>Folga para os visíveis</button><button type="button" className={button} disabled={disabled || !visible.length} onClick={() => setStatus(visible, '')}>Usar padrão nos visíveis</button></div>
    <div className="max-h-96 space-y-2 overflow-auto">{visible.map(user => {
      const item = day[user.id];
      const locked = preserved(user);
      return <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="grid items-end gap-3 sm:grid-cols-2"><div><strong className="block text-xs text-slate-900">{user.name}</strong>{locked && <p className="mt-1 text-[11px] text-slate-500">Ausência ou marcação fixa: revise no calendário.</p>}</div><label className="text-xs font-bold text-slate-600">Situação de {user.name}<select className={field} disabled={disabled || locked} value={item?.status || ''} onChange={event => setStatus([user], event.target.value)}><option value="">Seguir escala normal</option><option value="Presencial">Trabalha presencial</option><option value="Home Office">Trabalha em home office</option><option value="Folga">Folga neste feriado</option></select></label></div>{isWorking(item) && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Entrada','shiftStart'],['Saída','shiftEnd'],['Início do intervalo','breakStart'],['Fim do intervalo','breakEnd']].map(([label,key]) => <label key={key} className="text-xs font-bold text-slate-600">{label} de {user.name}<input className={field} type="time" disabled={disabled || locked} value={item[key] || ''} onChange={event => patch(user.id, { [key]: event.target.value })}/></label>)}</div>}</article>;
    })}{!visible.length && <p className="p-3 text-xs text-slate-500">Selecione os colaboradores da escala ou ajuste a busca.</p>}</div>
    <p className="text-[11px] leading-5 text-slate-600">As escolhas valem apenas para a data e a empresa deste planejamento. Ao alterar, gere uma nova prévia. A validação confere cobertura e limites de jornada.</p>
  </section>;
}
