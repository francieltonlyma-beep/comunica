export function summarizeSurvey(report) {
  const distribution = [0, 0, 0, 0, 0];
  for (const topic of report.topics) {
    for (const question of topic.questions) {
      if (question.type !== 'scale') continue;
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
    total,
    average: total ? score / total : null,
    favorable: total ? (distribution[3] + distribution[4]) / total : null,
    completion: report.respondents ? report.completed / report.respondents : null,
    scoredTopics,
    strengths: scoredTopics.filter(topic => topic.average >= 4),
    attention: scoredTopics.filter(topic => topic.average < 3.5).reverse(),
  };
}
