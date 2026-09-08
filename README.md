# TS Module Platform

Remote federado da administração global do SaaS. O host mantém rotas e sessão; este módulo recebe `platformRequest` e nunca seleciona tenant para obter poderes globais.

## Desenvolvimento

```bash
npm install
npm run dev
```

O remote usa `modulePlatform`, expõe `./PlatformPage` e reserva a porta `4177` com `strictPort`.

Empresas, auditoria, onboarding durável e ciclo administrativo usam exclusivamente `/api/platform/*`.
No detalhe da empresa, operadores com `platform.organizations.administer` atribuem uma versão
imutável de plano SaaS e ativam, suspendem ou reativam a organização com versão otimista e motivo
auditável. Suspensão preserva os dados e bloqueia as APIs de negócio no servidor.
