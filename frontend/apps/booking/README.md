# ProAgenda - Portal de Agendamento

Interface pública para clientes agendarem serviços.

## 🚀 Funcionalidades

- Wizard step-by-step intuitivo
- Seleção de filial e serviços
- Escolha de profissional (opcional)
- Calendário com slots disponíveis
- Confirmação de agendamento
- Exportar para calendário (ICS)
- Cancelamento de agendamento

## 🔧 Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form + Zod

## 📦 Instalação

```bash
# Na raiz do monorepo
pnpm install

# Rodar apenas o booking
pnpm --filter @proagenda/booking dev
```

A aplicação rodará em http://localhost:3003

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Fluxo de Agendamento

1. Selecionar empresa (tenant)
2. Selecionar filial
3. Escolher serviços
4. Selecionar profissional (ou deixar o sistema escolher)
5. Escolher data e horário
6. Preencher dados pessoais
7. Confirmar agendamento
8. Receber confirmação e opção de exportar para calendário

## 📝 Licença

MIT

