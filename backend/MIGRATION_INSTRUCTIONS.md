# Migration Instructions

## Apply Customer Models Migration

The migration file has been created at:
`prisma/migrations/20251117000000_add_customer_models/migration.sql`

To apply it, run one of the following commands:

### Development:
```bash
npx prisma migrate dev
```

### Production:
```bash
npx prisma migrate deploy
```

### Or apply directly via PostgreSQL:
```bash
psql $DATABASE_URL < prisma/migrations/20251117000000_add_customer_models/migration.sql
```

After running the migration, generate the Prisma client:
```bash
npx prisma generate
```

## Next: Update Seed

After applying the migration, update `prisma/seed.ts` to create sample customers and customer phones.

