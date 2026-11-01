# Verificações do Comunica

O workflow `.github/workflows/ci.yml` executa `npm ci`, `npm run lint`,
`node --test tests/*.test.mjs` e `npm run build` em Node 22, sem publicar.
Use a mesma sequência para validar alterações antes de enviá-las.

## Falhas de 30/10 a 01/11/2026

O job falhava em `Verificar codigo`, com código de saída 1 do ESLint.
No commit `5d48e1e91b17b35b839d51b716e36be46a7c2df0` eram 171 erros
e 15 avisos; o build nem era executado. O workflow de publicação executava
testes e build, mas não lint, explicando os resultados diferentes.

A configuração agora reconhece CommonJS em `comunica/`, o ambiente do
service worker e o token global opcional da aplicação. O SDK gerado em
`src/dataconnect-generated/` não é analisado manualmente.

## Dívida existente de lint

`eslint-suppressions.json` registra 142 violações preexistentes, por arquivo
e regra, usando o mecanismo nativo do ESLint. Isso permite restabelecer o CI
sem refatorar o componente principal e arriscar o comportamento recente.
Essas violações **não foram corrigidas**. Incluem regras de pureza, efeitos,
refs, imutabilidade e variáveis não utilizadas. Os 15 avisos continuam visíveis.

As regras permanecem habilitadas: novos arquivos, novas regras violadas ou
aumento da quantidade por arquivo/regra falham. A lista é baseada em contagens,
não identifica cada ocorrência: uma troca de violações com a mesma contagem
exige revisão do diff. Não regenere nem aumente a lista para fazer o CI passar.
Ao corrigir violações antigas, execute `npx eslint . --prune-suppressions`
e inclua a redução da lista no mesmo commit. O CI não modifica essa lista.

`tests/ciLint.test.mjs` verifica os ambientes e confirma que nomes indefinidos
e aumentos de violações continuam bloqueados.
