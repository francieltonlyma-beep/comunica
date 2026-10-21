# Fase 6 — privacidade e controle do candidato

## Primeiro bloco — 12/10/2026

O portal público de carreiras passou a oferecer recuperação de senha, consulta da situação da candidatura e retirada pelo próprio candidato autenticado. Ao retirar uma candidatura, a função confere a identidade e remove o registro da candidatura, o texto extraído para análise e o currículo armazenado para aquela vaga. O cadastro básico do candidato é preservado para que ele possa se candidatar a outra vaga sem preencher tudo novamente.

Antes do consentimento, a tela explica quais dados serão compartilhados, a finalidade da análise, o caráter apenas indicativo da compatibilidade automática e a possibilidade de retirada. Cada nova candidatura registra a versão do aviso aceita.

Validação: builds de Functions e Vite aprovados; 42 testes da interface e dois testes unitários do Banco de Talentos aprovados. O ensaio completo em Firestore e Storage Emulator confirmou publicação da vaga, perfil, upload, candidatura, consulta da situação, controle de download e retirada com exclusão do arquivo e da análise.

Limites: esta entrega não constitui adequação jurídica completa à LGPD. Ainda faltam política pública completa, canal formal para solicitações do titular, prazo de retenção configurável, exclusão integral do cadastro básico e proteção antimalware dos anexos. A empresa deve definir essas regras antes de uma operação comercial ampla.

## Segundo bloco — 12/10/2026

Foi criada a página pública `/privacidade`, vinculada ao portal de carreiras, com explicações sobre responsáveis, dados tratados, finalidade, compartilhamento, análise automática, segurança e controles disponíveis. O texto evita prometer decisão automática ou segurança absoluta.

O candidato autenticado agora pode excluir definitivamente o cadastro. O processo localiza as candidaturas vinculadas à identidade, remove currículos do Storage, candidaturas, textos extraídos, limites técnicos de upload, perfil básico e, por último, a conta de autenticação. A operação é limitada a 100 candidaturas por execução para evitar exclusão parcial acima do limite seguro; casos maiores exigem atendimento.

Validação: builds Vite e Functions aprovados. O ensaio integrado com Auth, Firestore e Storage Emulator confirmou exclusão do perfil, candidatura ativa, arquivo e conta de autenticação. Uma confirmação explícita é exibida antes da ação irreversível.

Limites: a política publicada é uma base operacional e precisa de revisão jurídica e identificação formal do fornecedor antes da comercialização ampla. O prazo de retenção ainda não é automatizado e a verificação antimalware dos anexos continua pendente.

## Terceiro bloco — 12/10/2026

Novas candidaturas recebem prazo de retenção de 90 dias. Ao abrir o Banco de Talentos, administradores e profissionais cadastrados em RH recebem um aviso discreto quando há currículos vencidos ou com vencimento nos próximos 15 dias. Cada cartão mostra a data limite. O prazo pode ser prorrogado uma única vez por mais 90 dias, com registro do prazo anterior, novo prazo, autor, data e motivo padronizado.

A limpeza de vencidos exige confirmação dentro da própria tela e remove candidatura, currículo, texto extraído e controle técnico de upload em lotes de até 100. Candidaturas anteriores sem prazo são inicializadas com 90 dias contados da criação ao primeiro acesso autorizado ao módulo. O processo é manual para evitar a contratação de agendamento pago nesta fase.

O acesso ao Banco de Talentos foi ampliado somente para administradores e perfis cujo cargo ou setor identifica RH/Recursos Humanos. Colaboradores comuns e o suporte da plataforma não recebem acesso padrão aos currículos.

Validação: builds Vite e Functions aprovados; 42 testes gerais e três testes unitários do Banco de Talentos aprovados; fluxo integrado de retenção, prorrogação única, inicialização de legado e limpeza passou nos emuladores Auth/Firestore/Storage; matriz específica confirmou acesso de RH e bloqueio de colaborador/candidato; matriz geral de permissões também passou.

Limites: a limpeza ocorre quando um responsável autorizado decide executá-la; não há exclusão agendada em segundo plano. O reconhecimento de RH depende do cargo/setor cadastrado corretamente. A política ainda requer revisão jurídica antes da operação comercial ampla.

Publicação concluída nos dois domínios. Firestore recusou acesso comum nos ensaios, as cinco funções de candidatura/retencão foram criadas ou atualizadas e Hosting respondeu HTTP 200. A função de limpeza respondeu 401 sem autenticação, confirmando a proteção pública básica do endpoint.

## Quarto bloco — tutoriais contextuais — 12/10/2026

As áreas Enquetes e Clima, Central de Documentos e Banco de Talentos passaram a exibir o botão **Como usar** no cabeçalho. O botão abre uma central de aprendizagem responsiva, sem retirar o usuário da atividade atual.

Cada guia explica quem pode usar a ferramenta, apresenta o fluxo completo em etapas e reúne boas práticas. O tutorial do Banco de Talentos cobre publicação e divulgação de vagas, cadastro externo, currículos PDF/Word, questionário, análise humana, etapas e retenção de 90 dias. O de Enquetes cobre formatos, votação e indicadores. O de documentos cobre pastas, categorias, versões, revisões, permissões e confirmação de leitura.

O guia pode ser alternado entre módulos, fechado pelo botão, pelo clique fora da janela ou pela tecla Esc. O conteúdo se adapta a celular e computador e não usa avisos bloqueantes.
