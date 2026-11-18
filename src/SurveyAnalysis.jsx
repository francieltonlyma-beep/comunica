import { useEffect, useId, useRef, useState } from 'react';
import { summarizeSurvey } from './surveyAnalysis.js';

const number = new Intl.NumberFormat('pt-BR');
const score = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const formatScore = value => value == null ? '—' : `${score.format(value)} / 5`;
const formatPercent = value => value == null ? '—' : percent.format(value);

function ChartRow({ label, value, max, detail, tone = 'default' }) {
  return <div className="survey-report-option">
    <span>{label}</span><strong>{detail}</strong>
    <div className="survey-chart-track" aria-hidden="true">
      <div className="survey-chart-fill" data-tone={tone} style={{ width: `${max ? value / max * 100 : 0}%` }} />
    </div>
  </div>;
}

function ScoreOverview({ summary }) {
  const { average, total } = summary;
  const displayedAverage = average == null ? null : Math.round(average * 100) / 100;
  const tone = displayedAverage < 3.5 ? 'low' : displayedAverage < 4 ? 'mid' : 'high';
  const status = { low: 'Ponto de atenção', mid: 'Em acompanhamento', high: 'Favorável' };

  return <section className="survey-analysis-card survey-score">
    <div className="survey-score-heading">
      <h3>Score geral da pesquisa</h3>
      {average != null && <span className="survey-score-status" data-tone={tone}>{status[tone]}</span>}
    </div>
    {average == null ? <p>O score aparece quando houver respostas em perguntas com escala de 1 a 5.</p> : <>
      <p className="survey-score-value"><strong>{score.format(displayedAverage)}</strong> / 5</p>
      <div className="survey-score-axis" aria-hidden="true">
        <div className="survey-score-track" />
        <div className="survey-score-marker" style={{ left: `${(displayedAverage - 1) / 4 * 100}%` }} />
      </div>
      <div className="survey-score-legend">
        <span data-tone="low">1 a menos de 3,50 · Atenção</span>
        <span data-tone="mid">3,50 a menos de 4 · Acompanhamento</span>
        <span data-tone="high">4 a 5 · Favorável</span>
      </div>
      <p>Média de {number.format(total)} notas registradas. {formatPercent(summary.favorable)} foram notas 4 ou 5.</p>
    </>}
  </section>;
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
  const leadingChoice = summary.choices[0];
  const divided = summary.dividedQuestions[0];
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
        <div className="survey-small-actions survey-report-actions">
          <button type="button" onClick={download}>Exportar CSV</button>
          <button type="button" className="survey-primary" onClick={() => window.print()}>Imprimir / salvar PDF</button>
        </div>
      </header>

      <ScoreOverview summary={summary} />

      <div className="survey-metrics survey-score-metrics">
        <div><span>Participações</span><strong>{number.format(report.respondents)}</strong><small>{number.format(report.answers)} respostas às perguntas</small></div>
        <div><span>Conclusão</span><strong>{formatPercent(summary.completion)}</strong><small>{report.completed} completas · {report.partial} parciais</small></div>
        <div><span>Favorabilidade</span><strong>{formatPercent(summary.favorable)}</strong><small>Proporção de notas 4 e 5</small></div>
      </div>

      <section className="survey-analysis-card">
        <h3>Resumo automático</h3>
        {!report.respondents && <p>A pesquisa ainda não recebeu respostas. Volte após a coleta para acompanhar os resultados.</p>}
        {report.respondents > 0 && <>
          <div className="survey-summary-highlights">
            {summary.scoredTopics.length > 0 && <div data-tone={summary.strengths.length ? 'high' : undefined}><span>Tópico com maior score</span><strong>{summary.scoredTopics[0].title}</strong><span>{formatScore(summary.scoredTopics[0].average)}</span></div>}
            {summary.attention.length > 0 && <div data-tone="low"><span>Prioridade de avaliação</span><strong>{summary.attention[0].title}</strong><span>{formatScore(summary.attention[0].average)}</span></div>}
            {divided && <div data-tone="mid"><span>Opiniões divididas</span><strong>{divided.question.question}</strong><span>{formatPercent(divided.low)} notas 1–2 · {formatPercent(divided.high)} notas 4–5</span></div>}
            {!summary.total && leadingChoice && <div><span>{leadingChoice.leaders.length > 1 ? 'Empate entre alternativas' : 'Alternativa mais escolhida'}</span><strong>{leadingChoice.leaders.map(option => option.label).join(', ')}</strong><span>{leadingChoice.question.question}</span></div>}
          </div>
          {summary.attention.length > 1 && <p>Outros pontos de atenção: {summary.attention.slice(1).map(topic => `${topic.title} (${formatScore(topic.average)})`).join(', ')}.</p>}
        </>}
      </section>

      {report.respondents > 0 && <section className="survey-analysis-card survey-report-recommendations">
        <h3>Sugestões automáticas para o RH</h3>
        <ul>
          {summary.attention.length > 0 && <li><strong>Priorizar {summary.attention[0].title}.</strong> Revise as perguntas com menor nota, valide as causas com a equipe e leve à diretoria uma ação com responsável e prazo.</li>}
          {divided && <li><strong>Investigar percepções divididas.</strong> Em “{divided.question.question}”, {formatPercent(divided.low)} deram notas 1–2 e {formatPercent(divided.high)} deram 4–5. Ouça quem teve experiências diferentes antes de decidir uma ação.</li>}
          {leadingChoice && <li><strong>{leadingChoice.leaders.length === 1 ? 'Validar a alternativa mais escolhida' : 'Esclarecer o empate'}.</strong> Em “{leadingChoice.question.question}”, {leadingChoice.leaders.map(option => `“${option.label}”`).join(', ')} {leadingChoice.leaders.length === 1 ? 'recebeu' : 'receberam'} {leadingChoice.leaders[0].count} de {leadingChoice.question.responses} votos {leadingChoice.leaders.length > 1 ? 'cada' : ''}. Confirme o que motivou a escolha antes de definir como agir.</li>}
          {report.partial > 0 && <li><strong>Revisar a conclusão do formulário.</strong> Houve {report.partial} participações parciais. Confira a clareza das perguntas e o tempo para responder.</li>}
          {summary.total > 0 && !summary.attention.length && !divided && <li><strong>Acompanhar no próximo ciclo.</strong> Nenhum tópico ficou abaixo de 3,50. Repita as perguntas de escala para acompanhar mudanças na percepção da equipe.</li>}
        </ul>
      </section>}

      {summary.total > 0 && <div className="survey-analysis-charts">
        <section className="survey-analysis-card">
          <h3>Pontuação média por tópico</h3>
          {summary.scoredTopics.map(topic =>
            <ChartRow key={topic.id} label={topic.title} value={topic.average} max={5} detail={formatScore(topic.average)} />
          )}
        </section>
        <section className="survey-analysis-card">
          <h3>Como as notas se distribuem</h3>
          <p>Veja quantas notas foram baixas, intermediárias ou altas. Uma média de 3 pode vir de notas concentradas em 3 ou de uma divisão entre 1 e 5.</p>
          {[
            ['Baixas · 1 e 2', 'low'],
            ['Intermediárias · 3', 'mid'],
            ['Altas · 4 e 5', 'high'],
          ].map(([label, tone], index) => {
            const count = summary.bands[index];
            return <ChartRow key={tone} label={label} tone={tone} value={count} max={summary.total} detail={`${formatPercent(count / summary.total)} · ${number.format(count)}`} />;
          })}
          <small>Base de cálculo: {number.format(summary.total)} respostas em perguntas de escala.</small>
        </section>
      </div>}

      {leadingChoice && <section className="survey-analysis-card survey-choice-charts">
        <h3>Alternativas escolhidas</h3>
        <p>Perguntas de alternativas com mais respostas. Consulte todos os gráficos no detalhamento por pergunta.</p>
        <div className="survey-analysis-charts">
          {summary.choices.slice(0, 4).map(({ topic, question }) => <article key={question.id} className="survey-report-question">
            <h4>{question.question}</h4>
            <p>{topic.title} · {question.responses} respostas</p>
            {question.options.map((option, index) => <ChartRow key={index} label={option.label} value={option.count} max={question.responses} detail={`${option.percentage}% · ${option.count}`} />)}
          </article>)}
        </div>
      </section>}

      <section className="survey-analysis-card survey-written-suggestions">
        <h3>Sugestões escritas pelos participantes</h3>
        {report.suggestions?.length ? <details>
          <summary>{number.format(report.suggestions.length)} sugestões{report.suggestionsLimited ? ' mais recentes' : ''} · Ver comentários</summary>
          <ul>{report.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul>
        </details> : <p>Ainda não há sugestões escritas.</p>}
      </section>

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
