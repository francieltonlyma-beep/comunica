export function schedulePublicationError(error, fallback) {
  const code = String(error?.code || '').replace(/^firestore\//, '');
  if (code === 'planning-stale') return 'A escala mudou em outra sessão. Gere uma nova simulação; nenhuma alteração desta publicação foi salva.';
  const explanations = {
    'permission-denied': 'A conta não recebeu autorização para gravar a escala deste setor. Confira o vínculo do gestor e a permissão de calendário.',
    unauthenticated: 'A sessão expirou. Entre novamente no Comunica e reabra o rascunho.',
    unavailable: 'A conexão com o servidor está indisponível. Salve o rascunho e tente novamente quando a conexão voltar.',
    'resource-exhausted': 'O servidor atingiu um limite temporário de gravação. Salve o rascunho e tente novamente mais tarde.',
    'invalid-argument': 'Há um campo inválido na escala. Revise os horários e os colaboradores selecionados.',
    'failed-precondition': 'O servidor recusou uma condição da publicação. Guarde o rascunho e informe este código ao suporte.',
    aborted: 'Outra gravação interferiu nesta publicação. Aguarde e tente publicar a prévia novamente.',
  };
  return explanations[code] ? `${explanations[code]} (Código: ${code})` : `${fallback}${code ? ` (Código: ${code})` : ''}`;
}
