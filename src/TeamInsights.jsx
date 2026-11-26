import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';

export function Managers({ db, company, departments, active, today }) {
  const [status,setStatus] = useState('');
  const [busy,setBusy] = useState(false);
  async function assign(unit,id) {
    const name = active.find(person => person.id === id)?.name || 'Sem gerente';
    if (!window.confirm(`Confirmar ${name} em ${unit.name} a partir de hoje? As atividades já atribuídas preservam o responsável.`)) return;
    setBusy(true);
    const ref = doc(db,'artifacts','comunica-salvador','public','data','companies',company,'departments',unit.id);
    try {
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists() || (snapshot.data().managerId || '') !== (unit.managerId || '')) throw Error();
        tx.update(ref,{managerId:id, managerSince:today});
      });
      setStatus('Gerência atualizada.');
    } catch { setStatus('Não foi possível salvar. Confira sua permissão e o gerente atual da unidade.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 rounded-2xl border bg-white p-5"><h3 className="text-lg font-bold">Gerentes por loja ou setor</h3>{departments.map(unit => <label key={unit.id} className="grid gap-2 border-b py-3 sm:grid-cols-2"><span><strong>{unit.name}</strong>{unit.managerId && unit.managerSince && <small className="block">Desde {unit.managerSince.split('-').reverse().join('/')}</small>}</span><select disabled={busy} className="rounded-lg border p-2" value={unit.managerId || ''} onChange={e => assign(unit,e.target.value)}><option value="">Sem gerente</option>{unit.managerId && !active.some(p => p.id === unit.managerId) && <option value={unit.managerId}>Vínculo inativo</option>}{active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>)}<p role="status">{status}</p></section>;
}

export function TeamCharts({ employees, rows, departments, inUnit, select }) {
  const [groupBy,setGroupBy] = useState('unit');
  const counts = new Map();
  for (const row of rows) {
    if (!['ontime','late'].includes(row.status)) continue;
    const month = row.day.slice(0,7);
    const total = counts.get(month) || {onTime:0, total:0};
    total.total++;
    if (row.status === 'ontime') total.onTime++;
    counts.set(month,total);
  }
  const months = [...counts.keys()].sort();
  const monthIndex = id => Number(id.slice(0,4))*12 + Number(id.slice(5));
  const points = months.map(id => {
    const percent = Math.round(100 * counts.get(id).onTime / counts.get(id).total);
    const span = monthIndex(months.at(-1)) - monthIndex(months[0]);
    return {id, percent, x:span ? 16 + 288*(monthIndex(id)-monthIndex(months[0]))/span : 160, y:90-0.8*percent};
  });
  const groups = groupBy === 'manager' ? [...new Set(rows.map(row => row.record.manager).filter(Boolean))].map(id => ({id,name:employees.find(p => p.id === id)?.name || id,total:rows.filter(row => row.record.manager === id).length})) : departments.map(unit => ({...unit, total:rows.filter(row => inUnit(row.record,unit.id)).length}));
  const max = Math.max(1,...groups.map(g => g.total));
  return <div className="grid gap-4 lg:grid-cols-2">
    <section className="rounded-xl border p-4"><h4 className="font-bold">Entregas no prazo por mês de conclusão</h4>{points.length ? <>
      <svg viewBox="0 0 320 100" className="h-36 w-full" aria-label="Percentual de entregas no prazo" role="img"><path d="M12 10V90H310" fill="none" stroke="#cbd5e1"/><polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points.map(p => p.x+','+p.y).join(' ')} />{points.map(p => <circle key={p.id} cx={p.x} cy={p.y} r="5" fill="#1d4ed8" onClick={() => select({kind:'month',id:p.id,label:p.id})}><title>{p.id} · {p.percent}%</title></circle>)}</svg>
      <div className="flex flex-wrap gap-2">{points.map(p => <button key={p.id} className="rounded border px-2" onClick={() => select({kind:'month',id:p.id,label:p.id})}>{p.id.split('-').reverse().join('/')} · {p.percent}%</button>)}</div></> : <p className="py-6">Sem conclusões com prazo no período.</p>}</section>
    <section className="rounded-xl border p-4"><h4 className="font-bold">Volume de atividades</h4><label>Agrupar por <select className="rounded border p-1" value={groupBy} onChange={e => setGroupBy(e.target.value)}><option value="unit">Loja ou setor</option><option value="manager">Gerente designado</option></select></label><div className="flex items-end gap-3 overflow-x-auto pt-4">{groups.map(g => <button key={g.id} className="grid min-w-16 justify-items-center gap-1" onClick={() => select({kind:groupBy,id:g.id,label:g.name})}><strong>{g.total}</strong><span className="w-8 rounded-t bg-blue-700" style={{height:2+96*g.total/max}}/><span className="text-xs">{g.name}</span></button>)}</div><small>Atividades anteriores ao vínculo de gerência aparecem nos setores atuais dos responsáveis.</small></section>
  </div>;
}
