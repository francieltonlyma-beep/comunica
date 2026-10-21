# Fase 4 - integridade de interacoes (em andamento)

12/10/2026: o primeiro bloco protegeu confirmacoes de leitura de comunicados e documentos obrigatorios, alem de votos em enquetes. As regras Firestore so aceitam acrescentar o proprio UID uma vez na lista de leitura e criar um voto valido no proprio UID; nem o administrador pode alterar diretamente o historico de confirmacoes ou votos. Administradores continuam podendo editar os demais campos permitidos. A interface passou a usar arrayUnion para confirmacoes e atualizacao pontual do voto, impedindo que escritas simultaneas de colaboradores diferentes se sobrescrevam.

Validacao: teste de SDK cliente no emulador com dois usuarios simultaneos e administrador, incluindo tentativas negadas de forjar/remover confirmacoes e trocar votos; matriz anterior de permissoes passou; 35 testes locais e build Vite passaram. Testes feitos apenas com dados ficticios. Regras Firestore e Hosting publicados; HTTP 200 confirmou index-CqvhiMWq.js nos dois dominios.

Limites: curtidas, comentarios e vencimento de enquetes ainda precisam de regras mais estritas; nao declarar a fase completa. Nao ha teste visual autenticado de todas as telas nem alteracao de dados reais nesta etapa. As regras candidatas de Storage da fase anterior nao estao publicadas.
