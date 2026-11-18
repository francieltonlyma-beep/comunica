export function summarizeSurvey(report) {
  const distribution = [0, 0, 0, 0, 0];
  const choices = [];
  const dividedQuestions = [];
  for (const topic of report.topics) {
    for (const question of topic.questions) {
      if (!question.responses) continue;
      if (question.type !== 'scale') {
        const ranked = question.options.filter(option => option.count > 0).sort((a, b) => b.count - a.count);
        const leaders = ranked.filter(option => option.count === ranked[0]?.count);
        if (leaders.length) choices.push({ topic, question, leaders });
        continue;
      }
      const counts = question.options.map(option => option.count);
      const low = (counts[0] + counts[1]) / question.responses;
      const high = (counts[3] + counts[4]) / question.responses;
      if (question.responses >= 5 && low >= 0.25 && high >= 0.25) {
        dividedQuestions.push({ topic, question, low, high });
      }
      question.options.slice(0, 5).forEach(({ count }, index) => {
        distribution[index] += count;
      });
    }
  }

  const total = distribution.reduce((sum, count) => sum + count, 0);
  const score = distribution.reduce((sum, count, index) => sum + count * (index + 1), 0);
  const scoredTopics = report.topics.filter(topic => topic.average != null)
    .sort((a, b) => b.average - a.average);

  return {
    distribution,
    bands: [distribution[0] + distribution[1], distribution[2], distribution[3] + distribution[4]],
    choices: choices.sort((a, b) => b.question.responses - a.question.responses),
    dividedQuestions: dividedQuestions.sort((a, b) => Math.min(b.low, b.high) - Math.min(a.low, a.high)),
    total,
    average: total ? score / total : null,
    favorable: total ? (distribution[3] + distribution[4]) / total : null,
    completion: report.respondents ? report.completed / report.respondents : null,
    scoredTopics,
    strengths: scoredTopics.filter(topic => topic.average >= 4),
    attention: scoredTopics.filter(topic => topic.average < 3.5).reverse(),
  };
}

const scorePrecision = new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits: 2 });

export function roundSurveyScore(value) {
  return Number.isFinite(value) ? Number(scorePrecision.format(value)) : null;
}

export function surveyScoreTone(value) {
  const rounded = roundSurveyScore(value);
  if (rounded == null) return null;
  return rounded < 3.5 ? 'low' : rounded < 4 ? 'mid' : 'high';
}

export function filterSurveyDetails(topics, selection) {
  if (!selection) return topics;
  return topics.flatMap(topic => {
    if (selection.topicId && topic.id !== selection.topicId) return [];
    if (selection.kind === 'score' && surveyScoreTone(topic.average) !== selection.band.tone) return [];

    const questions = topic.questions.flatMap(question => {
      if (selection.kind === 'option' && question.id !== selection.questionId) return [];
      if (selection.kind === 'rating' && question.type !== 'scale') return [];
      const options = question.options.map((option, index) => ({ ...option, index }));
      if (selection.kind === 'option') return [{ ...question, options: options.filter(option => option.index === selection.index) }];
      if (selection.kind !== 'rating') return [{ ...question, options }];
      const matches = options.filter(option => selection.band.indexes.includes(option.index) && option.count > 0);
      return matches.length ? [{ ...question, options: matches }] : [];
    });
    return questions.length ? [{ ...topic, questions }] : [];
  });
}
