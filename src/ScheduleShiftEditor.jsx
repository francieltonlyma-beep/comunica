const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800';

export default function ScheduleShiftEditor({ shifts, groups, onChange }) {
  return <details className="rounded-xl border border-cyan-200 bg-white p-4" open>
    <summary className="cursor-pointer text-sm font-bold text-slate-800">1. Cadastro de turnos ({shifts.length})</summary>
    <p className="my-3 text-xs text-slate-500">Cadastre os horários uma vez e vincule cada turma ao seu turno. As exceções individuais continuam dentro da turma.</p>
    <div className="space-y-3">{shifts.map(shift => {
      const patch = changes => onChange(shifts.map(item => item.id === shift.id ? { ...item, ...changes } : item));
      const linked = groups.some(group => group.shiftId === shift.id);
      return <div key={shift.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
        <label className="text-xs text-slate-600">Nome do turno<input className={field} maxLength={80} value={shift.name} onChange={event => patch({ name: event.target.value })}/></label>
        {[['Entrada', 'shiftStart'], ['Saída', 'shiftEnd'], ['Início do intervalo', 'breakStart'], ['Fim do intervalo', 'breakEnd']].map(([label, key]) => <label key={key} className="text-xs text-slate-600">{label}<input type="time" className={field} value={shift[key]} onChange={event => patch({ [key]: event.target.value })}/></label>)}
        <button type="button" disabled={linked} title={linked ? 'Desvincule as turmas antes de remover este turno.' : ''} className="self-end rounded-lg border border-slate-200 px-3 py-2 text-xs text-rose-700 disabled:opacity-40" onClick={() => onChange(shifts.filter(item => item.id !== shift.id))}>{linked ? 'Turno em uso por turma' : 'Remover turno'}</button>
      </div>;
    })}</div>
    <button type="button" className="mt-3 rounded-lg bg-cyan-800 px-4 py-2 text-xs font-bold text-white" onClick={() => onChange([...shifts, { id: `shift-${crypto.randomUUID()}`, name: `Turno ${shifts.length + 1}`, shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00' }])}>+ Novo turno</button>
  </details>;
}
