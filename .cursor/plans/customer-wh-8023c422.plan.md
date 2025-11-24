<!-- 8023c422-ea46-4bd7-8805-25f35c640655 1fd192a0-2ca8-4c65-a765-8a6582d4b3df -->
# Plano: Sistema de Clientes e Integração WhatsApp

## 1. Schema Prisma - Modelos Customer e CustomerPhone

**Arquivo:** `backend/prisma/schema.prisma`

Adicionar novos enums e modelos:

```prisma
enum PhoneType {
  WHATSAPP
  MOBILE
  HOME
  WORK
}

enum CustomerType {
  REGISTERED
  IDENTIFIED_NO_LOGIN
  WALKIN_NAME_ONLY
}

enum AppointmentSource {
  INTERNAL
  CUSTOMER_PORTAL
  WHATSAPP
  INTEGRATION
}

model Customer {
  id           String   @id @default(cuid())
  tenantId     String
  filialId     String?
  name         String
  email        String?
  document     String?
  documentType String?
  userId       String?  @unique
  createdAt    DateTime @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime @updatedAt @db.Timestamptz(3)

  tenant       Tenant           @relation(fields: [tenantId], references: [id])
  filial       Filial?          @relation(fields: [filialId], references: [id])
  user         User?            @relation(fields: [userId], references: [id])
  phones       CustomerPhone[]
  appointments Appointment[]

  @@unique([tenantId, document])
  @@index([tenantId, email])
}

model CustomerPhone {
  id         String    @id @default(cuid())
  customerId String
  phone      String
  type       PhoneType
  isPrimary  Boolean   @default(false)
  createdAt  DateTime  @default(now()) @db.Timestamptz(3)

  customer Customer @relation(fields: [customerId], references: [id])

  @@index([phone])
}
```

Atualizar modelo `Appointment`:

- Adicionar campos: `customerId`, `customerType`, `source`
- Tornar `customerPhone` opcional
- Adicionar relacionamento com `Customer`

**Enum AppointmentStatus:** Manter apenas `CONFIRMED` e `CANCELED` (já existe, não modificar)

Atualizar relações em `Tenant`, `Filial`, `User`.

## 2. Gerar Migration e Atualizar Seed

**Migration:** Executar `npx prisma migrate dev --name add_customer_models`

**Seed:** `backend/prisma/seed.ts`

- Criar 3-5 Customers de exemplo com telefones variados
- Incluir pelo menos 1 Customer com userId (tipo REGISTERED)
- Criar CustomerPhones com diferentes tipos (WHATSAPP, MOBILE)

## 3. Criar Módulo Customers

**Estrutura:**

```
backend/src/domains/customers/
  ├── customers.module.ts
  ├── customers.service.ts
  ├── customers.controller.ts
  └── dto/
      ├── create-customer.dto.ts
      └── update-customer.dto.ts
```

**Service:** `customers.service.ts`

- `findOrCreateFromInternal(tenantId, data)` - busca por document/email/phone, cria se necessário
- `findOrCreateFromWhatsapp(tenantId, whatsappNumber, name?)` - busca por phone, cria se não existir
- `findOne(tenantId, customerId)` - buscar cliente
- `findByPhone(phone)` - buscar por telefone
- `findByDocument(tenantId, document)` - buscar por documento
- `findByEmail(tenantId, email)` - buscar por email
- `addPhone(customerId, phone, type)` - adicionar telefone

**Controller:** CRUD admin para gerenciar customers (protegido por OWNER/ADMIN/MANAGER)

## 4. Atualizar AppointmentsService

**Arquivo:** `backend/src/domains/appointments/appointments.service.ts`

**Manter intacta:** toda lógica de transaction, anti-overbooking, validações, criação de AppointmentService e StatusHistory.

**Refatorar método `create()`:**

- Extrair lógica central para método privado `_createAppointmentCore(tx, tenant, dto, customerId, customerType, source)`
- Novo método público `createInternal(tenantSlug, dto, userId?)` - para fluxo admin
- Novo método público `createFromCustomerPortal(tenantSlug, userId, dto)` - para cliente logado
- Novo método público `createFromWhatsapp(tenantSlug, dto)` - para integração WhatsApp

**Cada método:**

1. Resolve/cria Customer usando `CustomersService`
2. Define `customerType` e `source` apropriados
3. Chama `_createAppointmentCore()` com os dados

## 5. Novos DTOs para Appointments

**Arquivos:** `backend/src/domains/appointments/dto/`

**`create-internal-appointment.dto.ts`:**

```typescript
{
  filialId: string
  professionalId?: string
  serviceIds: string[]
  date: string
  start: string
  customerId?: string
  newCustomer?: {
    name: string
    phone?: string
    email?: string
    document?: string
    documentType?: string
  }
  notes?: string
}
```

**`create-customer-appointment.dto.ts`:**

```typescript
{
  filialId: string
  professionalId?: string
  serviceIds: string[]
  date: string
  start: string
  notes?: string
}
```

**`create-whatsapp-appointment.dto.ts`:**

```typescript
{
  filialId: string
  professionalId?: string
  serviceIds: string[]
  date: string
  start: string
  whatsappNumber: string
  name?: string
  notes?: string
}
```

## 6. Atualizar AppointmentsController

**Arquivo:** `backend/src/domains/appointments/appointments.controller.ts`

**Depreciar:** Endpoints públicos existentes (manter funcionando, mas marcar como deprecated no Swagger)

**Adicionar novos endpoints:**

### Admin/Interno:

- `POST /v1/admin/filiais/:filialId/appointments` - criar agendamento interno (roles: OWNER/ADMIN/MANAGER/OPERATOR/PROFESSIONAL + ScopeGuard)

### Portal do Cliente:

- `POST /v1/customer/appointments` - criar agendamento como cliente logado (role: CUSTOMER)
- `GET /v1/customer/appointments` - listar meus agendamentos (role: CUSTOMER)
- `PATCH /v1/customer/appointments/:id/cancel` - cancelar meu agendamento (role: CUSTOMER)

## 7. Criar Módulo de Integração WhatsApp

**Estrutura:**

```
backend/src/domains/integrations/
  └── whatsapp/
      ├── whatsapp.module.ts
      ├── whatsapp.controller.ts
      ├── whatsapp-auth.guard.ts
      └── dto/
          └── create-whatsapp-appointment.dto.ts
```

**Guard:** `whatsapp-auth.guard.ts`

- Validar `Authorization: Bearer ${WHATSAPP_INTEGRATION_TOKEN}`
- Token configurado via env `WHATSAPP_INTEGRATION_TOKEN`

**Controller:** `whatsapp.controller.ts`

- `POST /v1/integrations/whatsapp/appointments` - criar agendamento via WhatsApp (protegido pelo guard)

**Service:** Reutilizar `AppointmentsService.createFromWhatsapp()`

## 8. Atualizar MetricsService

**Arquivo:** `backend/src/domains/metrics/metrics.service.ts`

**Adicionar ao retorno de `getFilialMetrics()`:**

```typescript
summary: {
  // ... campos existentes
  bySource: {
    INTERNAL: number
    CUSTOMER_PORTAL: number
    WHATSAPP: number
    INTEGRATION: number
  }
  byCustomerType: {
    REGISTERED: number
    IDENTIFIED_NO_LOGIN: number
    WALKIN_NAME_ONLY: number
  }
}
```

Agregar contagens de `Appointment.source` e `Appointment.customerType`.

## 9. Configuração de Ambiente

**Arquivo:** `backend/src/core/config/env.validation.ts`

Adicionar variável de ambiente:

```typescript
WHATSAPP_INTEGRATION_TOKEN: Joi.string().required()
```

**Arquivo:** `.env.example` (criar se não existir)

- Adicionar `WHATSAPP_INTEGRATION_TOKEN=your_secret_token_here`

## 10. Atualizar Módulos NestJS

**`customers.module.ts`:** Exportar `CustomersService`

**`appointments.module.ts`:** Importar `CustomersModule`

**`whatsapp.module.ts`:** Importar `AppointmentsModule`, `CustomersModule`

**`app.module.ts`:** Importar `CustomersModule`, criar `IntegrationsModule` que importa `WhatsappModule`

## 11. Documentação

**Atualizar:** `backend/ENDPOINTS.md`

- Adicionar seção "Customers (admin)"
- Adicionar seção "Customer Portal"
- Adicionar seção "WhatsApp Integration"
- Marcar endpoints antigos como deprecated

---

**Princípios:**

- ✅ Preservar toda lógica de slots e anti-overbooking
- ✅ Reutilizar método central de criação de appointments
- ✅ Seguir padrões existentes (estrutura de pastas, guards, decorators)
- ✅ Gerar migration e atualizar seed

### To-dos

- [ ] Adicionar enums e modelos Customer/CustomerPhone no schema.prisma
- [ ] Atualizar modelo Appointment com customerId, customerType, source
- [ ] Gerar migration Prisma e atualizar seed.ts
- [ ] Criar módulo Customers completo (service, controller, DTOs)
- [ ] Refatorar AppointmentsService mantendo lógica existente
- [ ] Criar novos DTOs para diferentes fluxos de agendamento
- [ ] Adicionar novos endpoints admin e customer portal no controller
- [ ] Criar módulo WhatsApp com guard de autenticação
- [ ] Adicionar métricas por source e customerType
- [ ] Adicionar WHATSAPP_INTEGRATION_TOKEN nas configs
- [ ] Conectar todos os módulos no app.module.ts
- [ ] Atualizar ENDPOINTS.md com nova documentação