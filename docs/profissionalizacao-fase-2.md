# Fase 2: seguranca (em andamento)

## Integracao local seguinte (nao publicada)

Login conectado ao verificador privado com migracao transacional do PIN legado. Nova changeOwnPin valida sessao e usa exclusivamente uid/companyId autenticados, nao IDs enviados pelo cliente. Duas telas de troca de PIN usam a funcao do servidor. Suporte passou a procurar UID reservado e flag isDeveloper, mas ainda requer uma identidade configurada fora dos perfis editaveis para endurecimento completo.

Validacoes: tres testes do modulo passaram (inclui migracao concorrente, repeticao idempotente, preservacao de PIN ja alterado e ausencia de PIN padrao para conta sem credencial). Compilacao TypeScript aprovada. Nao equivale a testes ponta a ponta de endpoints.

BLOQUEIO DE PUBLICACAO TECNICO: ainda adaptar reset administrativo, criacao/edicao de colaborador, registro de empresa e regras/caches; essas rotinas antigas nao podem coexistir em producao com a migracao ativa. Nenhuma migracao real ou deploy realizado. Proxima entrega deve concluir esses fluxos e testar autorizacao do servidor, inclusive suporte. Os avisos anteriores de modulo desconectado descrevem o estado anterior.

## Credenciais privadas: modulo preparado e testado

functions/src/privateCredentials.ts implementa hash scrypt com salt aleatorio, verificacao com comparacao de tempo constante, chave composta de aplicativo/empresa/usuario e persistencia fora da arvore publica em _privateCredentials. Verificacao transacional bloqueia a conta por 15 minutos apos cinco erros. Troca verifica o PIN atual e a revisao para impedir sobrescrita por verificacao obsoleta. create nao sobrescreve credencial existente. Nao ha fallback de PIN.

Validacao: compilacao TypeScript passou; node --test functions/tests/privateCredentials.test.cjs passou com dois testes que cobrem hashing, entradas invalidas, criacao duplicada, isolamento de empresas, erros concorrentes, bloqueio/expiracao, troca de PIN e ausencia de texto puro. Executado apenas no Firestore Emulator com usuarios ficticios; emulador encerrado.

IMPORTANTE: modulo ainda nao integrado aos endpoints de producao nem ao frontend. Nenhuma migracao de credenciais reais realizada. O chamador devera validar identidade e autorizacao antes de usar as primitivas; nao expor create/change diretamente. Falta definir identidade de suporte no servidor, endpoints autorizados, reset administrativo seguro, mitigacao de abuso por origem, migracao idempotente e testes ponta a ponta. PIN curto continua sendo segredo de baixa entropia mesmo com hash; acesso de suporte precisa autenticacao mais forte. Bloqueio por conta pode ser abusado para negar acesso e necessita politica complementar antes de producao.

Regras candidatas exclusivamente locais em tests/security/firestore.users.candidate.rules. NAO publicar esse arquivo: outras colecoes sao negadas; PINs ainda sao legiveis nos cadastros; autenticacao de suporte ainda depende de nome/PIN.

Ensaio real no Firestore Emulator 1.22.0 em 127.0.0.1:8080, projeto ficticio demo-comunica-security: scripts/test-user-permissions.ps1 concluiu MATRIZ_DE_ESCRITA_VALIDADA. Tres preparacoes e onze cenarios de escrita passaram: contato proprio, dispositivo proprio, bloqueio de autopromocao, elevacao a suporte, PIN de terceiro, escrita entre empresas, cadastro por colaborador, cadastro permitido ao administrador, criacao indevida de suporte, modificacao indevida do suporte e suporte entre empresas. Testes usam apenas dados ficticios. Emulador encerrado.

Limites: nao testa leitura, exclusao, sessao revogada, todos os tipos de campo nem interacao real do frontend. Suporte e administradores ainda dependem das claims do token. Nenhuma regra de producao foi modificada.

Proximo bloco necessario: mover credenciais para documentos privados exclusivos do servidor, com hash, validacao e limitacao de tentativas; trocar identificacao por nome por identidade de suporte fixa configurada no servidor; criar operacoes autenticadas de troca/reset de PIN; atualizar frontend para nao depender de currentUser.pin; migracao idempotente preservando PINs existentes; testes de login e recuperacao antes do deploy coordenado de funcoes, regras e frontend. Nao registrar PINs, hashes ou tokens em relatorios.
