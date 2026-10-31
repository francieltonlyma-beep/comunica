import { useState } from 'react';
import { coverageApprovalGaps } from './scheduleCoverageApproval.js';

export default function ScheduleCoverageApproval({ analysis, binding, canApprove, disabled, departments, onAuthorize }) {
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const gaps = coverageApprovalGaps(analysis);
  if (!gaps.length) return null;
  return <section className="sc-deficit-approval" aria-label="Exceção de cobertura">
    <h4>Publicar com déficit de cobertura</h4>
    <p>{gaps.length} faixa(s) continuam abaixo do mínimo. A autorização mantém os alertas visíveis e registra a decisão no histórico.</p>
    <ul>{gaps.slice(0, 20).map((gap, index) => <li key={index}>{gap.date.split('-').reverse().join('/')} · {departments.find(item => item.id === gap.department)?.name || gap.department} · {gap.start}–{gap.end}: {gap.available}/{gap.minimum} pessoas (faltam {gap.missing})</li>)}</ul>
    {gaps.length > 20 && <p>Mais {gaps.length - 20} faixa(s). Todas serão incluídas no registro da autorização.</p>}
    {!canApprove ? <p>Somente um administrador pode autorizar esta exceção.</p> : analysis.unknown ? <p role="alert">Existem horários incompletos ou dias sem funcionamento definido. Corrija essas pendências antes de autorizar.</p> : <>
      <label>Justificativa da decisão<textarea minLength={10} maxLength={1000} value={reason} disabled={disabled} onChange={event => { setReason(event.target.value); setAcknowledged(false); }} placeholder="Explique por que a operação poderá ocorrer abaixo do mínimo e qual medida será adotada."/></label>
      <label className="sc-deficit-check"><input type="checkbox" checked={acknowledged} disabled={disabled} onChange={event => setAcknowledged(event.target.checked)}/>Revisei todas as faixas e autorizo esta publicação abaixo do mínimo.</label>
      <button type="button" disabled={disabled || !acknowledged || reason.trim().length < 10} onClick={() => onAuthorize({ reason, binding })}>Autorizar e publicar com justificativa</button>
    </>}
  </section>;
}
