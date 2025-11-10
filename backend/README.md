# ProAgenda Backend

Multi-tenant scheduling system with JWT authentication, RBAC, and intelligent slot management.

## 🚀 Features

- **Multi-tenancy**: Complete tenant isolation with slug-based routing
- **JWT Authentication**: Access (15m) + Refresh (7d) tokens with rotation and session management
- **RBAC**: Role-based access control with scope per Filial (OWNER, ADMIN, MANAGER, OPERATOR, PROFESSIONAL, ANALYST, CUSTOMER)
- **Scheduling Engine**: Smart slot generation with grid-based availability, fairness algorithm, and anti-overbooking
- **Professional Invitations**: Invite professionals via email with one-time tokens
- **Professional Self-Service**: Mini-panel for professionals to manage their schedules, blocks, and appointments
- **ICS Calendar Feeds**: Export schedules to calendar applications
- **Metrics & Analytics**: Occupancy rates, cancel rates, service mix, heatmaps, and performance tracking
- **API Documentation**: Swagger UI at `/docs`

## 📋 Tech Stack

- **Framework**: NestJS 10+
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Argon2 password hashing
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, CORS, Throttler (rate limiting)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Package Manager**: pnpm

## 🛠️ Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 16+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/agenda_mvp"

# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database
pnpm prisma:seed
```

### Running the Application

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3001` and Swagger docs at `http://localhost:3001/docs`.

## 🐳 Docker Setup

```bash
# Start services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📚 API Documentation

### Authentication

**Tenant Handling:**
- **Authenticated routes**: Tenant information comes from the JWT token automatically
- **Public routes**: Include `?tenant=slug` as a query parameter
- **Signup**: Creates a new tenant, no tenant parameter needed

**Signup (Create Tenant + Owner)**
```bash
POST /v1/auth/signup
{
  "tenantName": "Acme Corp",
  "tenantSlug": "acme",
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "SecurePass123!"
}
```

**Login**
```bash
POST /v1/auth/login
{
  "email": "john@acme.com",
  "password": "SecurePass123!"
}
# Returns JWT with tenant information embedded
```

**Refresh Token**
```bash
POST /v1/auth/refresh
{
  "refreshToken": "..."
}
```

**Get Current User**
```bash
GET /v1/auth/me
Headers: 
  Authorization: Bearer <access_token>
```

### Public Endpoints

**Get Available Slots**
```bash
GET /v1/public/slots?tenant=acme&filialId=xxx&date=2025-11-10&serviceIds=svc1,svc2&professionalId=yyy
```

**Create Appointment**
```bash
POST /v1/public/appointments?tenant=acme
{
  "filialId": "xxx",
  "serviceIds": ["svc1", "svc2"],
  "date": "2025-11-10",
  "start": "2025-11-10T14:00:00Z",
  "professionalId": "yyy",
  "customer": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@example.com"
  },
  "notes": "First visit"
}
```

**Cancel Appointment**
```bash
PATCH /v1/public/appointments/:id/cancel?tenant=acme
{
  "reason": "Customer requested"
}
```

### Professional Self-Service

**Get My Appointments**
```bash
GET /v1/me/appointments?from=2025-11-01&to=2025-11-30&status=CONFIRMED
Headers: 
  Authorization: Bearer <access_token>
```

**Cancel My Appointment** (requires 60min notice)
```bash
PATCH /v1/me/appointments/:id/cancel
Headers: 
  Authorization: Bearer <access_token>
{
  "reason": "Emergency"
}
```

**Get My Blocks**
```bash
GET /v1/me/blocks?from=2025-11-01&to=2025-11-30
Headers: 
  Authorization: Bearer <access_token>
```

**Create Block**
```bash
POST /v1/me/blocks
Headers: 
  Authorization: Bearer <access_token>
{
  "startsAt": "2025-11-10T12:00:00Z",
  "endsAt": "2025-11-10T13:00:00Z",
  "reason": "Lunch break"
}
```

### Admin Endpoints

**Update Tenant Information** (OWNER only)
```bash
PATCH /v1/admin/tenants/me
Headers: 
  Authorization: Bearer <access_token>
{
  "tenantName": "Acme Corporation",
  "tenantSlug": "acme-corp"
}
```

**Create Filial**
```bash
POST /v1/admin/filiais
Headers: 
  Authorization: Bearer <access_token>
{
  "name": "Centro",
  "slug": "centro",
  "timezone": "America/Sao_Paulo",
  "address": "Rua das Flores, 123"
}
```

**Update Filial Settings**
```bash
PATCH /v1/admin/filiais/:id/settings
Headers: 
  Authorization: Bearer <access_token>
{
  "slotGranularity": 15
}
```

**Create Professional**
```bash
POST /v1/admin/filiais/:filialId/professionals
Headers: 
  Authorization: Bearer <access_token>
{
  "name": "João Silva",
  "bio": "Experienced barber",
  "specialties": "Haircut, Beard",
  "timezone": "America/Sao_Paulo"
}
```

**Invite Professional**
```bash
POST /v1/admin/professionals/:professionalId/invite
Headers: 
  Authorization: Bearer <access_token>
{
  "email": "professional@example.com",
  "expiresInHours": 72
}
```

**Get Metrics**
```bash
GET /v1/admin/filiais/:id/metrics?from=2025-11-01&to=2025-11-30
Headers: 
  Authorization: Bearer <access_token>
```

### Calendar Feeds

**Professional Calendar Feed**
```bash
GET /v1/public/ics/professional/:professionalId
```

**Single Appointment ICS**
```bash
GET /v1/public/ics/appointment/:id
```

## 🔐 Seed Credentials

After running `pnpm prisma:seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@acme.com | owner123 |
| Admin | admin@acme.com | admin123 |
| Manager | manager@acme.com | manager123 |
| Operator | operator@acme.com | operator123 |
| Professional | joao@acme.com | prof123 |

**Tenant**: `acme`  
**Filiais**: `centro`, `moinhos`

## 📊 Architecture

### Multi-Tenancy
- Tenant isolation via `tenantId` in all queries
- Authenticated routes: Tenant extracted from JWT payload automatically
- Public routes: Tenant provided via `?tenant=slug` query parameter
- Slug-based tenant identification

### RBAC & Scope
- **OWNER**: Full access to all filiais
- **ADMIN**: Full access to all filiais
- **MANAGER**: Access to assigned filiais
- **OPERATOR**: Read/write access to assigned filiais
- **PROFESSIONAL**: Access to own schedule and appointments
- **ANALYST**: Read-only metrics access
- **CUSTOMER**: Future use

### Scheduling Engine
1. **Working Periods**: Define availability per weekday (local time)
2. **Blocks**: Temporary unavailability (UTC)
3. **Appointments**: Confirmed bookings (UTC)
4. **Free Windows**: Working periods minus blocks and appointments
5. **Slot Generation**: Grid-aligned starts within free windows
6. **Fairness Algorithm**: Recommend professional with fewest appointments (tiebreak by createdAt)

### Anti-Overbooking
- Transaction-based booking with conflict detection
- Automatic professional selection if not specified
- Revalidation of availability within transaction

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/          # Shared decorators, guards, pipes
│   ├── core/            # Core modules (Prisma, Auth, Tenancy, Calendar)
│   └── domains/         # Business domains
│       ├── tenants/
│       ├── filiais/
│       ├── users/
│       ├── professionals/
│       ├── services/
│       ├── scheduling/
│       ├── blocks/
│       ├── appointments/
│       └── metrics/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/
└── README.md
```

## 🔧 Environment Variables

See `.env.example` for all available variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for access tokens
- `REFRESH_SECRET`: Secret for refresh tokens
- `APP_DEFAULT_TIMEZONE`: Default timezone
- `SLOT_GRANULARITY_MINUTES`: Default slot granularity (5-60, must divide 60)

## 📝 License

MIT

