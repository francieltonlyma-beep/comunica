import { CAREER_STAGES, careerDateMs, careerFitScore } from './careerTriage.js';

const actionClass = 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-slate-50 disabled:opacity-50';

export default function CareerCandidateCard({
  application, title, retentionLabel, expiring, expired, comparisonSelected, comparisonFull, onCompare,
  refreshingFit, analyzing, vacancy, onRefreshFit, onDownload, onAssessment, onAcknowledge,
  onExtend, onStageChange, onAdvance, onInterview, onReject, onAdmission, stageAge,
}) {
  const stage = CAREER_STAGES.find(item => item.id === application.status) || CAREER_STAGES[0];
  const fit = careerFitScore(application.fit?.percentage);
  const isRejected = stage.id === 'rejected';
  const canAssess = Boolean(vacancy) && !isRejected;
  const assessmentStale = application.aiAssessment && vacancy
    && (careerDateMs(vacancy.updatedAt || vacancy.createdAt) > careerDateMs(application.aiAssessmentVacancyUpdatedAt)
      || careerDateMs(application.candidateUpdatedAt) > careerDateMs(application.aiAssessmentAt));

  return (
    <article id={`career-application-${application.id}`} tabIndex={-1} className="min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-blue-600">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h5 className="break-words text-base font-extrabold text-slate-900">{application.name}</h5>
          <p className="mt-0.5 break-words text-xs text-slate-600">{title} · {application.city || 'Cidade não informada'}</p>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 has-[:disabled]:text-slate-500">
          <input type="checkbox" checked={comparisonSelected} disabled={!comparisonSelected && comparisonFull}
            aria-label={`Comparar ${application.name} · ${title}`} onChange={event => onCompare(event.target.checked)} /> Comparar
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${stage.color}`} />{stage.label}{Number.isInteger(stageAge) && ' · ' + stageAge + ' d'}
        </span>
        <span className="rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-800">{fit === null ? 'Aderência sem cálculo' : `Aderência ${fit}%`}</span>
        {application.candidateUpdatePending && <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-900">Currículo atualizado pelo candidato</span>}
      </div>
      <p className={`mt-3 text-xs ${expired ? 'font-semibold text-rose-700' : expiring ? 'font-semibold text-amber-800' : 'text-slate-600'}`}>
        {expired ? 'Retenção encerrada em' : 'Currículo disponível até'} {retentionLabel}{application.retentionExtendedCount ? ' · prazo prorrogado' : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onDownload} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Baixar currículo</button>
        {onAdmission && stage.id === 'hired' && <button type="button" onClick={onAdmission} className={actionClass}>Preparar admissão</button>}
        {application.candidateUpdatePending && <button type="button" onClick={onAcknowledge} className={actionClass}>Marcar atualização como revisada</button>}
        {!isRejected && expiring && !application.retentionExtendedCount &&
          <button type="button" onClick={onExtend} className={actionClass}>Prorrogar 90 dias</button>}
      </div>
      <details className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-700">
        <summary className="cursor-pointer font-bold text-blue-800">Currículo, quiz e compatibilidade</summary>
        <div className="mt-3 space-y-2">
          {(application.email || application.phone) && <p className="break-words">{[application.email, application.phone].filter(Boolean).join(' · ')}</p>}
          {application.resumeText && <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words">{application.resumeText}</p>}
          {(application.quizQuestions || []).map((question, index) => (
            <p key={index}><strong>{question.question}</strong><br />{question.options?.[application.quizAnswers?.[index]] || 'Sem resposta'}</p>
          ))}
          <div className="space-y-1 rounded-xl bg-slate-50 p-3">
            <strong>Critérios de compatibilidade</strong>
            <p>{application.fit?.version === 3
              ? `${application.fit.matchedCount} de ${application.fit.criteriaCount} critérios identificados na descrição, nas experiências e nos requisitos da vaga.`
              : 'Recalcule a compatibilidade para incluir a descrição e os requisitos disponíveis.'}</p>
            <p>Informados pelo candidato: {(application.fit?.matchedDeclared || application.fit?.matched || []).join(', ') || 'Nenhum'}</p>
            <p>Encontrados no currículo ou resumo: {(application.fit?.matchedFromCv || []).join(', ') || 'Nenhum'}</p>
            {(application.fit?.evidenceFromCv || []).map(item => (
              <p key={item.skill} className="border-l-2 border-emerald-200 pl-2"><strong>{item.skill}</strong> “{item.excerpt}” ({item.source})</p>
            ))}
            <p>Não identificados: {(application.fit?.missing || []).join(', ') || 'Nenhum'}</p>
            {application.resumeAnalysisPartial && <p className="font-semibold text-amber-800">O currículo ultrapassou o limite da análise de texto. Confira o arquivo completo.</p>}
            {application.resumeReadable === false && <p className="font-semibold text-amber-800">A leitura automática do arquivo falhou. Abra o currículo para revisar.</p>}
          </div>
          <button type="button" disabled={Boolean(refreshingFit)} onClick={onRefreshFit} className={actionClass}>
            {refreshingFit === application.id ? 'Recalculando…' : 'Recalcular compatibilidade'}
          </button>
        </div>
      </details>
      {(canAssess || application.aiAssessment) && <details className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-700">
        <summary className="cursor-pointer font-bold text-blue-800">Parecer assistido por IA</summary>
        <p className="mt-2 text-slate-600">Use o parecer como apoio à avaliação do RH.</p>
        {assessmentStale && <p className="mt-2 font-semibold text-amber-800">A vaga ou o currículo mudou desde este parecer.</p>}
        {application.aiAssessment && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3">{application.aiAssessment}</p>}
        {canAssess && <button type="button" disabled={Boolean(analyzing)} onClick={onAssessment} className={`mt-2 ${actionClass}`}>
          {analyzing === application.id ? 'Gerando parecer…' : application.aiAssessment ? 'Atualizar parecer' : 'Gerar parecer'}
        </button>}
      </details>}
      {!isRejected && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <select aria-label={`Etapa de ${application.name}`} value={stage.id} onChange={event => onStageChange(event.target.value)} className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">
          {CAREER_STAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <button type="button" onClick={onAdvance} className={actionClass}>Pré-selecionar e avisar</button>
        <button type="button" onClick={onInterview} className={actionClass}>Agendar entrevista</button>
        <button type="button" onClick={onReject} className="px-2 py-2 text-xs font-bold text-rose-800">Descartar e avisar</button>
      </div>}
    </article>
  );
}
