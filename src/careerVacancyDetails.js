export const CAREER_DETAIL_FIELDS = [
  { key: 'experience', label: 'Experiências esperadas', example: 'Experiência com atendimento ao público' },
  { key: 'benefits', label: 'Benefícios', example: 'Vale-alimentação' },
  { key: 'requirements', label: 'Formação e requisitos', example: 'Ensino médio completo' },
  { key: 'workSchedule', label: 'Jornada e horários', example: 'Segunda a sexta, das 8h às 17h' },
  { key: 'contractType', label: 'Regime de contratação', example: 'CLT' },
];

export const CAREER_LIBRARY_ITEM_LIMIT = 240;
export const CAREER_DETAIL_LIMIT = 1600;

export function appendCareerDetail(current, text) {
  const lines = current.trim().split('\n').map(line => line.trim().toLocaleLowerCase('pt-BR'));
  if (lines.includes(text.toLocaleLowerCase('pt-BR'))) return current;
  const next = [current.trim(), text].filter(Boolean).join('\n');
  return next.length <= CAREER_DETAIL_LIMIT ? next : null;
}
