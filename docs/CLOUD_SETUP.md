# Configuração do Comunica na nuvem

## 1. Repositório

Repositório: https://github.com/francieltonlyma-beep/comunica

Uma tarefa de nuvem precisa do código sincronizado. Ela não recupera alterações locais que ainda não foram enviadas ao GitHub.

## 2. Ambiente no Codex Cloud

Na interface web ou no aplicativo do computador, crie e publique um ambiente do Codex Cloud conectado ao repositório acima.

- Runtime: Node.js 22, versão 22.12 ou superior.
- Instalação: `npm ci`.
- Testes: `node --test tests/*.test.mjs`.
- Compilação: `npm run build`.
- Desenvolvimento: `npm run dev -- --host 0.0.0.0` (porta 5173).

Configure as variáveis listadas em `.env.example` no ambiente. Para compilar e executar os testes de unidade não é necessário autenticar no Firebase. Para acessar a aplicação real, a configuração web do Firebase precisa estar presente.

Depois de publicar o ambiente, selecione-o ao criar uma tarefa pelo celular. Uma tarefa que usa o computador remotamente continua dependendo daquele computador; selecione o ambiente de nuvem para trabalhar independentemente dele.

Guia oficial: https://help.openai.com/en/articles/20001545-using-codex-cloud

## 3. GitHub Actions e Firebase Hosting

Os workflows executam os testes e a compilação. A publicação fica desativada até configurar os acessos abaixo e definir a variável `FIREBASE_DEPLOY_ENABLED` como `true` no repositório.

Em Settings → Secrets and variables → Actions:

1. Cadastre como variables (ou secrets) os nomes `VITE_*` presentes em `.env.example`, usando os valores da configuração de produção. São as configurações web do aplicativo; não inclua credenciais administrativas no pacote Vite.
2. Cadastre o secret `FIREBASE_SERVICE_ACCOUNT_COMUNICA_SALVADOR` com a credencial da conta de serviço autorizada a publicar no Hosting do projeto `comunica-salvador`. Se ela já existir, reutilize-a sem copiá-la para arquivos do repositório.
3. Defina `FIREBASE_DEPLOY_ENABLED=true` somente depois de configurar os valores anteriores.
4. Execute o workflow de publicação manualmente na aba Actions para validar a configuração.

Depois da configuração, alterações na `main` publicam os dois sites de produção. Pull requests internos produzem versões de prévia. Esses workflows publicam somente o Hosting.

Não envie `.env`, backups, arquivos de contas de serviço ou chaves de assinatura para o GitHub.
