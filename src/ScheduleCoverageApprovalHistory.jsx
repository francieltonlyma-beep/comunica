import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function ScheduleCoverageApprovalHistory({ db, path, departments }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState({ path: '', rows: [], error: '' });
  useEffect(() => {
    if (!open || !db || !path) return;
    return onSnapshot(query(collection(db, path), orderBy('approvedAt', 'desc'), limit(50)),
      snapshot => setResult({ path, rows: snapshot.docs.map(item => ({ id: item.id, ...item.data() })), error: '' }),
      () => setResult({ path, rows: [], error: 'Não foi possível carregar as autorizações. Feche e abra novamente para tentar.' }));
  }, [db, path, open]);
  return <section className="sc-deficit-history">
    <button type="button" className="sc-button" aria-expanded={open} onClick={() => setOpen(value => !value)}>Histórico de autorizações de cobertura</button>
    {open && (result.path !== path ? <p role="status">Carregando autorizações...</p> : result.error ? <p role="alert">{result.error}</p> : !result.rows.length ? <p>Nenhuma publicação com déficit autorizada.</p> : <div>{result.rows.map(item => <details key={item.id}>
      <summary>{item.approvedAt?.toDate?.().toLocaleString('pt-BR') || 'Data em confirmação'} · {item.actorName} · {item.gaps.length} faixa(s)</summary>
      <p>{item.reason}</p><p>Registro histórico da publicação; alterações posteriores precisam de nova revisão.</p>
      <ul>{item.gaps.map((gap, index) => <li key={index}>{gap.date.split('-').reverse().join('/')} · {departments.find(dept => dept.id === gap.department)?.name || gap.department} · {gap.start}–{gap.end}: {gap.available}/{gap.minimum} (faltavam {gap.missing})</li>)}</ul>
    </details>)}</div>)}
  </section>;
}
