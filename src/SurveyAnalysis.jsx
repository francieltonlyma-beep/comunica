import { useEffect, useId, useRef, useState } from 'react';
import { summarizeSurvey } from './surveyAnalysis.js';

const number = new Intl.NumberFormat('pt-BR');
const score = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const formatScore = value => value == null ? '—' : `${score.format(value)} / 5`;
const formatPercent = value => value == null ? '—' : percent.format(value);

function ChartRow({ label, value, max, detail }) {
  return <div className="survey-report-option">
    <span>{label}</span><strong>{detail}</strong>
    <meter min={0} max={max || 1} value={value} aria-label={label} />
  </div>;
}

export default function SurveyAnalysis({ report, onClose }) {
  const titleId = useId();
  const closeButton = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();
    return () => previous?.focus();
  }, []);
  const [selectedTopic, setSelectedTopic] = useState('');
  const summary = summarizeSurvey(report);
  const details = report.topics.filter(topic => !selectedTopic || topic.id === selectedTopic);

  function download() {
    const cell = value => `"${String(value ?? '').replace(/^[\s=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [['Pesquisa', 'Tópico', 'Pergunta', 'Alternativa', 'Respostas', 'Percentual', 'Média (escala)']];
    for (const topic of report.topics) {
      for (const q of topic.questions) {
        for (const option of q.options) rows.push([report.title, topic.title, q.question, option.label, option.count, option.percentage, q.average ?? '']);
      }
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analise-pesquisa.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="survey-overlay survey-analysis-overlay" onKeyDown={event => {
    if (event.key === 'Escape') onClose();
  }}>
    <main className="survey-surface survey-analysis" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="survey-close" ref={closeButton} onClick={onClose}>Fechar análise ×</button>
      <header className="survey-analysis-header">
        <div>
          <p className="survey-eyebrow">Análise de resultados · RH</p>
          <h2 className="survey-report-title" id={titleId}>{report.title}</h2>
          <p>Resultados agregados por pesquisa, tópico e pergunta.</p>
        </div>
        <button type="button" className="survey-primary" onClick={download}>Exportar análise CSV</button>
      </header>

      <div className="survey-metrics">
        <div><span>Participações</span><strong>{number.format(report.respondents)}</strong><small>{number.format(report.answers)} respostas às perguntas</small></div>
        <div><span>Conclusão</span><strong>{formatPercent(summary.completion)}</strong><small>{report.completed} completas · {report.partial} parciais</small></div>
        <div><span>Pontuação geral</span><strong>{formatScore(summary.average)}</strong><small>{summary.total} notas na escala de 1 a 5</small></div>
        <div><span>Favorabilidade</span><strong>{formatPercent(summary.favorable)}</strong><small>Proporção de notas 4 e 5</small></div>
      </div>

      <section className="survey-analysis-card">
        <h3>Resumo automático</h3>
        {!report.respondents && <p>A pesquisa ainda não recebeu respostas. Volte após a coleta para acompanhar os resultados.</p>}
        {report.respondents > 0 && <>
          <p>{number.format(report.respondents)} participações registradas, com {report.completed} completas e {report.partial} parciais.
            {summary.total > 0 && ` A média foi de ${formatScore(summary.average)}, com ${formatPercent(summary.favorable)} de notas favoráveis.`}</p>
          {summary.strengths.length > 0 && <p><strong>Destaque positivo</strong> · {summary.strengths[0].title} obteve {formatScore(summary.strengths[0].average)}. Identifique as práticas que a equipe pode manter ou replicar.</p>}
          {summary.attention.length > 0 && <p><strong>Pontos de atenção</strong></p>}
          {summary.attention.length > 0 && <ul>{summary.attention.map(topic => <li key={topic.id}>{topic.title} · {formatScore(topic.average)}</li>)}</ul>}
          {summary.attention.length > 0 && <p>Revise as perguntas com menores notas nesses tópicos, discuta as causas com a equipe e defina uma ação com responsável e prazo.</p>}
          {summary.total > 0 && !summary.attention.length && <p>Nenhum tópico ficou abaixo de 3,50. Confira a distribuição por pergunta para identificar possíveis divergências de percepção.</p>}
          {!summary.total && <p>Para analisar estas respostas, abra o detalhamento e compare as alternativas mais e menos escolhidas.</p>}
          {report.partial > 0 && <p>Para reduzir respostas parciais, revise a clareza das perguntas e o tempo necessário para concluir o formulário.</p>}
        </>}
      </section>

      <div className="survey-analysis-charts">
        <section className="survey-analysis-card">
          <h3>Pontuação por tópico</h3>
          {summary.scoredTopics.length ? summary.scoredTopics.map(topic =>
            <ChartRow key={topic.id} label={topic.title} value={topic.average} max={5} detail={formatScore(topic.average)} />
          ) : <p>Nenhum tópico tem notas registradas.</p>}
        </section>
        <section className="survey-analysis-card">
          <h3>Distribuição de notas</h3>
          {summary.total ? summary.distribution.map((count, index) =>
            <ChartRow key={index} label={`Nota ${index + 1}`} value={count} max={summary.total} detail={`${number.format(count)} · ${percent.format(count / summary.total)}`} />
          ) : <p>A distribuição aparece quando houver respostas em escala.</p>}
        </section>
      </div>

      <p className="survey-report-note">A pontuação geral dá o mesmo peso a cada nota registrada. A conclusão considera quem participou da pesquisa. Participações públicas são contadas por navegador. Interprete as médias junto com o volume de respostas.</p>

      <section className="survey-analysis-card">
        <header className="survey-analysis-header">
          <h3>Detalhamento por pergunta</h3>
          <label>Tópico
            <select value={selectedTopic} onChange={event => setSelectedTopic(event.target.value)}>
              <option value="">Todos os tópicos</option>
              {report.topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
            </select>
          </label>
        </header>
        {details.map(topic => <section key={topic.id} className="survey-response-topic">
          <h2>{topic.title}</h2>
          {topic.questions.map(q => <article className="survey-report-question" key={q.id}>
            <h3>{q.question}</h3>
            <p>{q.responses} resposta(s){q.average != null && ` · Média ${formatScore(q.average)} · ${q.favorable}% favoráveis`}</p>
            {q.options.map((option, index) => <ChartRow key={index} label={option.label} value={option.count} max={q.responses} detail={`${option.count} · ${option.percentage}%`} />)}
          </article>)}
        </section>)}
      </section>
    </main>
  </div>;
}
