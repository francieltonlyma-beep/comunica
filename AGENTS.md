# Comunica — instruções para agentes de desenvolvimento

## Objetivo
Faça alterações pequenas, focadas e verificáveis, preservando o comportamento existente do Comunica. Evite consumo desnecessário de contexto, chamadas e reanálises.

## Stack confirmada
- React 19, Vite 8, JavaScript (ES modules).
- Firebase (Firestore, Hosting, Storage e outros recursos definidos em `firebase.json`).
- Capacitor para integração mobile.
- Consulte `package.json` e arquivos de configuração antes de assumir detalhes.

## Fluxo eficiente
1. Leia este arquivo e identifique os arquivos diretamente ligados ao pedido; não percorra o repositório inteiro sem necessidade.
2. Verifique se há trabalho existente e evite sobrescrever mudanças de outros agentes.
3. Faça um plano curto, agrupando mudanças relacionadas (ex.: filtros de escala e central de permissões).
4. Altere somente os arquivos necessários. Preserve interfaces, regras de acesso, dados e comportamento não relacionados.
5. Rode verificações proporcionais à mudança: `npm run lint` para código JS/JSX e `npm run build` quando aplicável. Se falharem por problemas preexistentes, informe-os separadamente.
6. Ao concluir, apresente arquivos alterados, testes executados, resultados e riscos pendentes de forma breve.

## Segurança e publicação
- Nunca exponha segredos, tokens, chaves privadas ou arquivos `.env`.
- Mudanças em autenticação, Firestore/Storage rules, permissões e operações de escrita exigem análise cuidadosa de segurança.
- Não execute `firebase deploy` nem modifique ambiente de produção como parte de verificações automáticas.
- Não trate um build bem-sucedido como prova de funcionamento de todas as funcionalidades.
- Prefira branches e pull requests para mudanças de infraestrutura.

## Verificações
- Scripts disponíveis na raiz: `npm run lint`, `npm run build`, `npm run build:staging`.
- Use `npm ci` quando houver lockfile compatível; não atualize dependências sem necessidade.
- A automação de CI deve verificar sem publicar, usando permissões mínimas.
