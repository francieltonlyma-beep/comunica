export function calculatePlr({ weights, companyScore, sectorScore, target, amount, onTime, evaluated }) {
  const scores = [companyScore, sectorScore];
  const isNumber = (value, minimum, maximum) => value !== '' && value != null
    && Number.isFinite(Number(value)) && Number(value) >= minimum && Number(value) <= maximum;
  const weightPoints = weights.map(value => Math.round(Number(value) * 100));
  if (!weights.every(value => isNumber(value, 0, 100)) || weightPoints.reduce((sum, value) => sum + value, 0) !== 10000) {
    return { error: 'Os pesos devem somar 100%.' };
  }
  if (!isNumber(amount, 0.01, 10000000)) return { error: 'Informe o valor-alvo bruto do cargo.' };
  if (scores.some((value, i) => weightPoints[i] > 0 && !isNumber(value, 0, 100))) {
    return { error: 'Informe o atingimento da empresa e do setor para os componentes com peso.' };
  }
  if (weightPoints[2] > 0 && !isNumber(target, 0.01, 100)) return { error: 'Informe a meta de entregas no prazo para o cargo.' };
  if (weightPoints[2] > 0 && !evaluated) return { error: 'Sem conclusões com prazo no ciclo para calcular o componente individual.' };
  const rate = evaluated ? 100 * onTime / evaluated : null;
  const individualScore = weightPoints[2] > 0 ? Math.min(100, 100 * rate / Number(target)) : 0;
  const attainment = [...scores.map(Number), individualScore].map((value, i) => weightPoints[i] ? value : 0);
  const contributions = attainment.map((score, i) => score * weightPoints[i] / 10000);
  const score = contributions.reduce((sum, value) => sum + value, 0);
  return { rate, attainment, contributions, score, total: Math.round(Number(amount) * score) / 100 };
}
