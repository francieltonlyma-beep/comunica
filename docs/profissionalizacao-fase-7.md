# Fase 7 — Operação comercial multiempresa

## Objetivo

Transformar o acesso exclusivo do suporte em um painel operacional capaz de acompanhar várias empresas sem misturar dados, perder chamados ou depender de listas extensas.

## Entregas desta etapa

- painel executivo com empresas atendidas, chamados abertos, não lidos e vencidos;
- fila de suporte priorizada por leitura, prazo e atualização;
- busca por empresa, código, solicitante, assunto e número do ticket;
- filtros rápidos para pendentes, não lidos, vencidos e concluídos;
- diretório pesquisável de empresas, com volume de chamados por ambiente;
- acesso direto do chamado para a conversa correta no ambiente correspondente;
- remoção da ação pontual de exclusão do relato de teste, que não fazia parte da operação permanente;
- preservação das ferramentas de backup e restauração apenas no acesso de suporte.

## Bloco 2 — Implantação e adoção

- resumo de saúde calculado exclusivamente no servidor e acessível somente ao suporte autorizado;
- indicadores de equipe, acessos recentes, colaboradores sem primeiro acesso e dispositivos com notificações;
- checklist de implantação para equipe, setores, cargos, permissões, comunicação, documentos e notificações;
- saúde geral com fórmula visível: 60% implantação, 30% adoção recente e 10% alcance das notificações;
- percentuais separados de implantação, adoção e notificações, sem classificação oculta de clientes;
- atualização sob demanda com cache de cinco minutos e limite de cem empresas por consulta;
- processamento sequencial por empresa para evitar picos de leitura no Firebase;
- acesso direto do cartão de saúde para o ambiente selecionado;
- ausência de nomes de colaboradores ou conteúdo interno no resumo multiempresa.

## Próximas evoluções previstas

1. histórico de atendimento e SLA do suporte da plataforma;
2. gestão de plano e limites sem cobrança automática nesta etapa;
3. exportação de relatório operacional para apresentação comercial;
4. fluxo guiado de implantação com responsáveis e datas previstas.
