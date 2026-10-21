# Ambientes do Comunica

## Produção

- Projeto Firebase: `comunica-salvador`
- Sites: `comunica-info` e `comunica-salvador`
- Alias da CLI: `production`
- Comando de compilação: `npm run build`

## Homologação

- Projeto Firebase: `comunica-info-staging`
- Site: `https://comunica-info-staging.web.app`
- Alias da CLI: `staging`
- Comando seguro: `npm run deploy:staging`
- Configuração local: `.env.staging.local` (ignorada pelo versionamento)

O pacote de homologação exibe uma identificação fixa e bloqueia a inicialização
se receber por engano o ID do projeto de produção.

O site e o Firestore de homologação são separados e permanecem no plano sem
custo. Cloud Functions e Cloud Storage não foram ativados nesse projeto porque,
para projetos novos, o Firebase exige vinculação a uma conta de faturamento.
Os fluxos completos dessas duas camadas continuam sendo validados localmente
pelos emuladores de Auth, Firestore e Storage.

Nunca copie dados reais, credenciais, currículos ou denúncias para homologação.
Use apenas cadastros fictícios.
