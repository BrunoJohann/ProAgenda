# ProAgenda - Dashboard Administrativo

Dashboard completo para gestão do sistema ProAgenda.

## 🚀 Funcionalidades

- Gestão de Filiais
- Gestão de Profissionais e Períodos de Trabalho
- Gestão de Serviços  
- Agendamentos com Calendário Visual
- Gestão de Clientes
- Gestão de Usuários e Roles (RBAC)
- Métricas e Relatórios
- Bloqueios de Horário

## 🔧 Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form + Zod
- Zustand

## 📦 Instalação

```bash
# Na raiz do monorepo
pnpm install

# Rodar apenas o admin
pnpm --filter @proagenda/admin dev
```

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Rotas

- `/login` - Autenticação
- `/dashboard` - Visão geral
- `/filiais` - Gestão de filiais
- `/profissionais` - Gestão de profissionais
- `/servicos` - Gestão de serviços
- `/agendamentos` - Gestão de agendamentos
- `/clientes` - Gestão de clientes
- `/usuarios` - Gestão de usuários
- `/metricas` - Dashboards e relatórios

## 🔐 Credenciais de Teste

Após rodar o seed do backend:

- **Email**: owner@acme.com
- **Senha**: owner123
- **Tenant**: acme

## 📝 Licença

MIT
