import { explainScheduleRecord } from './scheduleExplanation.js';
import './ScheduleExplanation.css';

const labels = { applied: 'Aplicada', superseded: 'Substituída', ignored: 'Sem efeito', conflict: 'Conflito', constraint: 'Restrição' };
const resultText = value => `${value.status || 'Sem situação'}${value.shiftStart && value.shiftEnd ? ` · ${value.shiftStart}–${value.shiftEnd}` : ''}${value.extraHours ? ` · extra ${value.extraHours}h` : ''}`;

export default function ScheduleExplanation({ row, issues = [], disabled = false, onCorrect, onReviewRule, onReviewRules, onEditDay, onCoverage }) {
  const explanation = explainScheduleRecord(row);
  const rowIssues = issues.filter(issue => (issue.rowKey || issue.key) === row.key);
  return <details className="schedule-explanation">
    <summary>Por que esta escala?</summary>
    <div className="schedule-explanation-body">
      <p><strong>Resultado:</strong> {resultText(explanation.current)}{explanation.rulesVersion > 0 && <small>Versão das regras: {explanation.rulesVersion}</small>}</p>
      {explanation.missing && <p className="schedule-explanation-note">Origem anterior não registrada. As etapas disponíveis abaixo não reconstituem regras antigas.</p>}
      {explanation.reason && <p><strong>Motivo registrado:</strong> {explanation.reason}</p>}
      {explanation.changed && <p className="schedule-explanation-note">O resultado atual difere da última etapa registrada. Confira os ajustes deste dia antes de usar a origem como referência.</p>}
      {explanation.entries.length > 0 && <ol>{explanation.entries.map((entry, index) => <li key={index} className={`schedule-explanation-${entry.decision}`}>
        <div><strong>{entry.label}</strong><span>{labels[entry.decision]}</span></div>
        <p>{resultText(entry)}</p>{entry.detail && <p>{entry.detail}</p>}{entry.actorName && <small>{entry.actorName}{entry.at ? ` · ${new Date(entry.at).toLocaleString('pt-BR')}` : ''}</small>}
        {entry.ruleId && onReviewRule && <button type="button" disabled={disabled} onClick={() => onReviewRule(entry.ruleId)}>Revisar esta regra</button>}
      </li>)}</ol>}
      {explanation.omitted > 0 && <p className="schedule-explanation-note">{explanation.omitted} etapa(s) intermediária(s) não foram incluídas neste resumo. Revise o cadastro de regras para conferir todas as exceções.</p>}
      {explanation.conflicts.length > 0 && <p className="schedule-explanation-conflict" role="alert">Regras incompatíveis: {explanation.conflicts.join(' / ')}. O resultado precisa de revisão.</p>}
      {rowIssues.length > 0 && <ul className="schedule-explanation-issues">{rowIssues.map((issue, index) => <li key={index}><p>{issue.message}</p>{onCorrect && <button type="button" disabled={disabled} onClick={() => onCorrect(issue)}>Corrigir {issue.blocking ? 'erro' : 'aviso'}</button>}</li>)}</ul>}
      {(onEditDay || onCoverage || onReviewRules) && <div className="schedule-explanation-actions">{onEditDay && <button type="button" disabled={disabled} onClick={onEditDay}>Corrigir este dia</button>}{onReviewRules && <button type="button" disabled={disabled} onClick={onReviewRules}>Revisar turma e turno</button>}{onCoverage && <button type="button" disabled={disabled} onClick={onCoverage}>Ver cobertura do dia</button>}</div>}
      <p className="schedule-explanation-footnote">A origem descreve a decisão registrada na geração. Alterações nas regras só entram em vigor depois de revisar e gerar uma nova prévia.</p>
    </div>
  </details>;
}
