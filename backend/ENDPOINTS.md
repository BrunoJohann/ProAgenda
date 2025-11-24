# API Endpoint Inventory

This document enumerates all HTTP endpoints exposed by the ProAgenda backend so they can be indexed by downstream tooling.

- Multi-tenancy: most authenticated handlers rely on `CurrentUser('tenant')` to scope data access by tenant slug.
- Authentication: unless marked `Public`, routes require `Authorization: Bearer <JWT>` and pass through `JwtAuthGuard` (refresh token still required where noted).
- Roles & scope: the `Roles` decorator limits access based on Prisma `Role` enum. `ScopeGuard` enforces access to path resources such as filiais, professionals, or services.
- DTOs: payload columns reference Nest DTO classes that describe the expected body schema.

## Authentication (`/v1/auth`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/auth/signup | Create new tenant and owner user | Public | - | Body: `SignupDto` |
| POST | /v1/auth/login | Login with email and password | Public | - | Body: `LoginDto` |
| POST | /v1/auth/refresh | Refresh access token via refresh token | Public | - | Body: `RefreshDto.refreshToken` |
| POST | /v1/auth/logout | Revoke current session (refresh token invalidated) | JWT Bearer | Authenticated user | Body: `RefreshDto.refreshToken` |
| GET | /v1/auth/me | Get current user profile and roles | JWT Bearer | Authenticated user | - |
| POST | /v1/auth/accept-invite | Accept professional invitation and create account | Public | - | Body: `AcceptInviteDto` |

## Tenants (`/v1/admin/tenants`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| GET | /v1/admin/tenants/me | Get current tenant information | JWT Bearer | Roles: OWNER, ADMIN | - |
| PATCH | /v1/admin/tenants/me | Update tenant name and/or slug | JWT Bearer | Role: OWNER | Body: `UpdateTenantDto` |

## Users (`/v1/admin/users`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/admin/users | Create a new user under tenant | JWT Bearer | Roles: OWNER, ADMIN | Body: `CreateUserDto` |
| GET | /v1/admin/users | List users in tenant | JWT Bearer | Roles: OWNER, ADMIN | Query: pagination filters handled in service (if any) |
| GET | /v1/admin/users/:id | Get user by ID | JWT Bearer | Roles: OWNER, ADMIN | Path: `id` |
| GET | /v1/admin/users/:id/roles | Get role assignments for user | JWT Bearer | Roles: OWNER, ADMIN | Path: `id` |
| POST | /v1/admin/users/:id/roles | Assign role to user | JWT Bearer | Roles: OWNER, ADMIN | Path: `id`; Body: `AssignRoleDto` |
| DELETE | /v1/admin/users/:id/roles/:roleId | Remove role from user | JWT Bearer | Roles: OWNER, ADMIN | Path: `id`, `roleId` |

## Filiais (`/v1/admin/filiais`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/admin/filiais | Create a new filial | JWT Bearer | Roles: OWNER, ADMIN | Body: `CreateFilialDto` |
| GET | /v1/admin/filiais | List filiais (filtered by user scope) | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR, ANALYST | - |
| GET | /v1/admin/filiais/:id | Get filial by ID | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR, ANALYST; `ScopeGuard` on `:id` | Path: `id` |
| PATCH | /v1/admin/filiais/:id | Update filial data | JWT Bearer | Roles: OWNER, ADMIN; `ScopeGuard` on `:id` | Path: `id`; Body: `UpdateFilialDto` |
| DELETE | /v1/admin/filiais/:id | Delete filial (only when safe) | JWT Bearer | Role: OWNER | Path: `id` |
| PATCH | /v1/admin/filiais/:id/settings | Update filial scheduling settings | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` on `:id` | Path: `id`; Body: `UpdateSettingsDto` |

## Metrics (`/v1/admin/filiais/:id/metrics`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| GET | /v1/admin/filiais/:id/metrics | Retrieve metrics (summary, timeseries, performance, service mix, heatmap) | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, ANALYST; `ScopeGuard` on `:id` | Path: `id`; Query: `from`, `to` (ISO dates) |

## Professionals (`/v1/admin/filiais/:filialId/professionals`)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/admin/filiais/:filialId/professionals | Create professional | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` on `:filialId` | Path: `filialId`; Body: `CreateProfessionalDto` |
| GET | /v1/admin/filiais/:filialId/professionals | List professionals in filial | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR; `ScopeGuard` | Path: `filialId` |
| GET | /v1/admin/filiais/:filialId/professionals/:pid | Get professional by ID | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR; `ScopeGuard` | Path: `filialId`, `pid` |
| PATCH | /v1/admin/filiais/:filialId/professionals/:pid | Update professional | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `pid`; Body: `UpdateProfessionalDto` |
| DELETE | /v1/admin/filiais/:filialId/professionals/:pid | Delete professional (if no appointments) | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `pid` |
| POST | /v1/admin/filiais/:filialId/professionals/:pid/invite | Send invitation email | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `pid`; Body: `InviteDto` |
| POST | /v1/admin/filiais/:filialId/professionals/:pid/invite/revoke | Revoke pending invitation | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `pid`; Body: `invitationId` string |
| GET | /v1/admin/filiais/:filialId/professionals/:pid/periods | Get working periods | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR; `ScopeGuard` | Path: `pid` |
| POST | /v1/admin/filiais/:filialId/professionals/:pid/periods | Add working period | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `pid`; Body: `CreatePeriodDto` |
| DELETE | /v1/admin/filiais/:filialId/professionals/:pid/periods/:periodId | Delete working period | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `pid`, `periodId` |

## Services (admin + public)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/admin/filiais/:filialId/services | Create service | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`; Body: `CreateServiceDto` |
| GET | /v1/admin/filiais/:filialId/services | List services | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR; `ScopeGuard` | Path: `filialId` |
| PATCH | /v1/admin/filiais/:filialId/services/:sid | Update service | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `sid`; Body: `UpdateServiceDto` |
| DELETE | /v1/admin/filiais/:filialId/services/:sid | Delete service | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `sid` |
| POST | /v1/admin/filiais/:filialId/services/:sid/professionals/:pid | Link professional to service | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `sid`, `pid` |
| DELETE | /v1/admin/filiais/:filialId/services/:sid/professionals/:pid | Unlink professional from service | JWT Bearer | Roles: OWNER, ADMIN, MANAGER; `ScopeGuard` | Path: `filialId`, `sid`, `pid` |
| GET | /v1/public/services | List active services (public catalog) | Public | - | Query: `tenant`, `filialId`, `professionalId?` |

## Customers (admin)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/admin/customers | Create a new customer | JWT Bearer | Roles: OWNER, ADMIN, MANAGER | Body: `CreateCustomerDto` |
| GET | /v1/admin/customers | List all customers | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR | Query: `filialId?` |
| GET | /v1/admin/customers/:id | Get customer by ID | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR | Path: `id` |
| PATCH | /v1/admin/customers/:id | Update customer | JWT Bearer | Roles: OWNER, ADMIN, MANAGER | Path: `id`; Body: `UpdateCustomerDto` |
| DELETE | /v1/admin/customers/:id | Delete customer | JWT Bearer | Roles: OWNER, ADMIN, MANAGER | Path: `id` |

## Appointments (public + internal + customer portal + professional)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| GET | /v1/public/slots | Get available slots for services | Public (rate limited) | - | Query: `tenant`, `filialId`, `date` (ISO), `serviceIds` (comma list), `professionalId?` |
| POST | /v1/public/appointments | Create appointment - **DEPRECATED** | Public (rate limited) | - | Query: `tenant`; Body: `CreateAppointmentDto` |
| PATCH | /v1/public/appointments/:id/cancel | Cancel appointment - **DEPRECATED** | Public | - | Query: `tenant`; Path: `id`; Body: `CancelAppointmentDto` |
| POST | /v1/admin/filiais/:filialId/appointments | Create appointment (internal/admin) | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR, PROFESSIONAL | Path: `filialId`; Body: `CreateInternalAppointmentDto` |
| POST | /v1/customer/appointments | Create appointment (customer portal) | JWT Bearer | Role: CUSTOMER | Body: `CreateCustomerAppointmentDto` |
| GET | /v1/customer/appointments | List my appointments (customer) | JWT Bearer | Role: CUSTOMER | Query: `from?`, `to?`, `status?` |
| PATCH | /v1/customer/appointments/:id/cancel | Cancel my appointment (customer) | JWT Bearer | Role: CUSTOMER | Path: `id`; Body: `CancelAppointmentDto` |
| GET | /v1/me/professional | Get current professional profile & appointments | JWT Bearer | Role: PROFESSIONAL | Requires `professionalId` on JWT |
| GET | /v1/me/appointments | List my appointments (professional) | JWT Bearer | Role: PROFESSIONAL | Query: `from?`, `to?`, `status?` |
| PATCH | /v1/me/appointments/:id/cancel | Cancel my appointment (validates notice) | JWT Bearer | Role: PROFESSIONAL | Path: `id`; Body: `CancelAppointmentDto` |

## WhatsApp Integration

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| POST | /v1/integrations/whatsapp/appointments | Create appointment from WhatsApp | Bearer token (WhatsApp Integration) | - | Body: `CreateWhatsappAppointmentDto` + `tenantSlug` |

## Blocks (admin + professional self-service)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| GET | /v1/admin/professionals/:pid/blocks | List blocks for professional | JWT Bearer | Roles: OWNER, ADMIN, MANAGER, OPERATOR | Path: `pid`; Query: `from?`, `to?` |
| POST | /v1/admin/professionals/:pid/blocks | Create block for professional | JWT Bearer | Roles: OWNER, ADMIN, MANAGER | Path: `pid`; Body: `CreateBlockDto` |
| DELETE | /v1/admin/professionals/:pid/blocks/:blockId | Delete block | JWT Bearer | Roles: OWNER, ADMIN, MANAGER | Path: `pid`, `blockId` |
| GET | /v1/me/blocks | List my blocks | JWT Bearer | Role: PROFESSIONAL | Query: `from?`, `to?` |
| POST | /v1/me/blocks | Create my block | JWT Bearer | Role: PROFESSIONAL | Body: `CreateBlockDto` |
| DELETE | /v1/me/blocks/:blockId | Delete my block | JWT Bearer | Role: PROFESSIONAL | Path: `blockId` |

## Calendar (ICS feeds)

| Method | Path | Summary | Auth | Roles / Scope | Payload & Params |
| --- | --- | --- | --- | --- | --- |
| GET | /v1/public/ics/professional/:professionalId | Download 60-day ICS feed for professional | Public | - | Path: `professionalId` |
| GET | /v1/public/ics/appointment/:id | Download single appointment as ICS | Public | - | Path: `id` |

## Metrics & Reporting Cross-Cutting Notes

- Metrics, professionals, and services admin APIs all apply `ScopeGuard` to ensure the authenticated user can access the path resources.
- Professional self-service routes expect the JWT payload to include `professionalId`; otherwise an error is thrown.
- Public endpoints commonly require the tenant slug via `tenant` query parameter to resolve the tenant context.
- Customer portal routes expect the JWT payload to include a valid `userId` linked to a Customer record.
- WhatsApp integration requires a `WHATSAPP_INTEGRATION_TOKEN` configured via environment variable.

## Customer Types

Appointments now track the customer type:
- **REGISTERED**: Customer has a User account with login (role CUSTOMER)
- **IDENTIFIED_NO_LOGIN**: Customer is identified with contact info but no login
- **WALKIN_NAME_ONLY**: Walk-in customer with only name (no persistent Customer record)

## Appointment Sources

Appointments are tagged with their creation source:
- **INTERNAL**: Created via admin/professional interface
- **CUSTOMER_PORTAL**: Created by logged-in customer
- **WHATSAPP**: Created via WhatsApp integration
- **INTEGRATION**: Created via other integrations

## Metrics

The metrics endpoint (`/v1/admin/filiais/:id/metrics`) now includes:
- `summary.bySource`: Breakdown of appointments by source (INTERNAL, CUSTOMER_PORTAL, WHATSAPP, INTEGRATION)
- `summary.byCustomerType`: Breakdown of appointments by customer type (REGISTERED, IDENTIFIED_NO_LOGIN, WALKIN_NAME_ONLY)
