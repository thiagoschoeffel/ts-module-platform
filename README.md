# TS Module Platform

Remote federado da administração global do SaaS. O host mantém rotas e sessão; este módulo recebe `platformRequest` e nunca seleciona tenant para obter poderes globais.

## Desenvolvimento

```bash
npm install
npm run dev
```

O remote usa `modulePlatform`, expõe `./PlatformPage` e reserva a porta `4177` com `strictPort`.

Nesta fatia, empresas, detalhe e auditoria usam exclusivamente `/api/platform/*`. Onboarding permanece indisponível até os contratos S03/S04 existirem.
