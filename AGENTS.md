# TS Module Platform

Este remote administra a plataforma SaaS, não a operação de uma empresa.

- Fontes canônicas: `../ts-host/docs`, especialmente `PLATAFORMA_SAAS_BASELINE.md` e ADRs 0016–0019.
- O host é dono de rotas, shell, breadcrumbs e navegação.
- Não instalar router nem importar fontes internas de repositórios irmãos.
- Usar somente o contrato federado e `platformRequest` recebido do host.
- Autorização sempre é aplicada pela API; menus e capacidades locais servem à experiência.
- Não guardar tokens, credenciais ou convites em `localStorage`.
- Não simular persistência em modo conectado.
- Não misturar plano SaaS com planos comerciais de refeições.
- Usar `@thiagoschoeffel/ts-components` e seguir `GUIA UI.md`.
- Antes de concluir: typecheck, build, budget, contrato no host e `git diff --check`.
