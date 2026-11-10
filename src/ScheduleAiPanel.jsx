import { useRef, useState } from 'react';
import { buildScheduleAiRequest, scheduleAiSystemInstruction, validateScheduleAiResponse } from './scheduleAiAdvisor.js';
import './ScheduleAiPanel.css';

export default function ScheduleAiPanel({ rows, requirements, context, inputBinding, disabled, onAnalyze, onApply }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState(null);
  const inFlight = useRef(false);
  const binding = advice ? JSON.stringify(rows) : '';
  const stale = advice && (advice.binding !== binding || advice.inputBinding !== inputBinding);
  const analyze = async () => {
    if (disabled || inFlight.current) return;
    setError(''); setAdvice(null);
    let request;
    try { request = buildScheduleAiRequest(rows, requirements, context); }
    catch (problem) { setError(problem.message); return; }
    inFlight.current = true; setBusy(true);
    try {
      const raw = await onAnalyze(request.prompt, scheduleAiSystemInstruction);
      const result = validateScheduleAiResponse(raw, request, rows, requirements, context);
      setAdvice({ ...result, raw, request, binding: request.binding, inputBinding });
    } catch (problem) { setError(problem.message || 'Não foi possível analisar a escala. Nenhum dia foi alterado.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const apply = () => {
    if (!advice || stale || disabled || busy) return;
    try {
      const checked = validateScheduleAiResponse(advice.raw, advice.request, rows, requirements, context);
      if (checked.rows) onApply(checked);
      setAdvice(null); setError('');
    } catch (problem) { setError(problem.message); }
  };
  return <section className="schedule-ai" aria-label="Assistente de IA da escala">
    <div className="schedule-ai-heading"><div><h4>Revisão da escala com IA</h4><p>A IA propõe trocas em uma semana da prévia, com até 40 pessoas e turnos diurnos. As sugestões passam pela validação de cobertura, jornada, descanso e dias fixos.</p></div><button type="button" disabled={disabled || busy || !rows.length} onClick={analyze}>{busy ? 'Analisando a semana...' : 'Revisar semana com IA'}</button></div>
    <p className="schedule-ai-note">A análise usa o serviço de IA da plataforma e pode consumir créditos. Os nomes não são enviados. Você revisa antes de aplicar; a publicação continua sendo uma ação separada.</p>
    {busy && <p role="status" aria-live="polite">Aguarde: procurando alternativas e verificando as regras da prévia...</p>}
    {error && <p className="schedule-ai-error" role="alert">{error}</p>}
    {advice && <div className="schedule-ai-result"><strong>Semana de {advice.week?.split('-').reverse().join('/')}</strong><p>{advice.summary}</p>
      {stale ? <p role="alert">A escala ou as regras mudaram. Faça uma nova análise para aplicar sugestões.</p> : advice.rows ? <>
        <p>{advice.swaps.length} troca(s) passaram na validação. Cobertura: {advice.before.coveredPercent ?? '—'}% → {advice.after.coveredPercent ?? '—'}%.</p>
        <ul>{advice.swaps.map((swap, index) => { const person = rows.find(row => String(row.userId) === advice.request.people[swap.person]); return <li key={index}>{person?.userName || swap.person}: trabalho de {swap.from.split('-').reverse().join('/')} para {swap.to.split('-').reverse().join('/')}; folga no dia de origem.</li>; })}</ul>
        <button type="button" disabled={disabled || busy} onClick={apply}>Aplicar sugestões na prévia</button>
      </> : <p>Nenhuma troca foi aplicada. Revise o diagnóstico antes de ajustar as regras.</p>}
    </div>}
  </section>;
}

