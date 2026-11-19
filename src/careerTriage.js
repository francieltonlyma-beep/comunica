export function careerFitScore(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
}

export function matchesCareerStage(status, stage, fitFilter) {
  const currentStage = status || 'received';
  if (stage !== 'all') return currentStage === stage;
  return currentStage !== 'rejected' || fitFilter === 'scored';
}
