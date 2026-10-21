# Fase 5 — experiência e organização

## Primeiro bloco publicado em 12/10/2026

A Central de Documentos agora permite definir uma pasta ao publicar e mudar de pasta documentos existentes sem reenviar o arquivo. Documentos antigos sem o novo campo aparecem em “Sem pasta”. A lista oferece pastas derivadas dos documentos acessíveis ao usuário, filtros combináveis de categoria, setor, tipo de arquivo e leitura pendente, busca por nome de arquivo e ordenação por título ou recência. O número de documentos disponíveis e de leituras pendentes aparece no topo.

O acesso aos documentos continua condicionado ao setor nas regras existentes; a interface não amplia permissões. A mudança de pasta usa a permissão administrativa já existente, sem nova coleção ou serviço pago.

Validação: 38 testes locais aprovados, incluindo casos de documentos antigos e combinação de filtros; build Vite aprovado. Hosting publicado nos dois domínios; ambos responderam HTTP 200 com `/assets/index-D2We3TCP.js`.

Limites: não houve teste visual autenticado em celular nem importação ou reorganização automática de documentos reais. As pastas são metadados dos documentos, não diretórios físicos no Storage. Próximos blocos: revisão visual em telas pequenas, fluxo de documentos vencidos/revisão e estados claros de carregamento/vazio/erro nas telas mais usadas.

## Segundo bloco publicado em 12/10/2026

Prazos de revisão são classificados por data civil: vencidos, próximos (0 a 30 dias) e em dia. A Central mostra contadores clicáveis e os cartões destacam itens vencidos ou próximos. Administradores podem atualizar a próxima revisão sem reenviar o arquivo; cada alteração acrescenta um registro com prazo anterior, novo prazo, autor e data. Em telas pequenas, os filtros avançados ficam recolhidos sob “Mais filtros”, preservando busca, pastas e indicadores visíveis.

Validação: 39 testes locais aprovados e build Vite aprovado. Hosting publicado nos dois domínios; ambos responderam HTTP 200 com `/assets/index-DuimpC32.js`.

Limites: o histórico registra mudança do prazo, não comprova que o conteúdo do arquivo foi revisado. Não houve teste visual autenticado no celular; esse é o próximo ensaio da fase.

## Enquetes, formulários e Banco de Talentos — 12/10/2026

Enquetes e Clima agora têm indicadores de votos, participação dos colaboradores atuais e resultados por alternativa. Formulários podem ter várias perguntas com votação por alternativa. A administração pode filtrar as pesquisas por texto e situação.

O Banco de Talentos permite criar vagas públicas por empresa, receber inscrições de qualquer pessoa após cadastro básico e confirmação de e-mail, e aplicar um questionário comportamental simples. O candidato informa dados e competências, anexa um currículo em PDF ou Word moderno (.docx) de até 4 MB e consente com o uso dos dados para a candidatura. Os arquivos ficam em área privada do Storage; o download é autorizado apenas ao próprio candidato ou administrador da empresa. A indicação de competências considera o que foi declarado e o texto que for possível extrair do arquivo, sem rejeição automática. PDF digitalizado pode não ter texto selecionável; nesse caso, o currículo permanece disponível para leitura humana.

Antes do uso público, revisar aviso de privacidade, prazo de retenção, exclusão de dados e proteção antimalware dos arquivos. O indicador de aderência não substitui avaliação humana e não constitui decisão de contratação.

Publicação: seis funções de candidatura, regras Firestore e Hosting dos dois domínios publicados; provedor Firebase de e-mail/senha ativado. Os dois sites e a rota `/carreiras` responderam HTTP 200. A função pública de vagas respondeu corretamente “Empresa não encontrada” para uma empresa de teste inexistente. Os 42 testes de interface e os testes unitários de candidatura passaram. O teste integrado com emuladores não pôde ser repetido nesta máquina porque o Java não está disponível; uma candidatura real de ponta a ponta ainda precisa de validação acompanhada.
