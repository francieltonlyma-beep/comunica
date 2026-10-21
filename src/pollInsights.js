export function pollVoteCount(poll) {
  return Object.keys(poll?.votes || {}).length;
}

export function pollParticipation(poll, employeeIds) {
  if (!employeeIds.length) return 0;
  const eligible = new Set(employeeIds);
  const responses = Object.keys(poll?.votes || {}).filter(uid => eligible.has(uid)).length;
  return Math.round((responses / eligible.size) * 100);
}

export function pollOptionResults(poll) {
  const counts = (poll?.options || []).map(() => 0);
  for (const vote of Object.values(poll?.votes || {})) {
    if (Number.isInteger(vote) && vote >= 0 && vote < counts.length) counts[vote] += 1;
  }
  const validTotal = counts.reduce((sum, count) => sum + count, 0);
  return counts.map((count, index) => ({ option: poll.options[index], count, percentage: validTotal ? Math.round(count / validTotal * 100) : 0 }));
}

export function pollFormCompletion(polls, employeeIds) {
  if (!polls.length || !employeeIds.length) return { completed: 0, percentage: 0 };
  const completed = employeeIds.filter(uid => polls.every(poll => poll.votes?.[uid] !== undefined)).length;
  return { completed, percentage: Math.round(completed / employeeIds.length * 100) };
}

export function normalizePollQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 10) {
    throw new Error('Informe de 1 a 10 perguntas.');
  }
  return questions.map((item, index) => {
    const question = String(item?.question || '').trim();
    const type = ['single', 'yesNo', 'scale', 'mood'].includes(item?.type) ? item.type : 'single';
    const options = (item?.options || []).map(option => String(option || '').trim()).filter(Boolean);
    if (!question) throw new Error(`Escreva o enunciado da pergunta ${index + 1}.`);
    if (options.length < 2 || options.length > 8) throw new Error(`A pergunta ${index + 1} precisa ter de 2 a 8 opções.`);
    return { question, type, options };
  });
}

export function pollTimelineItems(polls) {
  return (polls || [])
    .filter(poll => !poll.formId || Number(poll.formOrder || 0) === 1)
    .map(poll => ({
      ...poll,
      notifType: 'poll',
      category: poll.category || (poll.formId ? 'Pesquisa interna' : 'Enquete'),
      title: poll.formTitle || 'Nova enquete disponível',
      content: poll.formId
        ? `${poll.formQuestionCount || 1} perguntas aguardando a participação da equipe.`
        : poll.question,
    }));
}

export function parsePollFormQuestions(value) {
  const lines = String(value || '').split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 1 || lines.length > 10) throw new Error('Informe de 1 a 10 perguntas.');
  return lines.map((line, index) => {
    const [question, ...options] = line.split('|').map(part => part.trim());
    if (!question || options.length < 2 || options.length > 8 || options.some(option => !option)) {
      throw new Error(`A pergunta ${index + 1} precisa de 2 a 8 opções, separadas por |.`);
    }
    return { question, options };
  });
}
