<!-- 40ee4823-5e03-4d37-bf4b-e4488606dbca 289c4234-eac9-48b5-81c4-b5f55420fde7 -->
# Remove All X-Tenant References

## 1. Update Swagger Configuration

- Remove `.addApiKey()` line from `backend/src/main.ts` that configures X-Tenant header in API documentation

## 2. Update README Documentation

- Remove statement "All endpoints require the `X-Tenant` header"
- Update all API examples to remove `Headers: X-Tenant: acme` lines
- Update authentication section to explain:
- Authenticated routes use JWT (tenant comes from token)
- Public routes use `?tenant=slug` query parameter
- Only signup doesn't need tenant (creates new one)
- Update architecture description to remove middleware X-Tenant extraction mention

## 3. Fix E2E Tests

- **auth.e2e-spec.ts**: Remove all `.set('X-Tenant', ...)` calls from authenticated requests (5 occurrences)
- **tenants.e2e-spec.ts**: Remove all `.set('X-Tenant', ...)` calls from authenticated requests (11 occurrences)
- Tests should rely on JWT tokens containing tenant information instead

## 4. Verify Changes

- Run linter to check for any issues
- Confirm no remaining X-Tenant references in codebase

### To-dos

- [ ] Remove X-Tenant API key configuration from main.ts Swagger setup
- [ ] Update README to remove X-Tenant header references and document new tenant handling
- [ ] Remove X-Tenant headers from auth.e2e-spec.ts test requests
- [ ] Remove X-Tenant headers from tenants.e2e-spec.ts test requests