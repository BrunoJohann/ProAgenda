<!-- 30ccb358-9f0f-42e3-8c6d-4738a1713f66 f842990a-5086-46e8-afbc-8e9e2991cfe7 -->
# Tenant Update Endpoint Plan

- analyze-current: Review existing tenant module (`tenants.controller.ts`, `tenants.service.ts`) and relevant DTO patterns.
- design-dto-guard: Define update DTO (validate name/slug) and ensure OWNER/ADMIN guard usage.
- implement-service: Add service method to update tenant (handle slug uniqueness, cascade considerations).
- expose-endpoint: Create `PATCH /v1/admin/tenants/me` (or similar) controller route and update Swagger docs.
- update-tests: Add or adjust tests covering successful update and slug conflict error.

### To-dos

- [ ] 