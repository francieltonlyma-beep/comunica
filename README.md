# Comunica

Plataforma de comunicação interna, escalas e calendário com React, Vite e Firebase.

## Desenvolvimento

Requer Node.js 22.12 ou superior na linha 22.

```sh
npm ci
cp .env.example .env
npm run dev
```

Preencha as variáveis do Firebase em `.env`. Esse arquivo não deve ser versionado.

## Verificação

```sh
node --test tests/*.test.mjs
npm run build
```

## Trabalho na nuvem e publicação

Consulte [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md).

Produção: projeto Firebase `comunica-salvador`, sites `comunica-info` e `comunica-salvador`.

```sh
firebase deploy --project comunica-salvador --only hosting
```

As credenciais administrativas permanecem fora do repositório. Os workflows de publicação alteram somente o Hosting.
