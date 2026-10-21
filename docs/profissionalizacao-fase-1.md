# Comunica: diagnostico e protecao de dados

## Resultado mais recente

Ensaios locais concluidos em 10/10/2026: 925 documentos Firestore comparados integralmente; 93 contas Auth importadas com UID, disabled e customAttributes conferidos; 14 objetos Storage recuperados com tamanho e SHA-256 conferidos. Scripts reproduziveis em scripts/test-firestore-recovery.ps1 e scripts/test-auth-storage-recovery.ps1. Emuladores encerrados. Nenhuma restauracao executada em producao.

Limites: nao e teste ponta a ponta de login, notificacoes, links publicos, IAM ou politica de retencao. Copias dependem da conta Windows (DPAPI). Consumo financeiro real ainda nao foi obtido. As pendencias historicas de ensaio Auth/Storage abaixo foram resolvidas no escopo descrito neste resultado.

## Situacao

Fase 1 em andamento. Inspecao do codigo e das regras publicadas realizada em 10/10/2026. Nao representa certificacao de seguranca nem autorizacao para expandir a operacao.

## Achados priorizados

| Prioridade | Evidencia | Acao e criterio de aceite |
| --- | --- | --- |
| Critica | firestore.rules permite read/write em qualquer documento da empresa a qualquer membro. Regra publicada conferida como igual a local. | Regras por colecao, funcao e autoria; testes de acesso indevido no emulador antes do deploy. |
| Critica | authenticateDeveloper procura nome e PIN e concede privilegio global. Cadastros sao editaveis por membros nas regras atuais. | Identidade de suporte fora dos cadastros editaveis e autenticacao forte. Testar tentativa de elevacao de privilegio. |
| Alta | PIN em campo de documento lido por membros; validatePin possui fallback e nao limita tentativas no codigo inspecionado. | Migrar credenciais para armazenamento inacessivel ao cliente, remover fallback e limitar tentativas. |
| Alta | Snapshot vazio dispara escrita de dados iniciais em setupSync. Cache de usuarios prefere updatedAt local superior ao remoto. | Separar inicializacao de sincronizacao; testar exclusao total, reconexao e troca de empresa. Causa dos relatos de reversao ainda nao comprovada. |
| Alta | Cache local utiliza chaves genericas. | Separar cache por empresa/usuario e limpar na troca de contexto; testar em navegador compartilhado. |
| Alta | Faturamento habilitado; recuperacao para ponto no tempo desativada. | Verificar gasto, cotas e politica de recuperacao. Nao ativar servicos pagos nesta fase. |
| Media | generateAiText verifica autenticacao e tamanho do pedido, mas nao ha cota por empresa na funcao inspecionada. | Limites de consumo por empresa e usuario, acompanhamento de uso. |
| Media | Dois codebases de Functions e configuracao App Hosting coexistem com Hosting. | Identificar recursos em uso antes de qualquer limpeza; nao excluir recursos pelo nome. |

## Protecao local

scripts/backup-firestore.ps1 percorre os documentos e subcolecoes de artifacts/comunica-salvador com paginacao. Preserva valores tipados do REST, cifra com DPAPI CurrentUser e verifica decifracao e contagem. backups/ esta excluido do Git e fora da pasta publicada dist.

Limites: exportacao por leitura nao e snapshot atomico. Requer a mesma conta Windows e suas chaves DPAPI para decifrar. Nao cobre Firebase Authentication, arquivos binarios do Storage ou segredos. Leituras consomem cota e podem gerar cobranca; script limita consultas e documentos e falha sem anunciar sucesso se excedidos.

## Recuperacao: procedimento a validar

1. Preservar a copia cifrada e a conta Windows que a criou; nunca publicar backups.
2. Decifrar somente em ambiente controlado, conferir projeto, formato e integridade.
3. Restaurar primeiro em emulador isolado: campos tipados por caminho relativo, sem reaplicar createTime/updateTime do servidor.
4. Comparar contagem, caminhos e valores; exercitar login com usuarios de teste e leitura por empresa. Login real depende tambem de Firebase Auth e funcoes.
5. Antes de restaurar producao, fazer nova copia, definir quais documentos recuperar e verificar conflitos com alteracoes recentes. Nao sobrescrever producao para testar.

Status atualizado: ensaio Firestore concluido. Os 925 documentos foram restaurados no emulador local demo-comunica-recovery, com comparacao de todos os campos aprovada. O processo do emulador foi encerrado. Isso valida recuperacao documental, nao login nem funcionamento integral do app.

Atualizacao: backup concluido em backups/firestore-20261010-165927.dpapi, com 925 documentos e 956 consultas. Decifracao e contagem verificadas. Copia de codigo em backups/codigo-20261010-164206.zip. O script scripts/test-firestore-recovery.ps1 foi preparado para restaurar exclusivamente em 127.0.0.1:8080, projeto demo-comunica-recovery, recusando sobrescrita de documentos existentes. Ainda requer emulador Firestore e PowerShell 7; Java nao foi encontrado no PATH nem nos diretorios usuais consultados. Nao executar em producao.

## Proximas entregas

- Validar recuperacao de identidades e arquivos; obter leitura de consumo real.
- Fase 2: corrigir privilegios e autenticacao com testes de regressao dos fluxos existentes.
- Fase 3: validar sincronizacao, notificacoes e anexos.

Nenhuma alteracao de regras de producao foi feita neste diagnostico.

## Complemento de protecao, 10/10/2026

- Java portatil e emulador baixados de fontes oficiais e verificados por checksum. Ferramentas locais em .tools/ fora do Git e do Hosting.
- scripts/backup-auth-storage.ps1 executado: 93 contas e 14 objetos do Storage (23.567.207 bytes) copiados para backups/auth-storage-20261010-171933. Todos os arquivos cifrados com DPAPI CurrentUser. Anexos conferidos por tamanho e MD5 do objeto, copias conferidas por SHA-256 apos decifracao. Manifesto preserva nomes, versoes e metadados e so e marcado completo no fim.
- Exportacao Auth nao garante recuperacao de senhas e provedores sem configuracoes adicionais; nao foi testada reimportacao de contas. Chaves de servico, segredos e configuracoes de provedores nao fazem parte da copia.
- Consulta de orcamentos retornou HTTP 403. Nao se pode afirmar que nao existem alertas, nem estimar gasto atual. Nenhum recurso pago foi ativado nem permissao de faturamento ampliada.
- Falta ensaio de recuperacao Auth/Storage e plano de copia independente do computador (DPAPI depende da conta Windows). Fase 1 ainda nao encerrada.
